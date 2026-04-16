<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Services\Kitchen\KitchenDashboardService;
use App\Services\Kitchen\KitchenWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KitchenOrderItemController extends Controller
{
    public function __construct(
        private readonly KitchenWorkflowService $workflowService,
        private readonly KitchenDashboardService $dashboardService,
    ) {}

    public function start(Request $request, OrderItem $orderItem): RedirectResponse
    {
        $this->dashboardService->assertAssignedKitchen($request->user());
        $this->workflowService->markInProgress($orderItem, $request->user());

        return redirect()->back()->with('success', 'Kitchen item started.');
    }

    public function ready(Request $request, OrderItem $orderItem): RedirectResponse
    {
        $this->dashboardService->assertAssignedKitchen($request->user());
        $this->workflowService->markReady($orderItem, $request->user());

        return redirect()->back()->with('success', 'Kitchen item marked ready.');
    }

    public function delivered(Request $request, OrderItem $orderItem): RedirectResponse
    {
        $this->dashboardService->assertAssignedKitchen($request->user());
        $this->workflowService->markDelivered($orderItem, $request->user());

        return redirect()->back()->with('success', 'Kitchen item delivered.');
    }
}
