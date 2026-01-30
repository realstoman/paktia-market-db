<?php

use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
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
    Route::resource('users', UserController::class);
    Route::post('users/{user}/block', [UserController::class, 'block']);
    // Route::post('users/{user}/permissions', [UserPermissionController::class, 'store']);
    // Route::delete('users/{user}/permissions', [UserPermissionController::class, 'destroy']);

    // Roles & Permissions
    Route::resource('roles', RoleController::class);
    Route::get('permissions', [PermissionController::class, 'index']);

    // Locations
    Route::resource('countries', CountryController::class);
    Route::resource('provinces', ProvinceController::class);
    Route::resource('branches', BranchController::class);

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
