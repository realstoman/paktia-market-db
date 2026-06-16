<?php

use Illuminate\Support\Facades\Route;

Route::prefix('branch-sync')
    ->name('branch-sync.')
    ->group(base_path('routes/api/v1/branch-sync.php'));
