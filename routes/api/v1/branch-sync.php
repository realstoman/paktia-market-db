<?php

use App\Http\Controllers\Api\V1\BranchSyncOrderController;
use App\Http\Controllers\Api\V1\RuntimeHealthController;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:branch-sync', 'branch.sync:health.read'])->group(function (): void {
    Route::get('runtime-health', RuntimeHealthController::class)
        ->name('runtime-health');
});

Route::middleware(['throttle:branch-sync', 'branch.sync:orders.pull'])->group(function (): void {
    Route::get('orders/inbound', [BranchSyncOrderController::class, 'inbound'])
        ->name('orders.inbound');
});

Route::middleware(['throttle:branch-sync', 'branch.sync:orders.push'])->group(function (): void {
    Route::post('orders/outbound', [BranchSyncOrderController::class, 'outbound'])
        ->name('orders.outbound');
});
