<?php

namespace App\Jobs;

use App\Models\AuditLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class WriteAuditLogJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(public array $attributes)
    {
        $this->onQueue(config('pos.audit.queue', 'audit'));
    }

    public function handle(): void
    {
        AuditLog::query()->create($this->attributes);
    }

    public function failed(Throwable $exception): void
    {
        report($exception);
    }
}
