<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrderController extends Controller
{
    private const ALLOWED_STATUSES = [
        'pending',
        'in_progress',
        'ready',
        'completed',
        'cancelled',
    ];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $selectedDate = $validated['date'] ?? Carbon::today()->toDateString();

        return Inertia::render('orders/index', [
            'orders' => Order::with([
                'branch',
                'user',
                'items.product',
                'items.productSize',
                'items.kitchen',
            ])
                ->whereDate('created_at', $selectedDate)
                ->withCount('items')
                ->orderBy('id')
                ->get(),
            'branches' => Branch::orderBy('name')->get(),
            'products' => Product::with(['sizes', 'kitchen'])
                ->orderBy('name')
                ->get(),
            'selectedDate' => $selectedDate,
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
            'items.*.price' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $productsById = Product::whereIn(
                'id',
                collect($validated['items'])->pluck('product_id')->all(),
            )->get()->keyBy('id');

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

            $orderItems = collect($validated['items'])->map(function ($item) use ($productsById) {
                $product = $productsById->get($item['product_id']);

                return [
                    'product_id' => $item['product_id'],
                    'product_size_id' => $item['product_size_id'] ?? null,
                    'kitchen_id' => $product?->kitchen_id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ];
            })->all();

            $order->items()->createMany($orderItems);
        });

        return redirect()->route('orders.index')
            ->with('success', 'Order created successfully.');
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::ALLOWED_STATUSES)],
        ]);

        $order->update([
            'status' => $validated['status'],
        ]);

        return redirect()->route('orders.index')
            ->with('success', 'Order status updated successfully.');
    }

    public function addItems(Request $request, Order $order)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $order) {
            $productsById = Product::whereIn(
                'id',
                collect($validated['items'])->pluck('product_id')->all(),
            )->get()->keyBy('id');

            $newItems = collect($validated['items'])->map(function ($item) use ($productsById) {
                $product = $productsById->get($item['product_id']);

                return [
                    'product_id' => $item['product_id'],
                    'product_size_id' => $item['product_size_id'] ?? null,
                    'kitchen_id' => $product?->kitchen_id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ];
            })->all();

            $order->items()->createMany($newItems);

            $delta = collect($newItems)->sum(function ($item) {
                return $item['price'] * $item['quantity'];
            });

            $order->update([
                'total_amount' => (int) $order->total_amount + $delta,
            ]);
        });

        return redirect()->route('orders.index')
            ->with('success', 'Order items added successfully.');
    }
}
