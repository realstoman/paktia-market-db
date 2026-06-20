<?php

namespace App\Http\Controllers;

use App\Enums\PermissionEnum;
use App\Jobs\RenderReportExportJob;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\Property;
use App\Models\RentPayment;
use App\Models\User;
use App\Services\Finance\RentalFinanceService;
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
        private readonly RentalFinanceService $rentalFinance,
    ) {}

    private const MODULES = [
        'inventory',
        'employees',
        'finance',
        'rentals',
        'properties',
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
                    'title' => __('reports.export.queued_title'),
                    'description' => __('reports.export.queued_description', ['filename' => $uniqueFilename]),
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
            'property_id' => ['nullable', 'exists:properties,id'],
            'module' => ['nullable', 'in:'.implode(',', self::MODULES)],
        ]);

        $range = $validated['range'] ?? 'this_month';
        [$startDate, $endDate] = $this->resolvePeriod(
            $range,
            $validated['start_date'] ?? null,
            $validated['end_date'] ?? null,
        );
        $propertyId = isset($validated['property_id']) ? (int) $validated['property_id'] : null;
        $module = $validated['module'] ?? 'inventory';
        $modules = self::MODULES;

        $catalog = collect($modules)
            ->map(fn (string $key) => [
                'key' => $key,
                'title' => __("reports.catalog.{$key}.title"),
                'description' => __("reports.catalog.{$key}.description"),
                'status' => 'live',
            ])
            ->values()
            ->all();

        $inventoryQuery = InventoryItem::query()->when($propertyId, fn ($query) => $query->where('property_id', $propertyId));
        $expenseQuery = Expense::query()
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()]);
        $employeeQuery = Employee::query()->when($propertyId, fn ($query) => $query->where('property_id', $propertyId));
        $rentalSummary = $this->rentalFinance->summary($startDate, $endDate, $propertyId);
        $rentReceived = (float) RentPayment::query()
            ->where('status', 'received')
            ->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('amount');

        $overview = [
            ['key' => 'inventory', 'title' => __('reports.catalog.inventory.title'), 'primary' => (int) (clone $inventoryQuery)->count(), 'primaryLabel' => __('reports.overview.stock_items'), 'secondary' => (float) (clone $inventoryQuery)->selectRaw('COALESCE(SUM(quantity * unit_price), 0) as total')->value('total'), 'secondaryLabel' => __('reports.overview.stock_value'), 'secondaryFormat' => 'currency'],
            ['key' => 'employees', 'title' => __('reports.catalog.employees.title'), 'primary' => (int) (clone $employeeQuery)->count(), 'primaryLabel' => __('reports.overview.employees'), 'secondary' => (int) (clone $employeeQuery)->where('is_active', true)->count(), 'secondaryLabel' => __('reports.overview.active_employees')],
            ['key' => 'finance', 'title' => __('reports.catalog.finance.title'), 'primary' => $rentReceived, 'primaryLabel' => __('reports.overview.rent_received'), 'primaryFormat' => 'currency', 'secondary' => (float) (clone $expenseQuery)->where('approval_status', 'approved')->sum('amount'), 'secondaryLabel' => __('reports.overview.approved_expenses'), 'secondaryFormat' => 'currency'],
            ['key' => 'rentals', 'title' => __('reports.catalog.rentals.title'), 'primary' => $rentalSummary['activeLeases'], 'primaryLabel' => __('reports.overview.active_leases'), 'secondary' => $rentalSummary['outstanding'], 'secondaryLabel' => __('reports.overview.rent_outstanding'), 'secondaryFormat' => 'currency'],
            ['key' => 'properties', 'title' => __('reports.catalog.properties.title'), 'primary' => Property::query()->count(), 'primaryLabel' => __('reports.overview.properties'), 'secondary' => Property::query()->where('is_active', true)->count(), 'secondaryLabel' => __('reports.overview.active_properties')],
            ['key' => 'users', 'title' => __('reports.catalog.users.title'), 'primary' => User::query()->count(), 'primaryLabel' => __('reports.overview.accounts'), 'secondary' => User::query()->where('is_active', true)->count(), 'secondaryLabel' => __('reports.overview.active_accounts')],
        ];

        $activeReport = match ($module) {
            'employees' => $this->marketEmployeesReport($employeeQuery),
            'finance' => $this->marketFinanceReport($expenseQuery, $startDate, $endDate, $propertyId),
            'rentals' => $this->marketRentalsReport($startDate, $endDate, $propertyId),
            'properties' => $this->marketPropertiesReport(),
            'users' => $this->marketUsersReport($propertyId),
            default => $this->marketInventoryReport($inventoryQuery),
        };

        return [
            'properties' => Property::query()->orderBy('name')->get(['id', 'name', 'name_translations'])->toArray(),
            'filters' => ['range' => $range, 'startDate' => $startDate->toDateString(), 'endDate' => $endDate->toDateString(), 'propertyId' => $propertyId, 'module' => $module],
            'reportCatalog' => $catalog,
            'overview' => $overview,
            'activeReport' => $activeReport,
            'period' => ['label' => __('reports.period.range', ['start' => $startDate->format('M d, Y'), 'end' => $endDate->format('M d, Y')]), 'startDate' => $startDate->toDateString(), 'endDate' => $endDate->toDateString()],
        ];
    }

    private function marketInventoryReport(Builder $query): array
    {
        $items = $query->with('property:id,name,name_translations')->orderBy('name')->get();

        return $this->marketReport('inventory', __('reports.reports.inventory.title'), __('reports.reports.inventory.description'), [
            ['key' => 'item', 'label' => __('reports.columns.item')],
            ['key' => 'property', 'label' => __('reports.columns.property')],
            ['key' => 'quantity', 'label' => __('reports.columns.quantity')],
            ['key' => 'unit', 'label' => __('reports.columns.unit')],
            ['key' => 'value', 'label' => __('reports.columns.value')],
            ['key' => 'status', 'label' => __('reports.columns.status')],
        ], $items->map(fn (InventoryItem $item) => [
            'item' => $item->name,
            'property' => $item->property?->name ?? __('reports.status.unassigned'),
            'quantity' => (float) $item->quantity,
            'unit' => $item->unit ?? '-',
            'value' => (float) $item->quantity * (float) ($item->unit_price ?? 0),
            'status' => (float) $item->quantity <= 0
                ? __('reports.status.out_of_stock')
                : ((float) $item->quantity <= 10 ? __('reports.status.low_stock') : __('reports.status.available')),
        ])->all(), ['value'], [
            ['label' => __('reports.summary.stock_items'), 'value' => $items->count(), 'format' => 'number'],
            ['label' => __('reports.summary.inventory_value'), 'value' => (float) $items->sum(fn ($item) => (float) $item->quantity * (float) ($item->unit_price ?? 0)), 'format' => 'currency'],
        ]);
    }

    private function marketEmployeesReport(Builder $query): array
    {
        $employees = $query->with('property:id,name,name_translations')->orderBy('first_name')->get();

        return $this->marketReport('employees', __('reports.reports.employees.title'), __('reports.reports.employees.description'), [
            ['key' => 'employee', 'label' => __('reports.columns.employee')],
            ['key' => 'property', 'label' => __('reports.columns.property')],
            ['key' => 'position', 'label' => __('reports.columns.position')],
            ['key' => 'status', 'label' => __('reports.columns.status')],
        ], $employees->map(fn (Employee $employee) => [
            'employee' => trim($employee->first_name.' '.$employee->last_name),
            'property' => $employee->property?->name ?? __('reports.status.unassigned'),
            'position' => $employee->position ?? '-',
            'status' => $employee->is_active ? __('reports.status.active') : __('reports.status.inactive'),
        ])->all(), [], [
            ['label' => __('reports.summary.employees'), 'value' => $employees->count(), 'format' => 'number'],
            ['label' => __('reports.summary.active'), 'value' => $employees->where('is_active', true)->count(), 'format' => 'number'],
        ]);
    }

    private function marketFinanceReport(Builder $query, Carbon $startDate, Carbon $endDate, ?int $propertyId): array
    {
        $expenses = $query->with('property:id,name,name_translations')->latest('expense_date')->get();
        $payments = RentPayment::query()
            ->with(['property:id,name,name_translations', 'tenant:id,full_name,business_name'])
            ->where('status', 'received')
            ->when($propertyId, fn ($paymentQuery) => $paymentQuery->where('property_id', $propertyId))
            ->whereBetween('payment_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->latest('payment_date')
            ->get();
        $rows = $expenses->map(fn (Expense $expense) => [
            'date' => (string) $expense->expense_date,
            'reference' => __('reports.reference.expense', ['id' => $expense->id]),
            'source' => __('reports.source.expense'),
            'property' => $expense->property?->name ?? __('reports.status.unassigned'),
            'description' => $expense->title,
            'amount' => -(float) $expense->amount,
            'status' => $this->localizedReportStatus($expense->approval_status ?? 'draft'),
        ])->merge($payments->map(fn (RentPayment $payment) => [
            'date' => (string) $payment->payment_date,
            'reference' => $payment->receipt_number,
            'source' => __('reports.source.rent'),
            'property' => $payment->property?->name ?? __('reports.status.unassigned'),
            'description' => ($payment->tenant?->business_name ?: $payment->tenant?->full_name) ?? '-',
            'amount' => (float) $payment->amount,
            'status' => __('reports.status.received'),
        ]))->sortByDesc('date')->values();

        return $this->marketReport('finance', __('reports.reports.finance.title'), __('reports.reports.finance.description'), [
            ['key' => 'date', 'label' => __('reports.columns.date')],
            ['key' => 'reference', 'label' => __('reports.columns.reference')],
            ['key' => 'source', 'label' => __('reports.columns.source')],
            ['key' => 'property', 'label' => __('reports.columns.property')],
            ['key' => 'description', 'label' => __('reports.columns.description')],
            ['key' => 'amount', 'label' => __('reports.columns.amount')],
            ['key' => 'status', 'label' => __('reports.columns.status')],
        ], $rows->all(), ['amount'], [
            ['label' => __('reports.summary.rent_received'), 'value' => (float) $payments->sum('amount'), 'format' => 'currency'],
            ['label' => __('reports.summary.approved_amount'), 'value' => (float) $expenses->where('approval_status', 'approved')->sum('amount'), 'format' => 'currency'],
            ['label' => __('reports.summary.net_operating'), 'value' => (float) $payments->sum('amount') - (float) $expenses->where('approval_status', 'approved')->sum('amount'), 'format' => 'currency'],
        ]);
    }

    private function marketRentalsReport(Carbon $startDate, Carbon $endDate, ?int $propertyId): array
    {
        $rows = $this->rentalFinance->leaseRows($startDate, $endDate, $propertyId);

        return $this->marketReport('rentals', __('reports.reports.rentals.title'), __('reports.reports.rentals.description'), [
            ['key' => 'tenant', 'label' => __('reports.columns.tenant')],
            ['key' => 'business', 'label' => __('reports.columns.business')],
            ['key' => 'property', 'label' => __('reports.columns.property')],
            ['key' => 'space', 'label' => __('reports.columns.space')],
            ['key' => 'contract', 'label' => __('reports.columns.contract')],
            ['key' => 'period', 'label' => __('reports.columns.contract_period')],
            ['key' => 'expected', 'label' => __('reports.columns.expected_rent')],
            ['key' => 'received', 'label' => __('reports.columns.received')],
            ['key' => 'outstanding', 'label' => __('reports.columns.outstanding')],
            ['key' => 'signed', 'label' => __('reports.columns.signed_contract')],
        ], $rows->map(function (array $row): array {
            $lease = $row['lease'];
            $space = $lease->unit
                ? $lease->unit->unit_number
                : ($lease->property?->external_unit_number ?: __('reports.status.whole_property'));

            return [
                'tenant' => $lease->tenant?->full_name ?? '-',
                'business' => $lease->tenant?->business_name ?? '-',
                'property' => $lease->property?->name ?? __('reports.status.unassigned'),
                'space' => $space,
                'contract' => $lease->contract_number,
                'period' => $lease->start_date->format('Y-m-d').' — '.($lease->end_date?->format('Y-m-d') ?: '∞'),
                'expected' => $row['expected'],
                'received' => $row['received'],
                'outstanding' => $row['outstanding'],
                'signed' => $lease->contractDocuments->isNotEmpty()
                    ? __('reports.status.uploaded')
                    : __('reports.status.missing'),
            ];
        })->all(), ['expected', 'received', 'outstanding'], [
            ['label' => __('reports.summary.active_leases'), 'value' => $rows->filter(fn (array $row) => $row['lease']->status === 'active')->count(), 'format' => 'number'],
            ['label' => __('reports.summary.expected_rent'), 'value' => (float) $rows->sum('expected'), 'format' => 'currency'],
            ['label' => __('reports.summary.rent_received'), 'value' => (float) $rows->sum('received'), 'format' => 'currency'],
            ['label' => __('reports.summary.rent_outstanding'), 'value' => (float) $rows->sum('outstanding'), 'format' => 'currency'],
        ]);
    }

    private function marketPropertiesReport(): array
    {
        $properties = Property::query()->withCount(['employees', 'inventoryItems'])->orderBy('name')->get();

        return $this->marketReport('properties', __('reports.reports.properties.title'), __('reports.reports.properties.description'), [
            ['key' => 'property', 'label' => __('reports.columns.property')],
            ['key' => 'status', 'label' => __('reports.columns.status')],
            ['key' => 'employees', 'label' => __('reports.columns.employees')],
            ['key' => 'inventory', 'label' => __('reports.columns.inventory')],
        ], $properties->map(fn (Property $property) => [
            'property' => $property->name,
            'status' => $property->is_active ? __('reports.status.active') : __('reports.status.inactive'),
            'employees' => $property->employees_count,
            'inventory' => $property->inventory_items_count,
        ])->all(), [], [
            ['label' => __('reports.summary.properties'), 'value' => $properties->count(), 'format' => 'number'],
            ['label' => __('reports.summary.active'), 'value' => $properties->where('is_active', true)->count(), 'format' => 'number'],
        ]);
    }

    private function marketUsersReport(?int $propertyId): array
    {
        $users = User::query()->with(['roles:id,name', 'property:id,name,name_translations'])->when($propertyId, fn ($query) => $query->where('property_id', $propertyId))->orderBy('name')->get();

        return $this->marketReport('users', __('reports.reports.users.title'), __('reports.reports.users.description'), [
            ['key' => 'user', 'label' => __('reports.columns.user')],
            ['key' => 'email', 'label' => __('reports.columns.email')],
            ['key' => 'property', 'label' => __('reports.columns.property')],
            ['key' => 'roles', 'label' => __('reports.columns.roles')],
            ['key' => 'status', 'label' => __('reports.columns.status')],
        ], $users->map(fn (User $user) => [
            'user' => $user->name,
            'email' => $user->email,
            'property' => $user->property?->name ?? __('reports.status.unassigned'),
            'roles' => $user->roles->pluck('name')->join(', '),
            'status' => $user->is_active ? __('reports.status.active') : __('reports.status.inactive'),
        ])->all(), [], [
            ['label' => __('reports.summary.accounts'), 'value' => $users->count(), 'format' => 'number'],
            ['label' => __('reports.summary.active'), 'value' => $users->where('is_active', true)->count(), 'format' => 'number'],
        ]);
    }

    private function marketReport(string $key, string $title, string $description, array $columns, array $rows, array $currencyColumns, array $summary): array
    {
        return ['key' => $key, 'title' => $title, 'description' => $description, 'isReady' => true, 'status' => 'live', 'columns' => $columns, 'currencyColumns' => $currencyColumns, 'rows' => $rows, 'summary' => $summary, 'insights' => [], 'exportNotes' => [__('reports.export.note')]];
    }

    private function localizedReportStatus(string $status): string
    {
        return match ($status) {
            'submitted' => __('reports.status.submitted'),
            'approved' => __('reports.status.approved'),
            'rejected' => __('reports.status.rejected'),
            default => __('reports.status.draft'),
        };
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

    private function resolvePropertyName(array $data): string
    {
        $property = collect($data['properties'])->firstWhere('id', $data['filters']['propertyId']);

        return is_array($property) ? (string) ($property['name'] ?? 'All Properties') : 'All Properties';
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
