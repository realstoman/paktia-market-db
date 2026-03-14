<?php

use App\Http\Controllers\Api\V1\Mobile\AuthController;
use App\Http\Controllers\Api\V1\Mobile\GuestSessionController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware('app.auth')->group(function (): void {
    Route::prefix('products')->name('products.')->group(function (): void {
        Route::get('categories', [ProductController::class, 'categories'])->name('categories.index');
        Route::get('categories/{category}', [ProductController::class, 'showCategory'])->name('categories.show');
        Route::get('categories/{category}/products', [ProductController::class, 'productsByCategory'])->name('categories.products');
        Route::get('types', [ProductController::class, 'types'])->name('types.index');
        Route::get('types/{type}', [ProductController::class, 'showType'])->name('types.show');
        Route::get('types/{type}/products', [ProductController::class, 'productsByType'])->name('types.products');
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::get('{product}', [ProductController::class, 'show'])->name('show');
    });

    Route::post('guest/session', [GuestSessionController::class, 'store'])->name('guest.session.store');
    Route::post('auth/firebase/sync', [AuthController::class, 'firebaseSync'])
        ->middleware('resolve.guest')
        ->name('auth.firebase.sync');
});
