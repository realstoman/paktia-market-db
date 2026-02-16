<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Location\BranchController;
use App\Http\Controllers\Location\CountryController;
use App\Http\Controllers\Location\ProvinceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
})->middleware('guest');

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Users
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/block', [UserController::class, 'toggleBlock'])->name('users.block');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    // Route::post('users/{user}/permissions', [UserPermissionController::class, 'store']);
    // Route::delete('users/{user}/permissions', [UserPermissionController::class, 'destroy']);

    // Roles & Permissions
    Route::resource('roles', RoleController::class);
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');

    // Locations
    Route::resource('countries', CountryController::class);
    Route::post('countries/{country}/disable', [CountryController::class, 'disable'])->name('countries.disable');
    Route::resource('provinces', ProvinceController::class);
    Route::resource('branches', BranchController::class);
    Route::post('branches/{branch}/kitchens', [BranchController::class, 'syncKitchens'])->name('branches.kitchens');
    Route::resource('kitchens', KitchenController::class);
    Route::post('kitchens/{kitchen}/toggle', [KitchenController::class, 'toggle'])->name('kitchens.toggle');
    Route::post('branches/{branch}/disable', [BranchController::class, 'disable'])->name('branches.disable');

    // Products & Orders
    Route::resource('products', ProductController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('products/categories', [ProductController::class, 'storeCategory'])->name('products.categories.store');
    Route::delete('products/categories/{category}', [ProductController::class, 'destroyCategory'])->name('products.categories.destroy');
    Route::post('products/types', [ProductController::class, 'storeType'])->name('products.types.store');
    Route::delete('products/types/{type}', [ProductController::class, 'destroyType'])->name('products.types.destroy');
    Route::delete('products/{product}/images/{productImage}', [ProductController::class, 'destroyImage'])->name('products.images.destroy');
    Route::resource('orders', OrderController::class)->only(['index', 'store']);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
    Route::post('orders/{order}/items', [OrderController::class, 'addItems'])->name('orders.items.store');

    // API helpers
    Route::get('countries/{country}/provinces', [ProvinceController::class, 'byCountry']);
});

require __DIR__.'/settings.php';


/*
|--------------------------------------------------------------------------
| Block Registration (IMPORTANT)
|--------------------------------------------------------------------------
*/

// If someone tries /register → redirect to login
Route::any('/register', function () {
    return redirect()->route('login');
});
