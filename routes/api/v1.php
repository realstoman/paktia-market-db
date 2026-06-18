<?php

use Illuminate\Support\Facades\Route;

Route::prefix('property-sync')
    ->name('property-sync.')
    ->group(base_path('routes/api/v1/property-sync.php'));
