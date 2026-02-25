<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchTable;
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
            'all_time' => ['nullable', 'boolean'],
        ]);

        $isAllTime = (bool) ($validated['all_time'] ?? false);
        $selectedDate = $isAllTime
            ? null
            : ($validated['date'] ?? Carbon::today()->toDateString());

        $ordersQuery = Order::with([
            'branch',
            'branchTable',
            'user',
            'items.product',
            'items.productSize',
            'items.kitchen',
        ])->withCount('items')->orderByDesc('id');

        if (! $isAllTime && $selectedDate) {
            $ordersQuery->whereDate('created_at', $selectedDate);
        }

        $restaurantStartDate = Order::query()
            ->orderBy('created_at')
            ->value('created_at');

        return Inertia::render('orders/index', [
            'orders' => $ordersQuery->get(),
            'branches' => Branch::orderBy('name')->get(),
            'products' => Product::with(['sizes', 'kitchen'])
                ->orderBy('name')
                ->get(),
            'branchTables' => BranchTable::where('is_active', true)
                ->orderBy('branch_id')
                ->orderBy('table_number')
                ->get(),
            'selectedDate' => $selectedDate,
            'isAllTime' => $isAllTime,
            'restaurantStartDate' => $restaurantStartDate,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'order_type' => 'required|string|max:50',
            'branch_table_id' => 'nullable|exists:branch_tables,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'delivery_address' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
        ]);

        if (($validated['order_type'] ?? null) === 'dine_in') {
            if (! isset($validated['branch_table_id'])) {
                return back()->withErrors([
                    'branch_table_id' => 'Table number is required for dine in orders.',
                ]);
            }

            $belongsToBranch = BranchTable::query()
                ->whereKey($validated['branch_table_id'])
                ->where('branch_id', $validated['branch_id'])
                ->exists();

            if (! $belongsToBranch) {
                return back()->withErrors([
                    'branch_table_id' => 'Selected table does not belong to the selected branch.',
                ]);
            }
        }

        if (($validated['order_type'] ?? null) === 'delivery') {
            if (empty(trim((string) ($validated['customer_name'] ?? '')))) {
                return back()->withErrors([
                    'customer_name' => 'Customer name is required for delivery orders.',
                ]);
            }

            if (empty(trim((string) ($validated['customer_phone'] ?? '')))) {
                return back()->withErrors([
                    'customer_phone' => 'Customer phone is required for delivery orders.',
                ]);
            }

            if (empty(trim((string) ($validated['delivery_address'] ?? '')))) {
                return back()->withErrors([
                    'delivery_address' => 'Delivery address is required for delivery orders.',
                ]);
            }
        }

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
                'branch_table_id' => $validated['branch_table_id'] ?? null,
                'user_id' => $request->user()?->id,
                'order_type' => $validated['order_type'],
                'customer_name' => $validated['order_type'] === 'delivery'
                    ? trim((string) ($validated['customer_name'] ?? ''))
                    : null,
                'customer_phone' => $validated['order_type'] === 'delivery'
                    ? trim((string) ($validated['customer_phone'] ?? ''))
                    : null,
                'delivery_address' => $validated['order_type'] === 'delivery'
                    ? trim((string) ($validated['delivery_address'] ?? ''))
                    : null,
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

    public function updateTable(Request $request, Order $order)
    {
        $validated = $request->validate([
            'branch_table_id' => ['required', 'exists:branch_tables,id'],
        ]);

        $belongsToBranch = BranchTable::query()
            ->whereKey($validated['branch_table_id'])
            ->where('branch_id', $order->branch_id)
            ->exists();

        if (! $belongsToBranch) {
            return back()->withErrors([
                'branch_table_id' => 'Selected table does not belong to the order branch.',
            ]);
        }

        $order->update([
            'branch_table_id' => $validated['branch_table_id'],
        ]);

        return redirect()->route('orders.index')
            ->with('success', 'Order table updated successfully.');
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
