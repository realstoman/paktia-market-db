<?php

namespace App\Http\Controllers;

use App\Services\Caching\CatalogCacheService;
use App\Models\Branch;
use App\Models\Currency;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryType;
use App\Models\Unit;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    private function authorizeInventoryDeletion(Request $request): void
    {
        abort_unless($request->user()?->hasRole('super-admin') === true, 403);
    }

    private function validateReplacementTarget(
        string $field,
        string $resourceName,
        int $currentId,
        ?int $replacementId,
    ): int {
        if (! $replacementId) {
            throw ValidationException::withMessages([
                $field => "This {$resourceName} is assigned to inventory items. Assign those items to another {$resourceName} before deleting it.",
            ]);
        }

        if ($replacementId === $currentId) {
            throw ValidationException::withMessages([
                $field => "Choose a different {$resourceName} before deleting the current one.",
            ]);
        }

        return $replacementId;
    }

    private function redirectToToolbarOrigin(Request $request)
    {
        $referer = $request->headers->get('referer');

        if ($referer && ! str_contains($referer, '/tools/reference-data')) {
            return redirect()->to($referer);
        }

        return redirect()->route('inventory.index');
    }

    private function toolbarResponse(Request $request, string $message, string $fallbackRoute = 'inventory.index')
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        }

        $referer = $request->headers->get('referer');

        if ($referer && ! str_contains($referer, '/tools/reference-data')) {
            return redirect()->to($referer)->with('success', $message);
        }

        return redirect()->route($fallbackRoute)->with('success', $message);
    }

    private const IMAGE_RULE = ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

    public function index()
    {
        $inventoryItems = InventoryItem::with([
            'branch',
            'vendor',
            'unitReference',
            'categoryReference',
            'typeReference',
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
            'inventoryTypes' => InventoryType::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'inventory_type_id' => 'required|exists:inventory_types,id',
            'unit' => 'nullable|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'currency_code' => 'required|string|size:3|exists:currencies,code',
            'vendor_id' => 'nullable|exists:vendors,id',
            'unit_id' => 'nullable|exists:units,id',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'is_usable' => 'boolean',
            'images' => 'array|max:10',
            'images.*' => self::IMAGE_RULE,
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        $total = (float) $validated['quantity'] * (float) $validated['unit_price'];
        if ((float) $validated['paid_amount'] > $total) {
            return back()->withErrors([
                'paid_amount' => 'Paid amount cannot be greater than total amount.',
            ])->withInput();
        }

        DB::transaction(function () use ($validated, $request) {
            $currency = Currency::where(
                'code',
                strtoupper($validated['currency_code']),
            )->firstOrFail();
            $unit = null;
            if (!empty($validated['unit_id'])) {
                $unit = Unit::find($validated['unit_id']);
            }
            $inventoryType = InventoryType::findOrFail(
                $validated['inventory_type_id'],
            );

            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('inventory/receipts', 'public');
            }

            $item = InventoryItem::create([
                'branch_id' => $validated['branch_id'],
                'vendor_id' => $validated['vendor_id'] ?? null,
                'unit_id' => $validated['unit_id'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'inventory_type_id' => $validated['inventory_type_id'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'type' => strtolower(trim($inventoryType->name)),
                'unit' => $unit?->symbol ?? $validated['unit'] ?? null,
                'quantity' => $validated['quantity'],
                'unit_price' => $validated['unit_price'],
                'paid_amount' => $validated['paid_amount'],
                'currency_code' => $currency->code,
                'currency_symbol' => $currency->symbol,
                'receipt_path' => $receiptPath,
                'is_usable' => $validated['is_usable'] ?? true,
            ]);

            $item->transactions()->create([
                'action' => 'initial_stock',
                'quantity' => $validated['quantity'],
                'note' => 'Initial stock created.',
            ]);

            $images = $request->file('images', []);
            foreach ($images as $index => $image) {
                $path = $image->store('inventory', 'public');
                $item->images()->create([
                    'path' => $path,
                    'sort_order' => $index,
                ]);
            }
        });

        return redirect()->route('inventory.index')
            ->with('success', 'Inventory item created successfully.');
    }

    public function restock(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:1000',
            'apply_new_price' => 'sometimes|boolean',
            'currency_code' => 'required_if:apply_new_price,true|string|size:3|exists:currencies,code',
            'unit_price' => 'required_if:apply_new_price,true|numeric|min:0',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        DB::transaction(function () use ($inventory, $validated, $request) {
            if (!empty($validated['apply_new_price'])) {
                $currency = Currency::where(
                    'code',
                    strtoupper($validated['currency_code']),
                )->firstOrFail();

                $inventory->update([
                    'unit_price' => $validated['unit_price'],
                    'currency_code' => $currency->code,
                    'currency_symbol' => $currency->symbol,
                ]);
            }

            if ($request->hasFile('receipt')) {
                $oldReceiptPath = $inventory->receipt_path;
                $newReceiptPath = $request->file('receipt')->store(
                    'inventory/receipts',
                    'public',
                );

                $inventory->update([
                    'receipt_path' => $newReceiptPath,
                ]);

                if ($oldReceiptPath) {
                    $normalizedOldPath = str_starts_with($oldReceiptPath, 'public/')
                        ? str_replace('public/', '', $oldReceiptPath)
                        : $oldReceiptPath;
                    Storage::disk('public')->delete($normalizedOldPath);
                }
            }

            $inventory->increment('quantity', $validated['quantity']);

            $inventory->transactions()->create([
                'action' => 'restock',
                'quantity' => $validated['quantity'],
                'note' => $validated['note']
                    ?? (!empty($validated['apply_new_price'])
                        ? 'Restocked with updated price.'
                        : null),
            ]);
        });

        return redirect()->route('inventory.index')
            ->with('success', 'Inventory item restocked successfully.');
    }

    public function storeUsageCycle(Request $request)
    {
        $validated = $request->validate([
            'usage_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.note' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($validated) {
            $usageDate = Carbon::parse($validated['usage_date'])->startOfDay();

            foreach ($validated['items'] as $index => $entry) {
                $item = InventoryItem::query()
                    ->lockForUpdate()
                    ->findOrFail($entry['inventory_item_id']);

                if (! $item->is_usable) {
                    throw ValidationException::withMessages([
                        "items.$index.inventory_item_id" => 'Selected item is not usable.',
                    ]);
                }

                $usedQuantity = (float) $entry['quantity'];
                $availableQuantity = (float) $item->quantity;

                if ($usedQuantity > $availableQuantity) {
                    throw ValidationException::withMessages([
                        "items.$index.quantity" => 'Used quantity exceeds available stock.',
                    ]);
                }

                $item->decrement('quantity', $usedQuantity);

                $item->transactions()->create([
                    'action' => 'usage_cycle',
                    'quantity' => -$usedQuantity,
                    'note' => $entry['note'] ?? 'Usage cycle entry.',
                    'created_at' => $usageDate,
                    'updated_at' => $usageDate,
                ]);
            }
        });

        return redirect()->route('inventory.index')
            ->with('success', 'Usage cycle saved successfully.');
    }

    public function update(Request $request, InventoryItem $inventory)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'inventory_type_id' => 'required|exists:inventory_types,id',
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
            'images' => 'nullable|array|max:10',
            'images.*' => self::IMAGE_RULE,
            'remove_image_ids' => 'nullable|array',
            'remove_image_ids.*' => 'integer|exists:inventory_item_images,id',
        ]);

        $removeImageIds = collect($validated['remove_image_ids'] ?? []);
        if ($removeImageIds->isNotEmpty()) {
            $validCount = $inventory->images()
                ->whereIn('id', $removeImageIds)
                ->count();

            if ($validCount !== $removeImageIds->count()) {
                throw ValidationException::withMessages([
                    'remove_image_ids' => 'One or more images do not belong to this inventory item.',
                ]);
            }
        }

        $total = (float) $validated['quantity'] * (float) $validated['unit_price'];
        if ((float) $validated['paid_amount'] > $total) {
            return back()->withErrors([
                'paid_amount' => 'Paid amount cannot be greater than total amount.',
            ])->withInput();
        }

        $remainingImageCount = $inventory->images()
            ->whereNotIn('id', $removeImageIds->all())
            ->count();
        $newImages = $request->file('images', []);
        if (($remainingImageCount + count($newImages)) > 10) {
            throw ValidationException::withMessages([
                'images' => 'An inventory item can have at most 10 images.',
            ]);
        }

        DB::transaction(function () use ($inventory, $validated, $request, $removeImageIds) {
            $currency = Currency::where(
                'code',
                strtoupper($validated['currency_code']),
            )->firstOrFail();
            $unit = null;
            if (!empty($validated['unit_id'])) {
                $unit = Unit::find($validated['unit_id']);
            }
            $inventoryType = InventoryType::findOrFail(
                $validated['inventory_type_id'],
            );

            $oldQuantity = (float) $inventory->quantity;
            $newQuantity = (float) $validated['quantity'];

            $payload = [
                'branch_id' => $validated['branch_id'],
                'vendor_id' => $validated['vendor_id'] ?? null,
                'unit_id' => $validated['unit_id'] ?? null,
                'category_id' => $validated['category_id'] ?? null,
                'inventory_type_id' => $validated['inventory_type_id'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'type' => strtolower(trim($inventoryType->name)),
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

            if ($removeImageIds->isNotEmpty()) {
                $imagesToRemove = $inventory->images()
                    ->whereIn('id', $removeImageIds)
                    ->get();

                Storage::disk('public')->delete($imagesToRemove->pluck('path')->all());
                $inventory->images()->whereIn('id', $removeImageIds)->delete();
            }

            $existingImageCount = $inventory->images()->count();
            $newImages = $request->file('images', []);

            foreach ($newImages as $index => $image) {
                $path = $image->store('inventory', 'public');
                $inventory->images()->create([
                    'path' => $path,
                    'sort_order' => $existingImageCount + $index,
                ]);
            }

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

    public function destroy(Request $request, InventoryItem $inventory)
    {
        $this->authorizeInventoryDeletion($request);

        $itemName = $inventory->name;
        $branchName = $inventory->branch?->name;

        DB::transaction(function () use ($inventory) {
            $imagePaths = $inventory->images()
                ->pluck('path')
                ->filter()
                ->all();
            $receiptPath = $inventory->receipt_path;

            // Related rows are removed by FK cascade; delete files explicitly.
            $inventory->delete();

            foreach ($imagePaths as $path) {
                Storage::disk('public')->delete($path);
            }

            if ($receiptPath) {
                $normalizedPath = str_starts_with($receiptPath, 'public/')
                    ? str_replace('public/', '', $receiptPath)
                    : $receiptPath;
                Storage::disk('public')->delete($normalizedPath);
            }
        });

        return redirect()->route('inventory.index')
            ->with('notification', [
                'id' => 'inventory-deleted-'.str()->uuid(),
                'category' => 'inventory',
                'title' => 'Inventory item removed',
                'description' => "{$itemName} was removed from inventory.",
                'meta' => $branchName,
                'href' => '/inventory',
                'priority' => 'high',
            ])
            ->with('success', 'Inventory item deleted successfully.');
    }

    public function storeVendor(Request $request, CatalogCacheService $catalogCacheService)
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
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Vendor created successfully.');
    }

    public function updateVendor(Request $request, Vendor $vendor, CatalogCacheService $catalogCacheService)
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
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Vendor updated successfully.');
    }

    public function destroyVendor(Request $request, Vendor $vendor, CatalogCacheService $catalogCacheService)
    {
        $vendor->delete();
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Vendor deleted successfully.');
    }

    public function storeCurrency(Request $request, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:3|unique:currencies,code',
            'symbol' => 'required|string|max:10',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);

        Currency::create($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Currency created successfully.');
    }

    public function updateCurrency(Request $request, Currency $currency, CatalogCacheService $catalogCacheService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|size:3|unique:currencies,code,'.$currency->id,
            'symbol' => 'required|string|max:10',
            'is_active' => 'boolean',
        ]);

        $validated['code'] = strtoupper($validated['code']);

        $currency->update($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Currency updated successfully.');
    }

    public function destroyCurrency(Request $request, Currency $currency, CatalogCacheService $catalogCacheService)
    {
        $currency->delete();
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Currency deleted successfully.');
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

    public function destroyUnit(Request $request, Unit $unit)
    {
        $this->authorizeInventoryDeletion($request);

        $replacementUnitId = $request->filled('replacement_unit_id')
            ? (int) $request->input('replacement_unit_id')
            : null;

        DB::transaction(function () use ($unit, $replacementUnitId) {
            $itemsQuery = InventoryItem::query()->where('unit_id', $unit->id);

            if ($itemsQuery->exists()) {
                $replacementId = $this->validateReplacementTarget(
                    'replacement_unit_id',
                    'unit',
                    $unit->id,
                    $replacementUnitId,
                );

                $replacementUnit = Unit::query()
                    ->whereKeyNot($unit->id)
                    ->find($replacementId);

                if (! $replacementUnit) {
                    throw ValidationException::withMessages([
                        'replacement_unit_id' => 'Create or select another unit before deleting this one.',
                    ]);
                }

                $itemsQuery->update([
                    'unit_id' => $replacementUnit->id,
                    'unit' => $replacementUnit->symbol,
                ]);
            }

            $unit->delete();
        });

        return redirect()->back()
            ->with('success', 'Unit deleted successfully.');
    }

    public function storeInventoryType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:inventory_types,name',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        InventoryType::create($validated);

        return redirect()->back()
            ->with('success', 'Inventory type created successfully.');
    }

    public function updateInventoryType(
        Request $request,
        InventoryType $inventoryType,
    ) {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:inventory_types,name,'.$inventoryType->id,
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $inventoryType->update($validated);

        return redirect()->back()
            ->with('success', 'Inventory type updated successfully.');
    }

    public function destroyInventoryType(Request $request, InventoryType $inventoryType)
    {
        $this->authorizeInventoryDeletion($request);

        $replacementTypeId = $request->filled('replacement_type_id')
            ? (int) $request->input('replacement_type_id')
            : null;

        DB::transaction(function () use ($inventoryType, $replacementTypeId) {
            $itemsQuery = InventoryItem::query()->where(
                'inventory_type_id',
                $inventoryType->id,
            );

            if ($itemsQuery->exists()) {
                $replacementId = $this->validateReplacementTarget(
                    'replacement_type_id',
                    'type',
                    $inventoryType->id,
                    $replacementTypeId,
                );

                $replacementType = InventoryType::query()
                    ->whereKeyNot($inventoryType->id)
                    ->find($replacementId);

                if (! $replacementType) {
                    throw ValidationException::withMessages([
                        'replacement_type_id' => 'Create or select another inventory type before deleting this one.',
                    ]);
                }

                $itemsQuery->update([
                    'inventory_type_id' => $replacementType->id,
                    'type' => strtolower(trim($replacementType->name)),
                ]);
            }

            $inventoryType->delete();
        });

        return redirect()->back()
            ->with('success', 'Inventory type deleted successfully.');
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

    public function destroyInventoryCategory(
        Request $request,
        InventoryCategory $inventoryCategory,
    ) {
        $this->authorizeInventoryDeletion($request);

        $replacementCategoryId = $request->filled('replacement_category_id')
            ? (int) $request->input('replacement_category_id')
            : null;

        DB::transaction(function () use (
            $inventoryCategory,
            $replacementCategoryId,
        ) {
            $itemsQuery = InventoryItem::query()
                ->where('category_id', $inventoryCategory->id);

            if ($itemsQuery->exists()) {
                $replacementId = $this->validateReplacementTarget(
                    'replacement_category_id',
                    'category',
                    $inventoryCategory->id,
                    $replacementCategoryId,
                );

                $replacementCategory = InventoryCategory::query()
                    ->whereKeyNot($inventoryCategory->id)
                    ->find($replacementId);

                if (! $replacementCategory) {
                    throw ValidationException::withMessages([
                        'replacement_category_id' => 'Create or select another category before deleting this one.',
                    ]);
                }

                $itemsQuery->update([
                    'category_id' => $replacementCategory->id,
                ]);
            }

            $inventoryCategory->delete();
        });

        return redirect()->back()
            ->with('success', 'Category deleted successfully.');
    }
}
