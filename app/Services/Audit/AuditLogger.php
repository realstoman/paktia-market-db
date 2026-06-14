<?php

namespace App\Services\Audit;

use App\Jobs\WriteAuditLogJob;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;

class AuditLogger
{
    /**
     * Record an auditable event.
     *
     * @param  array<string, mixed>|null  $oldValues
     * @param  array<string, mixed>|null  $newValues
     * @param  array<string, mixed>|null  $meta
     */
    public function log(
        string $action,
        ?Model $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $meta = null,
        ?User $causer = null,
        ?string $batchUuid = null,
    ): void {
        $causer = $causer ?? (Auth::check() ? Auth::user() : null);
        $context = $this->requestContext();

        $attributes = [
            'user_id' => $causer?->getKey(),
            'action' => $action,
            'auditable_type' => $subject ? $subject->getMorphClass() : null,
            'auditable_id' => $subject?->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $context['ip_address'],
            'user_agent' => $context['user_agent'],
            'url' => $context['url'],
            'method' => $context['method'],
            'batch_uuid' => $batchUuid ?? (string) Str::uuid(),
            'branch_id' => $this->resolveBranchId($subject, $causer),
            'meta' => $meta,
        ];

        if (config('pos.audit.use_queue', false)) {
            WriteAuditLogJob::dispatch($attributes);

            return;
        }

        WriteAuditLogJob::dispatchSync($attributes);
    }

    /**
     * @return array{ip_address: ?string, user_agent: ?string, url: ?string, method: ?string}
     */
    private function requestContext(): array
    {
        if (! app()->bound('request')) {
            return [
                'ip_address' => null,
                'user_agent' => null,
                'url' => null,
                'method' => null,
            ];
        }

        try {
            $request = Request::instance();
        } catch (\Throwable) {
            return [
                'ip_address' => null,
                'user_agent' => null,
                'url' => null,
                'method' => null,
            ];
        }

        return [
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1024),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
        ];
    }

    private function resolveBranchId(?Model $subject, ?User $causer): ?int
    {
        if ($subject !== null) {
            $branchId = $subject->getAttribute('branch_id');

            if ($branchId !== null) {
                return (int) $branchId;
            }
        }

        return $causer?->branch_id;
    }

}
