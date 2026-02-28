<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index()
    {
        $inventoryItems = InventoryItem::with(['branch', 'images', 'transactions'])
            ->orderBy('name')
            ->get()
            ->each(function (InventoryItem $item) {
                $item->images->each->append('url');
            });

        return Inertia::render('inventory/index', [
            'inventoryItems' => $inventoryItems,
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|max:100',
            'unit' => 'nullable|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'is_usable' => 'boolean',
            'images' => 'array|max:10',
            'images.*' => 'image|max:4096',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('inventory/receipts', 'public');
            }

            $item = InventoryItem::create([
                'branch_id' => $validated['branch_id'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'type' => strtolower(trim($validated['type'])),
                'unit' => $validated['unit'] ?? null,
                'quantity' => $validated['quantity'],
                'unit_price' => $validated['unit_price'],
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
}
