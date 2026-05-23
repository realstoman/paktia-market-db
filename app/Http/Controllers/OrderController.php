<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrderController extends Controller
{
    use AuthorizesRequests;

    private function isOnlineOrdersOperator(Request $request): bool
    {
        return (bool) $request->user()?->hasRole('online-orders-operator');
    }

    public function index(Request $request, OrderService $service)
    {
        // Kitchen users do not have an orders surface in the UI; redirect
        // them to the dashboard rather than serving a 403 page.
        if ($request->user()?->hasRole('kitchen') && ! $request->user()?->hasRole('super-admin')) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'all_time' => ['nullable', 'boolean'],
        ]);

        $isAllTime = (bool) ($validated['all_time'] ?? false);
        $selectedDate = $service->resolveSelectedDate($isAllTime, $validated['date'] ?? null);

        return Inertia::render('orders/index', $service->getIndexData(
            selectedDate: $selectedDate,
            isAllTime: $isAllTime,
            user: $request->user(),
        ));
    }

    public function searchCustomers(Request $request, OrderService $service): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json([
            'data' => $service->searchCustomers($validated['search'] ?? ''),
        ]);
    }

    public function store(Request $request, OrderService $service)
    {
        abort_if($this->isOnlineOrdersOperator($request), 403);
        $this->authorize('create', Order::class);

        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'order_type' => ['required', Rule::in(OrderType::values())],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'branch_table_id' => 'nullable|exists:branch_tables,id',
            'client_id' => 'nullable|exists:clients,id',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'delivery_address' => 'nullable|string|max:2000',
            'covered_by_type' => ['nullable', Rule::in(['customer', 'employee', 'house', 'restaurant'])],
            'covered_by_employee_id' => 'nullable|exists:employees,id',
            'covered_by_note' => 'nullable|string|max:1000',
            'discount_card_id' => [
                'nullable',
                Rule::exists('discount_cards', 'id')->where('is_active', true),
            ],
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
        ]);

        $service->createOrder($validated, $request->user()?->id, $request->user());

        return redirect()->back(fallback: route('orders.index'))
            ->with('success', 'Order created successfully.');
    }

    public function update(Request $request, OrderService $service, Order $order)
    {
        $this->authorize('update', $order);

        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'order_type' => ['required', Rule::in(OrderType::values())],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'branch_table_id' => 'nullable|exists:branch_tables,id',
            'client_id' => 'nullable|exists:clients,id',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'delivery_address' => 'nullable|string|max:2000',
            'covered_by_type' => ['nullable', Rule::in(['customer', 'employee', 'house', 'restaurant'])],
            'covered_by_employee_id' => 'nullable|exists:employees,id',
            'covered_by_note' => 'nullable|string|max:1000',
            'discount_card_id' => [
                'nullable',
                Rule::exists('discount_cards', 'id')->where('is_active', true),
            ],
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
        ]);

        $service->updateOrder($order, $validated, $request->user());

        return redirect()->back(fallback: route('orders.index'))
            ->with('success', 'Order updated successfully.');
    }

    public function updateStatus(Request $request, OrderService $service, Order $order)
    {
        $this->authorize('update', $order);

        $validated = $request->validate([
            'status' => ['required', Rule::in(OrderStatus::values())],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'covered_by_type' => ['nullable', Rule::in(['customer', 'employee', 'house', 'restaurant'])],
            'covered_by_employee_id' => 'nullable|exists:employees,id',
            'covered_by_note' => 'nullable|string|max:1000',
            'discount_card_id' => [
                'nullable',
                Rule::exists('discount_cards', 'id')->where('is_active', true),
            ],
        ]);

        $service->updateStatus(
            $order,
            $validated['status'],
            $validated['payment_method'] ?? null,
            isset($validated['discount_amount']) ? (float) $validated['discount_amount'] : null,
            isset($validated['discount_card_id']) ? (int) $validated['discount_card_id'] : null,
            $validated['covered_by_type'] ?? null,
            isset($validated['covered_by_employee_id']) ? (int) $validated['covered_by_employee_id'] : null,
            $validated['covered_by_note'] ?? null,
            $request->user(),
        );

        return redirect()->back(fallback: route('orders.index'))
            ->with('success', 'Order status updated successfully.');
    }

    public function updateTable(Request $request, OrderService $service, Order $order)
    {
        $this->authorize('update', $order);

        $validated = $request->validate([
            'branch_table_id' => ['required', 'exists:branch_tables,id'],
        ]);

        $service->updateTable($order, (int) $validated['branch_table_id'], $request->user());

        return redirect()->back(fallback: route('orders.index'))
            ->with('success', 'Order table updated successfully.');
    }

    public function addItems(Request $request, OrderService $service, Order $order)
    {
        $this->authorize('update', $order);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_size_id' => 'nullable|exists:product_sizes,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|integer|min:0',
        ]);

        $service->addItems($order, $validated['items'], $request->user());

        return redirect()->back(fallback: route('orders.index'))
            ->with('success', 'Order items added successfully.');
    }
}
