<?php

use App\Http\Controllers\Api\V1\RuntimeHealthController;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:branch-sync', 'branch.sync:health.read'])->group(function (): void {
    Route::get('runtime-health', RuntimeHealthController::class)
        ->name('runtime-health');
});
