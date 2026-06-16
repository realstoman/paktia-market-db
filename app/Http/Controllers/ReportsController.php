<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Jobs\RenderReportExportJob;
use App\Models\Branch;
use App\Models\CashMovement;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\User;
use App\Services\Reports\ReportFileRenderer;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function __construct(
        private readonly ReportFileRenderer $reportFileRenderer,
    ) {}

    private const MODULES = [
        'inventory',
        'employees',
        'finance',
        'branches',
        'users',
    ];

    public function index(Request $request)
    {
        return Inertia::render('reports/index', $this->buildReportPageData($request));
    }

    public function exportPdf(Request $request): Response|RedirectResponse
    {
        return $this->handleExport($request, 'pdf');
    }

    public function exportXlsx(Request $request): Response|StreamedResponse|RedirectResponse
    {
        return $this->handleExport($request, 'xlsx');
    }

    public function downloadExport(Request $request, string $filename): StreamedResponse
    {
        abort_unless($request->user()?->can(PermissionEnum::REPORTS_EXPORT->value), 403);

        $userId = (int) $request->user()?->getKey();
        abort_unless($userId > 0, 403);

        $disk = (string) config('pos.exports.disk', 'local');
        $path = RenderReportExportJob::storagePath($userId, $filename);

        $storage = Storage::disk($disk);

        abort_unless($storage->exists($path), 404);

        $contentType = str_ends_with($filename, '.pdf')
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        return $storage->download($path, $filename, [
            'Content-Type' => $contentType,
        ]);
    }

    private function handleExport(Request $request, string $format): Response|StreamedResponse|RedirectResponse
    {
        abort_unless($request->user()?->can(PermissionEnum::REPORTS_EXPORT->value), 403);

        $data = $this->buildReportPageData($request);
        $report = $data['activeReport'];

        abort_unless(($report['isReady'] ?? false) === true, 404);

        $filename = $this->reportFileRenderer->defaultFilename($data, $format);

        // Async path: dispatch the rendering, give the user an immediate
        // "we'll have it ready shortly" notification, then they download
        // from the user-scoped exports endpoint.
        if ((bool) config('pos.exports.async', false)) {
            $userId = (int) $request->user()->getKey();
            $uniqueFilename = $this->uniqueExportFilename($filename);

            RenderReportExportJob::dispatch($userId, $format, $data, $uniqueFilename);

            return redirect()
                ->route('reports.index', $request->query())
                ->with('notification', [
                    'id' => 'report-export-'.Str::uuid()->toString(),
                    'category' => 'system',
                    'title' => 'Report export queued',
                    'description' => sprintf(
                        'We\'re generating %s. You can download it from the reports page once it\'s ready.',
                        $uniqueFilename,
                    ),
                    'href' => route('reports.exports.download', ['filename' => $uniqueFilename]),
                    'priority' => 'medium',
                ]);
        }

        // Synchronous path (default): render inline and stream to the user.
        if ($format === 'pdf') {
            return response($this->reportFileRenderer->renderPdf($data), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => sprintf('attachment; filename="%s"', $filename),
            ]);
        }

        $bytes = $this->reportFileRenderer->renderXlsx($data);

        return response()->streamDownload(function () use ($bytes) {
            echo $bytes;
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function uniqueExportFilename(string $filename): string
    {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $base = pathinfo($filename, PATHINFO_FILENAME);
        $stamp = now()->format('Ymd-His');

        return $extension !== ''
            ? "{$base}-{$stamp}.{$extension}"
            : "{$base}-{$stamp}";
    }

    private function buildReportPageData(Request $request): array
    {
        return $this->buildMarketReportPageData($request);
    }

    private function buildMarketReportPageData(Request $request): array
    {
        $validated = $request->validate([
            'range' => ['nullable', 'in:today,yesterday,this_week,this_month,last_30_days,year_to_date,custom'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'module' => ['nullable', 'in:'.implode(',', self::MODULES)],
        ]);

        $range = $validated['range'] ?? 'this_month';
        [$startDate, $endDate] = $this->resolvePeriod(
            $range,
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null,
        );
        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $module = $validated['module'] ?? 'inventory';
        $modules = self::MODULES;

        $catalog = collect([
            ['key' => 'inventory', 'title' => 'Inventory', 'description' => 'Stock levels, values, and availability.', 'status' => 'live'],
            ['key' => 'employees', 'title' => 'Employees', 'description' => 'Employee and branch allocation overview.', 'status' => 'live'],
            ['key' => 'finance', 'title' => 'Finance', 'description' => 'Expenses and cash movement activity.', 'status' => 'live'],
            ['key' => 'branches', 'title' => 'Branches', 'description' => 'Branch staffing and inventory coverage.', 'status' => 'live'],
            ['key' => 'users', 'title' => 'Users', 'description' => 'Internal account and access overview.', 'status' => 'live'],
        ])->whereIn('key', $modules)->values()->all();

        $inventoryQuery = InventoryItem::query()->when($branchId, fn ($query) => $query->where('branch_id', $branchId));
        $expenseQuery = Expense::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()]);
        $employeeQuery = Employee::query()->when($branchId, fn ($query) => $query->where('branch_id', $branchId));

        $overview = [
            ['key' => 'inventory', 'title' => 'Inventory', 'primary' => (int) (clone $inventoryQuery)->count(), 'primaryLabel' => 'Stock items', 'secondary' => (float) (clone $inventoryQuery)->selectRaw('COALESCE(SUM(quantity * unit_price), 0) as total')->value('total'), 'secondaryLabel' => 'Stock value', 'secondaryFormat' => 'currency'],
            ['key' => 'employees', 'title' => 'Employees', 'primary' => (int) (clone $employeeQuery)->count(), 'primaryLabel' => 'Employees', 'secondary' => (int) (clone $employeeQuery)->where('is_active', true)->count(), 'secondaryLabel' => 'Active employees'],
            ['key' => 'finance', 'title' => 'Finance', 'primary' => (float) (clone $expenseQuery)->where('approval_status', 'approved')->sum('amount'), 'primaryLabel' => 'Approved expenses', 'primaryFormat' => 'currency', 'secondary' => (int) (clone $expenseQuery)->where('approval_status', 'submitted')->count(), 'secondaryLabel' => 'Pending approvals'],
            ['key' => 'branches', 'title' => 'Branches', 'primary' => Branch::query()->count(), 'primaryLabel' => 'Branches', 'secondary' => Branch::query()->where('is_active', true)->count(), 'secondaryLabel' => 'Active branches'],
            ['key' => 'users', 'title' => 'Users', 'primary' => User::query()->count(), 'primaryLabel' => 'Accounts', 'secondary' => User::query()->where('is_active', true)->count(), 'secondaryLabel' => 'Active accounts'],
        ];

        $activeReport = match ($module) {
            'employees' => $this->marketEmployeesReport($employeeQuery),
            'finance' => $this->marketFinanceReport($expenseQuery),
            'branches' => $this->marketBranchesReport(),
            'users' => $this->marketUsersReport($branchId),
            default => $this->marketInventoryReport($inventoryQuery),
        };

        return [
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name'])->toArray(),
            'filters' => ['range' => $range, 'startDate' => $startDate->toDateString(), 'endDate' => $endDate->toDateString(), 'branchId' => $branchId, 'module' => $module],
            'reportCatalog' => $catalog,
            'overview' => $overview,
            'activeReport' => $activeReport,
            'period' => ['label' => $startDate->format('M d, Y').' to '.$endDate->format('M d, Y'), 'startDate' => $startDate->toDateString(), 'endDate' => $endDate->toDateString()],
        ];
    }

    private function marketInventoryReport(Builder $query): array
    {
        $items = $query->with('branch:id,name')->orderBy('name')->get();

        return $this->marketReport('inventory', 'Inventory Report', 'Stock levels and current valuation.', [
            ['key' => 'item', 'label' => 'Item'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'quantity', 'label' => 'Quantity'], ['key' => 'unit', 'label' => 'Unit'], ['key' => 'value', 'label' => 'Value'], ['key' => 'status', 'label' => 'Status'],
        ], $items->map(fn (InventoryItem $item) => ['item' => $item->name, 'branch' => $item->branch?->name ?? 'Unassigned', 'quantity' => (float) $item->quantity, 'unit' => $item->unit ?? '-', 'value' => (float) $item->quantity * (float) ($item->unit_price ?? 0), 'status' => (float) $item->quantity <= 0 ? 'Out of stock' : ((float) $item->quantity <= 10 ? 'Low stock' : 'Available')])->all(), ['value'], [
            ['label' => 'Stock Items', 'value' => $items->count(), 'format' => 'number'], ['label' => 'Inventory Value', 'value' => (float) $items->sum(fn ($item) => (float) $item->quantity * (float) ($item->unit_price ?? 0)), 'format' => 'currency'],
        ]);
    }

    private function marketEmployeesReport(Builder $query): array
    {
        $employees = $query->with('branch:id,name')->orderBy('first_name')->get();
        return $this->marketReport('employees', 'Employees Report', 'Employee status and branch allocation.', [['key' => 'employee', 'label' => 'Employee'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'position', 'label' => 'Position'], ['key' => 'status', 'label' => 'Status']], $employees->map(fn (Employee $employee) => ['employee' => trim($employee->first_name.' '.$employee->last_name), 'branch' => $employee->branch?->name ?? 'Unassigned', 'position' => $employee->position ?? '-', 'status' => $employee->is_active ? 'Active' : 'Inactive'])->all(), [], [['label' => 'Employees', 'value' => $employees->count(), 'format' => 'number'], ['label' => 'Active', 'value' => $employees->where('is_active', true)->count(), 'format' => 'number']]);
    }

    private function marketFinanceReport(Builder $query): array
    {
        $expenses = $query->with('branch:id,name')->latest('expense_date')->get();
        return $this->marketReport('finance', 'Finance Report', 'Expense activity for the selected period.', [['key' => 'date', 'label' => 'Date'], ['key' => 'reference', 'label' => 'Reference'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'description', 'label' => 'Description'], ['key' => 'amount', 'label' => 'Amount'], ['key' => 'status', 'label' => 'Status']], $expenses->map(fn (Expense $expense) => ['date' => (string) $expense->expense_date, 'reference' => 'Expense #'.$expense->id, 'branch' => $expense->branch?->name ?? 'Unassigned', 'description' => $expense->title, 'amount' => (float) $expense->amount, 'status' => $expense->approval_status ?? 'draft'])->all(), ['amount'], [['label' => 'Expenses', 'value' => $expenses->count(), 'format' => 'number'], ['label' => 'Approved Amount', 'value' => (float) $expenses->where('approval_status', 'approved')->sum('amount'), 'format' => 'currency']]);
    }

    private function marketBranchesReport(): array
    {
        $branches = Branch::query()->withCount(['employees', 'inventoryItems'])->orderBy('name')->get();
        return $this->marketReport('branches', 'Branches Report', 'Branch staffing and inventory coverage.', [['key' => 'branch', 'label' => 'Branch'], ['key' => 'status', 'label' => 'Status'], ['key' => 'employees', 'label' => 'Employees'], ['key' => 'inventory', 'label' => 'Inventory Items']], $branches->map(fn (Branch $branch) => ['branch' => $branch->name, 'status' => $branch->is_active ? 'Active' : 'Inactive', 'employees' => $branch->employees_count, 'inventory' => $branch->inventory_items_count])->all(), [], [['label' => 'Branches', 'value' => $branches->count(), 'format' => 'number'], ['label' => 'Active', 'value' => $branches->where('is_active', true)->count(), 'format' => 'number']]);
    }

    private function marketUsersReport(?int $branchId): array
    {
        $users = User::query()->with(['roles:id,name', 'branch:id,name'])->when($branchId, fn ($query) => $query->where('branch_id', $branchId))->orderBy('name')->get();
        return $this->marketReport('users', 'Users Report', 'Internal accounts and assigned access.', [['key' => 'user', 'label' => 'User'], ['key' => 'email', 'label' => 'Email'], ['key' => 'branch', 'label' => 'Branch'], ['key' => 'roles', 'label' => 'Roles'], ['key' => 'status', 'label' => 'Status']], $users->map(fn (User $user) => ['user' => $user->name, 'email' => $user->email, 'branch' => $user->branch?->name ?? 'Unassigned', 'roles' => $user->roles->pluck('name')->join(', '), 'status' => $user->is_active ? 'Active' : 'Inactive'])->all(), [], [['label' => 'Accounts', 'value' => $users->count(), 'format' => 'number'], ['label' => 'Active', 'value' => $users->where('is_active', true)->count(), 'format' => 'number']]);
    }

    private function marketReport(string $key, string $title, string $description, array $columns, array $rows, array $currencyColumns, array $summary): array
    {
        return ['key' => $key, 'title' => $title, 'description' => $description, 'isReady' => true, 'status' => 'live', 'columns' => $columns, 'currencyColumns' => $currencyColumns, 'rows' => $rows, 'summary' => $summary, 'insights' => [], 'exportNotes' => ['Generated from current Paktia Market records.']];
    }

    private function exportFilename(
        string $module,
        string $startDate,
        string $endDate,
        string $extension,
    ): string {
        return sprintf(
            '%s-report-%s-to-%s.%s',
            $module,
            $startDate,
            $endDate,
            $extension,
        );
    }

    private function resolveBranchName(array $data): string
    {
        $branch = collect($data['branches'])->firstWhere('id', $data['filters']['branchId']);

        return is_array($branch) ? (string) ($branch['name'] ?? 'All Branches') : 'All Branches';
    }

    private function resolvePeriod(
        string $range,
        ?string $startDate,
        ?string $endDate,
    ): array {
        $today = Carbon::today();

        return match ($range) {
            'today' => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
            'yesterday' => [
                $today->copy()->subDay()->startOfDay(),
                $today->copy()->subDay()->endOfDay(),
            ],
            'this_week' => [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()],
            'last_30_days' => [$today->copy()->subDays(29)->startOfDay(), $today->copy()->endOfDay()],
            'year_to_date' => [$today->copy()->startOfYear(), $today->copy()->endOfDay()],
            'custom' => $this->resolveCustomPeriod($startDate, $endDate),
            default => [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()],
        };
    }

    private function resolveCustomPeriod(?string $startDate, ?string $endDate): array
    {
        $start = $startDate
            ? Carbon::parse($startDate)->startOfDay()
            : Carbon::today()->startOfMonth();
        $end = $endDate
            ? Carbon::parse($endDate)->endOfDay()
            : Carbon::today()->endOfDay();

        if ($start->greaterThan($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, $end];
    }

}

