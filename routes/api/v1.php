<?php

use App\Http\Controllers\Api\V1\BannerController;
use App\Http\Controllers\Api\V1\DigitalTabletMenuController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('banners', [BannerController::class, 'index'])->name('banners.index');
Route::get('banners/{banner}', [BannerController::class, 'show'])->name('banners.show');

Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');

Route::get('digital-tablet-menu/products', [DigitalTabletMenuController::class, 'products'])
    ->name('digital-tablet-menu.products.index');

Route::get('products/categories', [ProductController::class, 'categories'])->name('products.categories.index');
Route::get('products/categories/{category}', [ProductController::class, 'showCategory'])->name('products.categories.show');
Route::get('products/categories/{category}/products', [ProductController::class, 'productsByCategory'])->name('products.categories.products');
Route::get('products/types', [ProductController::class, 'types'])->name('products.types.index');
Route::get('products/types/{type}', [ProductController::class, 'showType'])->name('products.types.show');
Route::get('products/types/{type}/products', [ProductController::class, 'productsByType'])->name('products.types.products');
Route::get('products/top-ordered-dishes', [ProductController::class, 'topOrderedDishes'])->name('products.top-ordered-dishes');
Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');

Route::prefix('mobile')
    ->name('mobile.')
    ->group(base_path('routes/api/v1/mobile.php'));

Route::prefix('branch-sync')
    ->name('branch-sync.')
    ->group(base_path('routes/api/v1/branch-sync.php'));
