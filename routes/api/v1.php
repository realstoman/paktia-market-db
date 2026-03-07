<?php

use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');

Route::get('products/categories', [ProductController::class, 'categories'])->name('products.categories.index');
Route::get('products/categories/{category}', [ProductController::class, 'showCategory'])->name('products.categories.show');
Route::get('products/types', [ProductController::class, 'types'])->name('products.types.index');
Route::get('products/types/{type}', [ProductController::class, 'showType'])->name('products.types.show');
Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
