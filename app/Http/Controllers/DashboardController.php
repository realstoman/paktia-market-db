<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Services\Dashboard\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user && $user->can(PermissionEnum::DASHBOARD_VIEW->value), 403);

        return Inertia::render('dashboard', [
            'data' => $this->dashboardService->build($user),
        ]);
    }
}
