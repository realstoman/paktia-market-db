<?php

use App\Enums\PermissionEnum;
use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\CashBankController;
use App\Http\Controllers\CashMovementTypeController;
use App\Http\Controllers\ChartOfAccountController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiscountCardController;
use App\Http\Controllers\EmployeeAdvanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\KitchenOrderItemController;
use App\Http\Controllers\Location\BranchController;
use App\Http\Controllers\Location\BranchTableController;
use App\Http\Controllers\Location\CountryController;
use App\Http\Controllers\Location\ProvinceController;
use App\Http\Controllers\OperationsRuntimeHealthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\Settings\LanguageController;
use App\Http\Controllers\ToolReferenceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
})->middleware('guest');

// Available to guests (used on the login screen) but heavily throttled to
// stop session-write abuse from anonymous traffic.
Route::put('language', [LanguageController::class, 'update'])
    ->middleware('throttle:30,1')
    ->name('language.switch');

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('tools/reference-data', ToolReferenceController::class)
        ->name('tools.reference-data');
    Route::get('operations/runtime-health', OperationsRuntimeHealthController::class)
        ->name('operations.runtime-health');
    Route::post('kitchen/order-items/bulk/start', [KitchenOrderItemController::class, 'startBulk'])
        ->name('kitchen.order-items.bulk.start');
    Route::post('kitchen/order-items/bulk/ready', [KitchenOrderItemController::class, 'readyBulk'])
        ->name('kitchen.order-items.bulk.ready');
    Route::post('kitchen/order-items/bulk/delivered', [KitchenOrderItemController::class, 'deliveredBulk'])
        ->name('kitchen.order-items.bulk.delivered');
    Route::post('kitchen/order-items/{orderItem}/start', [KitchenOrderItemController::class, 'start'])
        ->name('kitchen.order-items.start');
    Route::post('kitchen/order-items/{orderItem}/ready', [KitchenOrderItemController::class, 'ready'])
        ->name('kitchen.order-items.ready');
    Route::post('kitchen/order-items/{orderItem}/delivered', [KitchenOrderItemController::class, 'delivered'])
        ->name('kitchen.order-items.delivered');

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Users
    Route::middleware('role:super-admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::put('/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
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
        Route::post('branch-tables', [BranchTableController::class, 'store'])->name('branch-tables.store');
        Route::put('branch-tables/{branchTable}', [BranchTableController::class, 'update'])->name('branch-tables.update');
        Route::delete('branch-tables/{branchTable}', [BranchTableController::class, 'destroy'])->name('branch-tables.destroy');
        Route::post('branches/{branch}/kitchens', [BranchController::class, 'syncKitchens'])->name('branches.kitchens');
        Route::resource('kitchens', KitchenController::class);
        Route::post('kitchens/{kitchen}/toggle', [KitchenController::class, 'toggle'])->name('kitchens.toggle');
        Route::post('kitchens/{kitchen}/products', [KitchenController::class, 'syncProducts'])->name('kitchens.products');
        Route::post('kitchen-types', [KitchenController::class, 'storeKitchenType'])->name('kitchen-types.store');
        Route::put('kitchen-types/{kitchenType}', [KitchenController::class, 'updateKitchenType'])->name('kitchen-types.update');
        Route::delete('kitchen-types/{kitchenType}', [KitchenController::class, 'destroyKitchenType'])->name('kitchen-types.destroy');
        Route::post('cuisines', [KitchenController::class, 'storeCuisine'])->name('cuisines.store');
        Route::put('cuisines/{cuisine}', [KitchenController::class, 'updateCuisine'])->name('cuisines.update');
        Route::delete('cuisines/{cuisine}', [KitchenController::class, 'destroyCuisine'])->name('cuisines.destroy');
        Route::post('kitchen-categories', [KitchenController::class, 'storeKitchenCategory'])->name('kitchen-categories.store');
        Route::put('kitchen-categories/{kitchenCategory}', [KitchenController::class, 'updateKitchenCategory'])->name('kitchen-categories.update');
        Route::delete('kitchen-categories/{kitchenCategory}', [KitchenController::class, 'destroyKitchenCategory'])->name('kitchen-categories.destroy');
        Route::post('branches/{branch}/disable', [BranchController::class, 'disable'])->name('branches.disable');

        // Activity / Audit Logs
        Route::get('admin/activity-logs', [ActivityLogController::class, 'index'])
            ->name('admin.activity-logs.index');
        Route::get('admin/activity-logs/archives/{archive}/download', [ActivityLogController::class, 'downloadArchive'])
            ->name('admin.activity-logs.archives.download');
        Route::get('admin/activity-logs/{auditLog}', [ActivityLogController::class, 'show'])
            ->name('admin.activity-logs.show');
    });

    // Products & Orders
    Route::middleware('can:'.PermissionEnum::PRODUCTS_VIEW->value)->group(function () {
        Route::get('products', [ProductController::class, 'index'])->name('products.index');
    });
    Route::middleware('can:'.PermissionEnum::PRODUCTS_CREATE->value)->group(function () {
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::post('products/categories', [ProductController::class, 'storeCategory'])->name('products.categories.store');
        Route::post('products/types', [ProductController::class, 'storeType'])->name('products.types.store');
    });
    Route::middleware('can:'.PermissionEnum::PRODUCTS_UPDATE->value)->group(function () {
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::put('products/categories/{category}', [ProductController::class, 'updateCategory'])->name('products.categories.update');
        Route::put('products/types/{type}', [ProductController::class, 'updateType'])->name('products.types.update');
    });
    Route::middleware([
        'can:'.PermissionEnum::PRODUCTS_DELETE->value,
        'role:super-admin',
    ])->group(function () {
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
        Route::delete('products/categories/{category}', [ProductController::class, 'destroyCategory'])->name('products.categories.destroy');
        Route::delete('products/types/{type}', [ProductController::class, 'destroyType'])->name('products.types.destroy');
        Route::delete('products/{product}/images/{productImage}', [ProductController::class, 'destroyImage'])->name('products.images.destroy');
    });
    Route::middleware('can:'.PermissionEnum::ORDERS_VIEW->value)->group(function () {
        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    });
    Route::middleware('can:'.PermissionEnum::ORDERS_CREATE->value)->group(function () {
        Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    });
    Route::middleware('can:'.PermissionEnum::ORDERS_UPDATE->value)->group(function () {
        Route::put('orders/{order}', [OrderController::class, 'update'])->name('orders.update');
        Route::patch('orders/{order}', [OrderController::class, 'update']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');
        Route::patch('orders/{order}/table', [OrderController::class, 'updateTable'])->name('orders.table.update');
        Route::post('orders/{order}/items', [OrderController::class, 'addItems'])->name('orders.items.store');
    });
    Route::middleware('role:super-admin')->group(function () {
        Route::post('discount-cards', [DiscountCardController::class, 'store'])->name('discount-cards.store');
        Route::put('discount-cards/{discountCard}', [DiscountCardController::class, 'update'])->name('discount-cards.update');
        Route::delete('discount-cards/{discountCard}', [DiscountCardController::class, 'destroy'])->name('discount-cards.destroy');
    });
    Route::middleware('can:'.PermissionEnum::REPORTS_VIEW->value)->group(function () {
        Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');
    });
    Route::middleware('can:'.PermissionEnum::REPORTS_EXPORT->value)->group(function () {
        Route::get('reports/export/pdf', [ReportsController::class, 'exportPdf'])->name('reports.export.pdf');
        Route::get('reports/export/xlsx', [ReportsController::class, 'exportXlsx'])->name('reports.export.xlsx');
    });

    // Inventory
    Route::middleware('can:'.PermissionEnum::INVENTORY_VIEW->value)->group(function () {
        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    });
    Route::middleware('can:'.PermissionEnum::INVENTORY_ADJUST->value)->group(function () {
        Route::post('inventory', [InventoryController::class, 'store'])->name('inventory.store');
        Route::put('inventory/{inventory}', [InventoryController::class, 'update'])->name('inventory.update');
        Route::post('inventory/{inventory}/restock', [InventoryController::class, 'restock'])->name('inventory.restock');
        Route::post('inventory/usage-cycle', [InventoryController::class, 'storeUsageCycle'])->name('inventory.usage-cycle.store');
        Route::post('vendors', [InventoryController::class, 'storeVendor'])->name('vendors.store');
        Route::put('vendors/{vendor}', [InventoryController::class, 'updateVendor'])->name('vendors.update');
        Route::post('banners', [BannerController::class, 'store'])->name('banners.store');
        Route::put('banners/{banner}', [BannerController::class, 'update'])->name('banners.update');
        Route::post('currencies', [InventoryController::class, 'storeCurrency'])->name('currencies.store');
        Route::put('currencies/{currency}', [InventoryController::class, 'updateCurrency'])->name('currencies.update');
        Route::post('units', [InventoryController::class, 'storeUnit'])->name('units.store');
        Route::put('units/{unit}', [InventoryController::class, 'updateUnit'])->name('units.update');
        Route::post('inventory-types', [InventoryController::class, 'storeInventoryType'])->name('inventory-types.store');
        Route::put('inventory-types/{inventoryType}', [InventoryController::class, 'updateInventoryType'])->name('inventory-types.update');
        Route::post('inventory-categories', [InventoryController::class, 'storeInventoryCategory'])->name('inventory-categories.store');
        Route::put('inventory-categories/{inventoryCategory}', [InventoryController::class, 'updateInventoryCategory'])->name('inventory-categories.update');
    });
    Route::middleware([
        'can:'.PermissionEnum::INVENTORY_ADJUST->value,
        'role:super-admin',
    ])->group(function () {
        Route::delete('inventory/{inventory}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
        Route::delete('vendors/{vendor}', [InventoryController::class, 'destroyVendor'])->name('vendors.destroy');
        Route::delete('banners/{banner}', [BannerController::class, 'destroy'])->name('banners.destroy');
        Route::delete('currencies/{currency}', [InventoryController::class, 'destroyCurrency'])->name('currencies.destroy');
        Route::delete('units/{unit}', [InventoryController::class, 'destroyUnit'])->name('units.destroy');
        Route::delete('inventory-types/{inventoryType}', [InventoryController::class, 'destroyInventoryType'])->name('inventory-types.destroy');
        Route::delete('inventory-categories/{inventoryCategory}', [InventoryController::class, 'destroyInventoryCategory'])->name('inventory-categories.destroy');
    });
    Route::middleware('can:'.PermissionEnum::FINANCE_VIEW->value)->group(function () {
        Route::get('finance', [FinanceController::class, 'index'])->name('finance.index');
        Route::get('finance/general-ledger', [FinanceController::class, 'generalLedger'])->name('finance.general-ledger.index');
        Route::get('finance/inventory-valuation', [FinanceController::class, 'inventoryValuation'])->name('finance.inventory-valuation.index');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_VIEW->value)->group(function () {
        Route::get('finance/payroll', [PayrollController::class, 'index'])->name('finance.payroll.index');
        Route::get('finance/employee-advances', [EmployeeAdvanceController::class, 'index'])->name('finance.employee-advances.index');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_CREATE->value)->group(function () {
        Route::post('finance/payroll', [PayrollController::class, 'store'])->name('finance.payroll.store');
        Route::post('finance/payroll/contracts', [PayrollController::class, 'storeContract'])->name('finance.payroll.contracts.store');
        Route::put('finance/payroll/contracts/{contract}', [PayrollController::class, 'updateContract'])->name('finance.payroll.contracts.update');
        Route::post('finance/payroll/contract-schedules', [PayrollController::class, 'storeSchedule'])->name('finance.payroll.contract-schedules.store');
        Route::put('finance/payroll/contract-schedules/{schedule}', [PayrollController::class, 'updateSchedule'])->name('finance.payroll.contract-schedules.update');
        Route::post('finance/employee-advances', [EmployeeAdvanceController::class, 'store'])->name('finance.employee-advances.store');
        Route::put('finance/employee-advances/{employeeAdvance}', [EmployeeAdvanceController::class, 'update'])->name('finance.employee-advances.update');
    });
    Route::middleware([
        'can:'.PermissionEnum::PAYROLL_CREATE->value,
        'role:super-admin',
    ])->group(function () {
        Route::delete('finance/payroll/contracts/{contract}', [PayrollController::class, 'destroyContract'])->name('finance.payroll.contracts.destroy');
        Route::delete('finance/payroll/contract-schedules/{schedule}', [PayrollController::class, 'destroySchedule'])->name('finance.payroll.contract-schedules.destroy');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_APPROVE->value)->group(function () {
        Route::post('finance/payroll/contract-schedules/{schedule}/approve', [PayrollController::class, 'approveSchedule'])->name('finance.payroll.contract-schedules.approve');
        Route::post('finance/payroll/contract-schedules/{schedule}/reject', [PayrollController::class, 'rejectSchedule'])->name('finance.payroll.contract-schedules.reject');
        Route::post('finance/payroll/{payrollRun}/approve', [PayrollController::class, 'approve'])->name('finance.payroll.approve');
        Route::post('finance/payroll/{payrollRun}/reject', [PayrollController::class, 'reject'])->name('finance.payroll.reject');
        Route::post('finance/employee-advances/{employeeAdvance}/approve', [EmployeeAdvanceController::class, 'approve'])->name('finance.employee-advances.approve');
        Route::post('finance/employee-advances/{employeeAdvance}/reject', [EmployeeAdvanceController::class, 'reject'])->name('finance.employee-advances.reject');
    });
    Route::middleware('can:'.PermissionEnum::PAYROLL_PAY->value)->group(function () {
        Route::post('finance/payroll/{payrollRun}/mark-paid', [PayrollController::class, 'markPaid'])->name('finance.payroll.mark-paid');
    });
    Route::middleware('can:'.PermissionEnum::EXPENSES_VIEW->value)->group(function () {
        Route::get('finance/expenses', [ExpenseController::class, 'index'])->name('finance.expenses.index');
    });
    Route::middleware('can:'.PermissionEnum::EXPENSES_CREATE->value)->group(function () {
        Route::post('finance/expenses', [ExpenseController::class, 'store'])->name('finance.expenses.store');
        Route::put('finance/expenses/{expense}', [ExpenseController::class, 'update'])->name('finance.expenses.update');
        Route::post('finance/expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('finance.expenses.approve');
        Route::post('finance/expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('finance.expenses.reject');
    });
    Route::middleware('can:'.PermissionEnum::FINANCE_MANAGE->value)->group(function () {
        Route::get('finance/chart-of-accounts', [ChartOfAccountController::class, 'index'])->name('finance.chart-of-accounts.index');
        Route::post('finance/chart-of-accounts', [ChartOfAccountController::class, 'store'])->name('finance.chart-of-accounts.store');
        Route::put('finance/chart-of-accounts/{financeAccount}', [ChartOfAccountController::class, 'update'])->name('finance.chart-of-accounts.update');
        Route::get('finance/cash-bank', [CashBankController::class, 'index'])->name('finance.cash-bank.index');
        Route::post('finance/cash-bank', [CashBankController::class, 'store'])->name('finance.cash-bank.store');
        Route::put('finance/cash-bank/{cashMovement}', [CashBankController::class, 'update'])->name('finance.cash-bank.update');
        Route::post('finance/cash-bank/{cashMovement}/approve', [CashBankController::class, 'approve'])->name('finance.cash-bank.approve');
        Route::post('finance/cash-bank/{cashMovement}/reject', [CashBankController::class, 'reject'])->name('finance.cash-bank.reject');
        Route::get('finance/cash-movement-types', [CashMovementTypeController::class, 'index'])->name('finance.cash-movement-types.index');
        Route::post('finance/cash-movement-types', [CashMovementTypeController::class, 'store'])->name('finance.cash-movement-types.store');
        Route::put('finance/cash-movement-types/{cashMovementType}', [CashMovementTypeController::class, 'update'])->name('finance.cash-movement-types.update');
        Route::get('finance/expense-categories', [ExpenseCategoryController::class, 'index'])->name('finance.expense-categories.index');
        Route::post('finance/expense-categories', [ExpenseCategoryController::class, 'store'])->name('finance.expense-categories.store');
        Route::put('finance/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'update'])->name('finance.expense-categories.update');
    });
    Route::middleware([
        'can:'.PermissionEnum::FINANCE_MANAGE->value,
        'role:super-admin',
    ])->group(function () {
        Route::delete('finance/chart-of-accounts/{financeAccount}', [ChartOfAccountController::class, 'destroy'])->name('finance.chart-of-accounts.destroy');
        Route::delete('finance/cash-movement-types/{cashMovementType}', [CashMovementTypeController::class, 'destroy'])->name('finance.cash-movement-types.destroy');
        Route::delete('finance/expense-categories/{expenseCategory}', [ExpenseCategoryController::class, 'destroy'])->name('finance.expense-categories.destroy');
    });

    // Employees
    Route::middleware('can:'.PermissionEnum::EMPLOYEES_VIEW->value)->group(function () {
        Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    });
    Route::middleware('can:'.PermissionEnum::EMPLOYEES_CREATE->value)->group(function () {
        Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::post('employee-positions', [EmployeeController::class, 'storePosition'])->name('employee-positions.store');
        Route::post('employment-types', [EmployeeController::class, 'storeEmploymentType'])->name('employment-types.store');
        Route::post('shifts', [EmployeeController::class, 'storeShift'])->name('shifts.store');
    });
    Route::middleware('can:'.PermissionEnum::EMPLOYEES_UPDATE->value)->group(function () {
        Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::post('employees/{employee}/toggle-active', [EmployeeController::class, 'toggleActive'])->name('employees.toggle-active');
        Route::put('employee-positions/{employeePosition}', [EmployeeController::class, 'updatePosition'])->name('employee-positions.update');
        Route::put('employment-types/{employmentType}', [EmployeeController::class, 'updateEmploymentType'])->name('employment-types.update');
        Route::put('shifts/{shift}', [EmployeeController::class, 'updateShift'])->name('shifts.update');
    });
    Route::middleware('role:super-admin')->group(function () {
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::delete('employee-positions/{employeePosition}', [EmployeeController::class, 'destroyPosition'])->name('employee-positions.destroy');
        Route::delete('employment-types/{employmentType}', [EmployeeController::class, 'destroyEmploymentType'])->name('employment-types.destroy');
        Route::delete('shifts/{shift}', [EmployeeController::class, 'destroyShift'])->name('shifts.destroy');
    });

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
