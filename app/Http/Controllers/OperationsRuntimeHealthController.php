<?php

namespace App\Http\Controllers;

use App\Services\Operations\RuntimeHealthService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class OperationsRuntimeHealthController extends Controller
{
    public function __invoke(RuntimeHealthService $runtimeHealthService): Response
    {
        abort_unless(request()->user()?->hasRole('super-admin'), 403);

        return Inertia::render('operations/runtime-health', [
            'runtimeHealth' => $runtimeHealthService->snapshot(),
        ]);
    }

    public function run(RuntimeHealthService $runtimeHealthService): RedirectResponse
    {
        abort_unless(request()->user()?->hasRole('super-admin'), 403);

        try {
            $runtimeHealthService->runChecks();
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'runtime_health' => 'The runtime health checks could not be completed.',
            ]);
        }

        return back();
    }
}
