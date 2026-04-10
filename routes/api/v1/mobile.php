<?php

use App\Http\Controllers\Api\V1\Mobile\AuthController;
use App\Http\Controllers\Api\V1\Mobile\CartController;
use App\Http\Controllers\Api\V1\Mobile\CheckoutController;
use App\Http\Controllers\Api\V1\Mobile\GuestSessionController;
use App\Http\Controllers\Api\V1\Mobile\MeController;
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
        Route::get('top-ordered-dishes', [ProductController::class, 'topOrderedDishes'])->name('top-ordered-dishes');
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::get('{product}', [ProductController::class, 'show'])->name('show');
    });

    Route::post('guest/session', [GuestSessionController::class, 'store'])
        ->middleware('idempotency')
        ->name('guest.session.store');
    Route::post('auth/firebase/sync', [AuthController::class, 'firebaseSync'])
        ->middleware(['resolve.guest', 'idempotency'])
        ->name('auth.firebase.sync');

    Route::middleware(['resolve.guest', 'resolve.firebase', 'cart.actor'])->group(function (): void {
        Route::get('cart', [CartController::class, 'show'])->name('cart.show');
        Route::post('cart/items', [CartController::class, 'storeItem'])
            ->middleware('idempotency')
            ->name('cart.items.store');
        Route::patch('cart/items/{cartItem}', [CartController::class, 'updateItem'])
            ->middleware('idempotency')
            ->name('cart.items.update');
        Route::delete('cart/items/{cartItem}', [CartController::class, 'destroyItem'])
            ->middleware('idempotency')
            ->name('cart.items.destroy');
    });

    Route::middleware(['firebase.auth', 'client.auth'])->group(function (): void {
        Route::get('me', [MeController::class, 'show'])->name('me.show');
        Route::get('me/orders', [MeController::class, 'orders'])->name('me.orders.index');
        Route::get('me/orders/{order}', [MeController::class, 'showOrder'])->name('me.orders.show');
        Route::get('me/orders/{order}/status', [MeController::class, 'orderStatus'])->name('me.orders.status');
        Route::post('checkout', [CheckoutController::class, 'store'])
            ->middleware('idempotency')
            ->name('checkout.store');
    });
});
