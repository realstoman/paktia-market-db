<?php

use App\Http\Controllers\Api\V1\BannerController;
use App\Http\Controllers\Api\V1\DigitalTabletMenuController;
use App\Http\Controllers\Api\V1\Mobile\AuthController as MobileAuthController;
use App\Http\Controllers\Api\V1\Mobile\CartController as MobileCartController;
use App\Http\Controllers\Api\V1\Mobile\CheckoutController as MobileCheckoutController;
use App\Http\Controllers\Api\V1\Mobile\GuestSessionController as MobileGuestSessionController;
use App\Http\Controllers\Api\V1\Mobile\MeController as MobileMeController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
Route::get('banners', [BannerController::class, 'index'])->name('banners.index');
Route::get('banners/{banner}', [BannerController::class, 'show'])->name('banners.show');

Route::get('digital-tablet-menu/products', [DigitalTabletMenuController::class, 'products'])
    ->name('digital-tablet-menu.products.index');
Route::get('digital-tablet-menu/categories', [DigitalTabletMenuController::class, 'categories'])
    ->name('digital-tablet-menu.categories.index');
Route::get('digital-tablet-menu/cuisines', [DigitalTabletMenuController::class, 'cuisines'])
    ->name('digital-tablet-menu.cuisines.index');
Route::get('digital-tablet-menu/categories/{category}/products', [DigitalTabletMenuController::class, 'productsByCategory'])
    ->name('digital-tablet-menu.categories.products');
Route::get('digital-tablet-menu/cuisines/{cuisine}/products', [DigitalTabletMenuController::class, 'productsByCuisine'])
    ->name('digital-tablet-menu.cuisines.products');
Route::get('digital-tablet-menu/types', [DigitalTabletMenuController::class, 'types'])
    ->name('digital-tablet-menu.types.index');
Route::get('digital-tablet-menu/types/{type}/products', [DigitalTabletMenuController::class, 'productsByType'])
    ->name('digital-tablet-menu.types.products');
Route::get('products/categories', [ProductController::class, 'categories'])->name('products.categories.index');
Route::get('products/categories/{category}', [ProductController::class, 'showCategory'])->name('products.categories.show');
Route::get('products/categories/{category}/products', [ProductController::class, 'productsByCategory'])->name('products.categories.products');
Route::get('products/cuisines', [ProductController::class, 'cuisines'])->name('products.cuisines.index');
Route::get('products/cuisines/{cuisine}', [ProductController::class, 'showCuisine'])->name('products.cuisines.show');
Route::get('products/cuisines/{cuisine}/products', [ProductController::class, 'productsByCuisine'])->name('products.cuisines.products');
Route::get('products/types', [ProductController::class, 'types'])->name('products.types.index');
Route::get('products/types/{type}', [ProductController::class, 'showType'])->name('products.types.show');
Route::get('products/types/{type}/products', [ProductController::class, 'productsByType'])->name('products.types.products');
Route::get('products/top-ordered-dishes', [ProductController::class, 'topOrderedDishes'])->name('products.top-ordered-dishes');
Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');

Route::middleware('app.auth')->group(function (): void {
    Route::post('guest/session', [MobileGuestSessionController::class, 'store'])
        ->middleware(['throttle:mobile-auth', 'idempotency']);
    Route::post('auth/firebase/sync', [MobileAuthController::class, 'firebaseSync'])
        ->middleware(['throttle:mobile-auth', 'resolve.guest', 'idempotency']);

    Route::middleware(['resolve.guest', 'resolve.firebase', 'cart.actor'])->group(function (): void {
        Route::get('cart', [MobileCartController::class, 'show']);
        Route::post('cart/items', [MobileCartController::class, 'storeItem'])
            ->middleware(['throttle:mobile-cart', 'idempotency']);
        Route::patch('cart/items/{cartItem}', [MobileCartController::class, 'updateItem'])
            ->middleware(['throttle:mobile-cart', 'idempotency']);
        Route::delete('cart/items/{cartItem}', [MobileCartController::class, 'destroyItem'])
            ->middleware(['throttle:mobile-cart', 'idempotency']);
    });

    Route::middleware(['firebase.auth', 'client.auth'])->group(function (): void {
        Route::get('me', [MobileMeController::class, 'show']);
        Route::get('me/orders', [MobileMeController::class, 'orders']);
        Route::get('me/orders/{order}', [MobileMeController::class, 'showOrder']);
        Route::get('me/orders/{order}/status', [MobileMeController::class, 'orderStatus']);
        Route::post('checkout', [MobileCheckoutController::class, 'store'])
            ->middleware(['throttle:mobile-cart', 'idempotency']);
    });
});

Route::prefix('mobile')
    ->name('mobile.')
    ->group(base_path('routes/api/v1/mobile.php'));

Route::prefix('branch-sync')
    ->name('branch-sync.')
    ->group(base_path('routes/api/v1/branch-sync.php'));
