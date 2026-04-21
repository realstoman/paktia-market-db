<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Services\Kitchen\KitchenDashboardService;
use App\Services\Kitchen\KitchenWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitchenOrderItemController extends Controller
{
    public function __construct(
        private readonly KitchenWorkflowService $workflowService,
        private readonly KitchenDashboardService $dashboardService,
    ) {}

    public function start(Request $request, OrderItem $orderItem): RedirectResponse
    {
        $this->workflowService->markInProgress($orderItem, $request->user());

        return redirect()->back()->with('success', 'Kitchen item started.');
    }

    public function ready(Request $request, OrderItem $orderItem): RedirectResponse
    {
        $this->workflowService->markReady($orderItem, $request->user());

        return redirect()->back()->with('success', 'Kitchen item marked ready.');
    }

    public function delivered(Request $request, OrderItem $orderItem): RedirectResponse
    {
        $this->workflowService->markDelivered($orderItem, $request->user());

        return redirect()->back()->with('success', 'Kitchen item delivered.');
    }

    public function startBulk(Request $request): RedirectResponse|JsonResponse
    {
        return $this->bulkUpdate($request, 'start');
    }

    public function readyBulk(Request $request): RedirectResponse|JsonResponse
    {
        return $this->bulkUpdate($request, 'ready');
    }

    public function deliveredBulk(Request $request): RedirectResponse|JsonResponse
    {
        return $this->bulkUpdate($request, 'delivered');
    }

    private function bulkUpdate(Request $request, string $action): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'item_ids' => ['required', 'array', 'min:1'],
            'item_ids.*' => ['integer', 'exists:order_items,id'],
        ]);

        $items = OrderItem::query()
            ->whereIn('id', $validated['item_ids'])
            ->get();

        foreach ($items as $item) {
            match ($action) {
                'start' => $this->workflowService->markInProgress($item, $request->user()),
                'ready' => $this->workflowService->markReady($item, $request->user()),
                'delivered' => $this->workflowService->markDelivered($item, $request->user()),
            };
        }

        return redirect()->back()->with('success', 'Kitchen items updated.');
    }
}
