<?php

namespace App\Services\Projection;

use App\Models\Branch;
use App\Models\BranchDailyMetric;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProjectionHealthService
{
    public function snapshot(bool $usesProjectionData = true): array
    {
        $staleAfterMinutes = (int) config('pos.projection.health.stale_after_minutes', 30);
        $criticalAfterMinutes = (int) config('pos.projection.health.critical_after_minutes', 120);
        $recentActivityHours = (int) config('pos.projection.health.recent_activity_hours', 48);

        $projectionRows = BranchDailyMetric::query()
            ->selectRaw('branch_id, MAX(last_projected_at) as latest_projection_at, MAX(metric_date) as latest_metric_date')
            ->groupBy('branch_id')
            ->get()
            ->keyBy('branch_id');

        $orderActivity = DB::table('orders')
            ->selectRaw('branch_id, MAX(updated_at) as latest_order_activity_at')
            ->groupBy('branch_id')
            ->pluck('latest_order_activity_at', 'branch_id');

        $expenseActivity = DB::table('expenses')
            ->selectRaw('branch_id, MAX(updated_at) as latest_expense_activity_at')
            ->groupBy('branch_id')
            ->pluck('latest_expense_activity_at', 'branch_id');

        $branches = Branch::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $recentCutoff = now()->subHours($recentActivityHours);

        $branchStates = $branches->map(function (Branch $branch) use (
            $projectionRows,
            $orderActivity,
            $expenseActivity,
            $recentCutoff,
            $staleAfterMinutes,
            $criticalAfterMinutes,
        ) {
            $projection = $projectionRows->get($branch->id);
            $latestProjectionAt = $projection?->latest_projection_at
                ? Carbon::parse((string) $projection->latest_projection_at)
                : null;
            $latestMetricDate = $projection?->latest_metric_date
                ? Carbon::parse((string) $projection->latest_metric_date)->toDateString()
                : null;

            $sourceCandidates = collect([
                $orderActivity[$branch->id] ?? null,
                $expenseActivity[$branch->id] ?? null,
            ])->filter();

            $latestSourceAt = $sourceCandidates->isNotEmpty()
                ? $sourceCandidates->map(fn ($value) => Carbon::parse((string) $value))->max()
                : null;

            $lagMinutes = ($latestSourceAt && $latestProjectionAt)
                ? $latestSourceAt->diffInMinutes($latestProjectionAt)
                : null;

            $status = 'healthy';
            $message = 'Projection is current.';

            if ($latestSourceAt && $latestSourceAt->gte($recentCutoff)) {
                if (! $latestProjectionAt) {
                    $status = 'critical';
                    $message = 'Recent source activity exists but no projection has been recorded.';
                } elseif ($latestProjectionAt->lt($latestSourceAt)) {
                    if (($lagMinutes ?? 0) >= $criticalAfterMinutes) {
                        $status = 'critical';
                        $message = 'Projection is critically behind recent source activity.';
                    } elseif (($lagMinutes ?? 0) >= $staleAfterMinutes) {
                        $status = 'warning';
                        $message = 'Projection is behind recent source activity.';
                    }
                }
            } elseif (! $latestProjectionAt) {
                $status = 'unavailable';
                $message = 'No projection data recorded yet for this branch.';
            }

            return [
                'branchId' => $branch->id,
                'branchName' => $branch->name,
                'status' => $status,
                'message' => $message,
                'latestSourceAt' => $latestSourceAt?->toIso8601String(),
                'latestProjectionAt' => $latestProjectionAt?->toIso8601String(),
                'latestMetricDate' => $latestMetricDate,
                'lagMinutes' => $lagMinutes,
            ];
        });

        $criticalCount = $branchStates->where('status', 'critical')->count();
        $warningCount = $branchStates->where('status', 'warning')->count();
        $unavailableCount = $branchStates->where('status', 'unavailable')->count();

        $overallStatus = match (true) {
            $criticalCount > 0 => 'critical',
            $warningCount > 0 => 'warning',
            $unavailableCount === $branchStates->count() && $branchStates->count() > 0 => 'unavailable',
            default => 'healthy',
        };

        $overallMessage = match ($overallStatus) {
            'critical' => 'One or more branches are materially behind recent source activity.',
            'warning' => 'Projection updates are delayed for some branches.',
            'unavailable' => 'Projection data has not been generated yet.',
            default => 'Projection data is current for active branches.',
        };

        $latestProjectionAt = $branchStates
            ->pluck('latestProjectionAt')
            ->filter()
            ->map(fn (string $value) => Carbon::parse($value))
            ->sortDesc()
            ->first();

        return [
            'usesProjectionData' => $usesProjectionData,
            'status' => $overallStatus,
            'message' => $overallMessage,
            'latestProjectionAt' => $latestProjectionAt?->toIso8601String(),
            'staleBranchCount' => $criticalCount + $warningCount,
            'criticalBranchCount' => $criticalCount,
            'warningBranchCount' => $warningCount,
            'branches' => $branchStates
                ->whereIn('status', ['critical', 'warning', 'unavailable'])
                ->take(5)
                ->values()
                ->all(),
        ];
    }
}
