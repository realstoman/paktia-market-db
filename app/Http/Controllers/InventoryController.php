<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Currency;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\Unit;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        $inventoryItems = InventoryItem::with([
            'branch',
            'vendor',
            'unitReference',
            'categoryReference',
            'images',
            'transactions',
        ])
            ->orderBy('name')
            ->get()
            ->each(function (InventoryItem $item) {
                $item->images->each->append('url');
            });

        return Inertia::render('inventory/index', [
            'inventoryItems' => $inventoryItems,
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'vendors' => Vendor::orderBy('name')->get(),
            'currencies' => Currency::orderBy('name')->get(),
            'units' => Unit::orderBy('name')->get(),
            'categories' => InventoryCategory::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $isBulkRequest = is_array($request->input('items'));

        $rules = [
            'branch_id' => 'required|exists:branches,id',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|max:100',
            'unit' => 'nullable|string|max:50',
            'paid_amount' => 'required|numeric|min:0',
            'currency_code' => 'required|string|size:3|exists:currencies,code',
            'vendor_id' => 'nullable|exists:vendors,id',
            'unit_id' => 'nullable|exists:units,id',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'is_usable' => 'boolean',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ];

        if ($isBulkRequest) {
            $rules = array_merge($rules, [
                'items' => 'required|array|min:1',
                'items.*.name' => 'required|string|max:255',
                'items.*.quantity' => 'required|numeric|min:0',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.images' => 'nullable|array|max:10',
                'items.*.images.*' => 'image|max:4096',
            ]);
        } else {
            $rules = array_merge($rules, [
                'name' => 'required|string|max:255',
                'quantity' => 'required|numeric|min:0',
                'unit_price' => 'required|numeric|min:0',
                'images' => 'array|max:10',
                'images.*' => 'image|max:4096',
            ]);
        }

        $validated = $request->validate($rules);

        $lineItems = $isBulkRequest
            ? collect($validated['items'])
                ->map(fn ($item) => [
                    'name' => $item['name'],
                    'quantity' => (float) $item['quantity'],
                    'unit_price' => (float) $item['unit_price'],
                ])
                ->values()
                ->all()
            : [[
                'name' => $validated['name'],
                'quantity' => (float) $validated['quantity'],
                'unit_price' => (float) $validated['unit_price'],
            ]];

        $totalAmount = collect($lineItems)->sum(
            fn (array $item) => $item['quantity'] * $item['unit_price'],
        );

        if ((float) $validated['paid_amount'] > $totalAmount) {
            return back()->withErrors([
                'paid_amount' => 'Paid amount cannot be greater than total amount.',
            ])->withInput();
        }

        DB::transaction(function () use ($validated, $request, $lineItems, $isBulkRequest, $totalAmount) {
            $currency = Currency::where(
                'code',
                strtoupper($validated['currency_code']),
            )->firstOrFail();
            $unit = null;
            if (!empty($validated['unit_id'])) {
                $unit = Unit::find($validated['unit_id']);
            }

            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('inventory/receipts', 'public');
            }

            $remainingPaid = (float) $validated['paid_amount'];
            $lastItemIndex = count($lineItems) - 1;

            foreach ($lineItems as $lineIndex => $lineItem) {
                $lineTotal = $lineItem['quantity'] * $lineItem['unit_price'];

                if ($lineIndex === $lastItemIndex) {
                    $linePaid = max(0, $remainingPaid);
                } else {
                    $linePaid = $totalAmount > 0
                        ? round(($lineTotal / $totalAmount) * (float) $validated['paid_amount'], 2)
                        : 0;
                    $linePaid = min($linePaid, $remainingPaid);
                }
                $remainingPaid = max(0, $remainingPaid - $linePaid);

                $item = InventoryItem::create([
                    'branch_id' => $validated['branch_id'],
                    'vendor_id' => $validated['vendor_id'] ?? null,
                    'unit_id' => $validated['unit_id'] ?? null,
                    'category_id' => $validated['category_id'] ?? null,
                    'name' => $lineItem['name'],
                    'description' => $validated['description'] ?? null,
                    'type' => strtolower(trim($validated['type'])),
                    'unit' => $unit?->symbol ?? $validated['unit'] ?? null,
                    'quantity' => $lineItem['quantity'],
                    'unit_price' => $lineItem['unit_price'],
                    'paid_amount' => $linePaid,
                    'currency_code' => $currency->code,
                    'currency_symbol' => $currency->symbol,
                    'receipt_path' => $receiptPath,
                    'is_usable' => $validated['is_usable'] ?? true,
                ]);

                $item->transactions()->create([
                    'action' => 'initial_stock',
                    'quantity' => $lineItem['quantity'],
                    'note' => 'Initial stock created.',
                ]);

                $images = $isBulkRequest
                    ? $request->file("items.$lineIndex.images", [])
                    : $request->file('images', []);

                foreach ($images as $imageIndex => $image) {
                    $path = $image->store('inventory', 'public');
                    $item->images()->create([
                        'path' => $path,
                        'sort_order' => $imageIndex,
                    ]);
                }
            }
        });

        return redirect()->route('inventory.index')
            ->with('success', count($lineItems) > 1
                ? 'Inventory items created successfully.'
                : 'Inventory item created successfully.');
    }

    public function restock(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($inventory, $validated) {
            $inventory->increment('quantity', $validated['quantity']);

            $inventory->transactions()->create([
                'action' => 'restock',
                'quantity' => $validated['quantity'],
                'note' => $validated['note'] ?? null,
            ]);
        });

        return redirect()->route('inventory.index')
            ->with('success', 'Inventory item restocked successfully.');
    }

    public function update(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|max:100',
            'unit' => 'nullable|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'currency_code' => 'required|string|size:3|exists:currencies,code',
            'vendor_id' => 'nullable|exists:vendors,id',
            'unit_id' => 'nullable|exists:units,id',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'is_usable' => 'boolean',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        $total = (float) $validated['quantity'] * (float) $validated['unit_price'];
        if ((float) $validated['paid_amount'] > $total) {
            return back()->withErrors([
                'paid_amount' => 'Paid amount cannot be greater than total amount.',
            ])->withInput();
        }

        DB::transaction(function () use ($inventory, $validated, $request) {
            $currency = Currency::where(
                'code',
                strtoupper($validated['currency_code']),
            )->firstOrFail();
            $unit = null;
            if (!empty($validated['unit_id'])) {
                $unit = Unit::find($validated['unit_id']);
            }

            $oldQuantity = (float) $inventory->quantity;
            $newQuantity = (float) $validated['quantity'];

            $payload = [
                'branch_id' => $validated['branch_id'],
                'vendor_id' => $validated['vendor_id'] ?? null,
                'unit_id' => $validated['unit_id'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'type' => strtolower(trim($validated['type'])),
                'unit' => $unit?->symbol ?? $validated['unit'] ?? null,
                'quantity' => $newQuantity,
                'unit_price' => $validated['unit_price'],
                'paid_amount' => $validated['paid_amount'],
                'currency_code' => $currency->code,
                'currency_symbol' => $currency->symbol,
                'is_usable' => $validated['is_usable'] ?? true,
            ];

            if ($request->hasFile('receipt')) {
                $payload['receipt_path'] = $request->file('receipt')->store('inventory/receipts', 'public');
            }

            $inventory->update($payload);

            $delta = $newQuantity - $oldQuantity;
            if (abs($delta) > 0.00001) {
                $inventory->transactions()->create([
                    'action' => 'adjustment',
                    'quantity' => $delta,
                    'note' => 'Quantity adjusted from item edit.',
                ]);
            }
        });

        return redirect()->route('inventory.index')
            ->with('success', 'Inventory item updated successfully.');
    }

    public function storeVendor(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        Vendor::create($validated);

        return redirect()->back()
            ->with('success', 'Vendor created successfully.');
    }

    public function updateVendor(Request $request, Vendor $vendor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $vendor->update($validated);

        return redirect()->back()
            ->with('success', 'Vendor updated successfully.');
    }

    public function destroyVendor(Vendor $vendor)
    {
        $vendor->delete();

        return redirect()->back()
            ->with('success', 'Vendor deleted successfully.');
    }

    public function storeCurrency(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:3|unique:currencies,code',
            'symbol' => 'required|string|max:10',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);

        Currency::create($validated);

        return redirect()->back()
            ->with('success', 'Currency created successfully.');
    }

    public function updateCurrency(Request $request, Currency $currency)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:3|unique:currencies,code,'.$currency->id,
            'symbol' => 'required|string|max:10',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);

        $currency->update($validated);

        return redirect()->back()
            ->with('success', 'Currency updated successfully.');
    }

    public function destroyCurrency(Currency $currency)
    {
        $currency->delete();

        return redirect()->back()
            ->with('success', 'Currency deleted successfully.');
    }

    public function storeUnit(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:20',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        Unit::create($validated);

        return redirect()->back()
            ->with('success', 'Unit created successfully.');
    }

    public function updateUnit(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:20',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $unit->update($validated);

        return redirect()->back()
            ->with('success', 'Unit updated successfully.');
    }

    public function destroyUnit(Unit $unit)
    {
        $unit->delete();

        return redirect()->back()
            ->with('success', 'Unit deleted successfully.');
    }

    public function storeInventoryCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        InventoryCategory::create($validated);

        return redirect()->back()
            ->with('success', 'Category created successfully.');
    }

    public function updateInventoryCategory(
        Request $request,
        InventoryCategory $inventoryCategory,
    ) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $inventoryCategory->update($validated);

        return redirect()->back()
            ->with('success', 'Category updated successfully.');
    }

    public function destroyInventoryCategory(InventoryCategory $inventoryCategory)
    {
        $inventoryCategory->delete();

        return redirect()->back()
            ->with('success', 'Category deleted successfully.');
    }
}
