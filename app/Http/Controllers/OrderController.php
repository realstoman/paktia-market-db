<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request, OrderService $service)
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'all_time' => ['nullable', 'boolean'],
        ]);

        $isAllTime = (bool) ($validated['all_time'] ?? false);
        $selectedDate = $service->resolveSelectedDate($isAllTime, $validated['date'] ?? null);

        return Inertia::render('orders/index', $service->getIndexData(
            selectedDate: $selectedDate,
            isAllTime: $isAllTime,
        ));
    }

    public function store(Request $request, OrderService $service)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'order_type' => ['required', Rule::in(OrderType::values())],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
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

        $service->createOrder($validated, $request->user()?->id);

        return redirect()->route('orders.index')
            ->with('success', 'Order created successfully.');
    }

    public function updateStatus(Request $request, OrderService $service, Order $order)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(OrderStatus::values())],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
        ]);

        $service->updateStatus(
            $order,
            $validated['status'],
            $validated['payment_method'] ?? null,
        );

        return redirect()->route('orders.index')
            ->with('success', 'Order status updated successfully.');
    }

    public function updateTable(Request $request, OrderService $service, Order $order)
    {
        $validated = $request->validate([
            'branch_table_id' => ['required', 'exists:branch_tables,id'],
        ]);

        $service->updateTable($order, (int) $validated['branch_table_id']);

        return redirect()->route('orders.index')
            ->with('success', 'Order table updated successfully.');
    }

    public function addItems(Request $request, OrderService $service, Order $order)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
        ]);

        $service->addItems($order, $validated['items']);

        return redirect()->route('orders.index')
            ->with('success', 'Order items added successfully.');
    }
}
