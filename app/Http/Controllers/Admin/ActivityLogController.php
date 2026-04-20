<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogArchiveResource;
use App\Http\Resources\ActivityLogResource;
use App\Models\AuditLog;
use App\Models\AuditLogArchive;
use App\Models\Branch;
use App\Models\Branch as BranchModel;
use App\Models\CashMovement;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use App\Models\EmployeeContract;
use App\Models\Expense;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PayrollRun;
use App\Models\PayrollRunItem;
use App\Models\Product;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', AuditLog::class);

        $paginator = QueryBuilder::for(AuditLog::class)
            ->with(['user:id,name,email', 'branch:id,name', 'kitchen:id,name'])
            ->allowedFilters([
                AllowedFilter::exact('user_id'),
                AllowedFilter::exact('branch_id'),
                AllowedFilter::exact('kitchen_id'),
                AllowedFilter::exact('action'),
                AllowedFilter::exact('auditable_type'),
                AllowedFilter::exact('batch_uuid'),
                AllowedFilter::callback('from', fn ($q, $v) => $q->where('created_at', '>=', $v)),
                AllowedFilter::callback('to', fn ($q, $v) => $q->where('created_at', '<=', $v)),
                AllowedFilter::callback('q', fn ($q, $v) => $q->search($v)),
            ])
            ->allowedSorts(['created_at', 'action', 'auditable_type', 'user_id'])
            ->defaultSort('-created_at')
            ->paginate($request->integer('per_page', 50))
            ->withQueryString();

        $archives = AuditLogArchive::query()
            ->orderByDesc('period')
            ->limit(24)
            ->get();

        return Inertia::render('admin/activity-logs/index', [
            'logs' => [
                'data' => ActivityLogResource::collection($paginator->items())->resolve(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
            'archives' => ActivityLogArchiveResource::collection($archives)->resolve(),
            'filters' => $request->only([
                'filter',
                'sort',
                'per_page',
            ]),
            'referenceData' => [
                'actions' => $this->actionOptions(),
                'auditableTypes' => $this->auditableTypeOptions(),
                'users' => User::query()
                    ->select('id', 'name', 'email')
                    ->orderBy('name')
                    ->get(),
                'branches' => BranchModel::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get(),
            ],
        ]);
    }

    /**
     * Merge canonical action names with any recorded actions.
     *
     * @return array<int, string>
     */
    private function actionOptions(): array
    {
        $canonical = [
            'created',
            'updated',
            'deleted',
            'restored',
            'auth.login',
            'auth.logout',
            'auth.login_failed',
            'auth.lockout',
            'auth.password_reset',
            'auth.registered',
            'auth.email_verified',
            'auth.2fa.enabled',
            'auth.2fa.confirmed',
            'auth.2fa.disabled',
            'auth.2fa.failed',
            'auth.2fa.recovery_codes_generated',
        ];

        $recorded = AuditLog::query()
            ->select('action')
            ->distinct()
            ->pluck('action')
            ->filter()
            ->all();

        $merged = array_values(array_unique(array_merge($canonical, $recorded)));
        sort($merged);

        return $merged;
    }

    /**
     * Merge the list of Auditable models with any recorded types.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function auditableTypeOptions(): array
    {
        $canonical = [
            Order::class,
            OrderItem::class,
            Payment::class,
            InventoryItem::class,
            InventoryTransaction::class,
            Expense::class,
            CashMovement::class,
            Employee::class,
            EmployeeContract::class,
            EmployeeAdvance::class,
            PayrollRun::class,
            PayrollRunItem::class,
            Product::class,
            BranchModel::class,
            Kitchen::class,
            User::class,
            SystemSetting::class,
        ];

        $recorded = AuditLog::query()
            ->select('auditable_type')
            ->whereNotNull('auditable_type')
            ->distinct()
            ->pluck('auditable_type')
            ->filter()
            ->all();

        $classes = array_values(array_unique(array_merge($canonical, $recorded)));
        usort($classes, fn (string $a, string $b) => class_basename($a) <=> class_basename($b));

        return array_map(fn (string $class) => [
            'value' => $class,
            'label' => class_basename($class),
        ], $classes);
    }

    public function show(AuditLog $auditLog): Response
    {
        $this->authorize('view', $auditLog);

        $auditLog->load(['user:id,name,email', 'branch:id,name', 'kitchen:id,name']);

        return Inertia::render('admin/activity-logs/show', [
            'log' => (new ActivityLogResource($auditLog))->resolve(),
        ]);
    }

    public function downloadArchive(AuditLogArchive $archive): StreamedResponse
    {
        $this->authorize('downloadArchive', AuditLog::class);

        $disk = Storage::disk($archive->disk);

        abort_unless($disk->exists($archive->path), 404);

        return $disk->download(
            $archive->path,
            "audit-logs-{$archive->period}.jsonl.gz",
        );
    }
}
