<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Services\Dashboard\DashboardService;
use App\Services\Kitchen\KitchenDashboardService;
use App\Services\Operations\OperationsDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
        private readonly OperationsDashboardService $operationsDashboardService,
        private readonly KitchenDashboardService $kitchenDashboardService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user && $user->can(PermissionEnum::DASHBOARD_VIEW->value), 403);

        if ($user->hasAnyRole(['cashier', 'server', 'order-taker'])) {
            return Inertia::render('operations/index', $this->operationsDashboardService->build($user));
        }

        if ($user->hasRole('kitchen')) {
            $validated = $request->validate([
                'report_date' => ['nullable', 'date_format:Y-m-d'],
            ]);

            return Inertia::render('operations/index', $this->kitchenDashboardService->build(
                user: $user,
                reportDate: $validated['report_date'] ?? null,
            ));
        }

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return Inertia::render('dashboard', [
            'data' => $this->dashboardService->build(
                user: $user,
                date: $validated['date'] ?? null,
            ),
        ]);
    }
}
