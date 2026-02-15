<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        return Inertia::render('orders/index', [
            'orders' => Order::with(['branch'])
                ->withCount('items')
                ->latest()
                ->get(),
            'branches' => Branch::orderBy('name')->get(),
            'products' => Product::with(['sizes'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'order_type' => 'required|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $total = collect($validated['items'])->sum(function ($item) {
                return $item['price'] * $item['quantity'];
            });

            $order = Order::create([
                'branch_id' => $validated['branch_id'],
                'user_id' => $request->user()?->id,
                'order_type' => $validated['order_type'],
                'base_currency' => 'AFN',
                'exchange_rate' => null,
                'total_amount' => $total,
                'paid_amount' => $total,
                'change_amount' => 0,
                'status' => 'pending',
            ]);

            $order->items()->createMany($validated['items']);
        });

        return redirect()->route('orders.index')
            ->with('success', 'Order created successfully.');
    }
}
