<?php

namespace App\Http\Controllers;

use App\Services\Operations\RuntimeHealthService;
use Inertia\Inertia;
use Inertia\Response;

class OperationsRuntimeHealthController extends Controller
{
    public function __invoke(RuntimeHealthService $runtimeHealthService): Response
    {
        abort_unless(request()->user()?->hasRole('super-admin'), 403);

        return Inertia::render('operations/runtime-health', [
            'runtimeHealth' => $runtimeHealthService->snapshot(),
        ]);
    }
}
