<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\AuditLogArchive;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

class ArchiveAuditLogsCommand extends Command
{
    protected $signature = 'pos:archive-audit-logs
        {--days= : Override retention window in days}
        {--disk= : Override archive disk}
        {--dry-run : Do not delete records, only emit counts}';

    protected $description = 'Archive and prune audit log rows older than the retention window.';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?? config('pos.retention.audit_days', 30));
        $disk = (string) ($this->option('disk') ?? config('pos.retention.audit_archive_disk', 'local'));
        $basePath = (string) config('pos.retention.audit_archive_path', 'audit-archive');
        $dryRun = (bool) $this->option('dry-run');

        $cutoff = CarbonImmutable::now()->subDays($days)->startOfDay();

        $this->info(sprintf('Archiving audit logs created before %s (retention: %d days, disk: %s).',
            $cutoff->toDateTimeString(),
            $days,
            $disk,
        ));

        $storage = Storage::disk($disk);

        $totalArchived = 0;

        $oldest = AuditLog::query()
            ->where('created_at', '<', $cutoff)
            ->min('created_at');

        if ($oldest === null) {
            $this->info('No audit logs to archive.');

            return self::SUCCESS;
        }

        $cursor = CarbonImmutable::parse($oldest)->startOfMonth();
        $cutoffMonth = $cutoff->startOfMonth();

        $groups = [];
        while ($cursor < $cutoffMonth) {
            $groups[] = $cursor->format('Y-m');
            $cursor = $cursor->addMonth();
        }

        foreach ($groups as $period) {
            $archived = $this->archivePeriod($period, $storage, $disk, $basePath, $dryRun);
            $totalArchived += $archived;
        }

        $this->info("Archived {$totalArchived} audit log records.");

        return self::SUCCESS;
    }

    private function archivePeriod(
        string $period,
        Filesystem $storage,
        string $disk,
        string $basePath,
        bool $dryRun,
    ): int {
        [$year, $month] = array_map('intval', explode('-', $period));

        $start = CarbonImmutable::create($year, $month, 1)->startOfMonth();
        $end = $start->endOfMonth();

        $relativePath = rtrim($basePath, '/')."/{$period}.jsonl.gz";

        $tempPath = tempnam(sys_get_temp_dir(), 'audit-');

        if ($tempPath === false) {
            $this->error('Unable to allocate temp file for audit archive.');

            return 0;
        }

        $handle = gzopen($tempPath, 'wb9');

        if ($handle === false) {
            $this->error("Unable to open archive file {$tempPath} for writing.");
            @unlink($tempPath);

            return 0;
        }

        $count = 0;

        AuditLog::query()
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('id')
            ->chunkById(500, function ($logs) use ($handle, &$count): void {
                foreach ($logs as $log) {
                    gzwrite($handle, json_encode($log->getAttributes(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE).PHP_EOL);
                    $count++;
                }
            });

        gzclose($handle);

        if ($count === 0) {
            @unlink($tempPath);

            return 0;
        }

        $sizeBytes = (int) @filesize($tempPath);
        $checksum = @hash_file('sha256', $tempPath) ?: null;

        $stream = fopen($tempPath, 'rb');
        $storage->put($relativePath, $stream);

        if (is_resource($stream)) {
            fclose($stream);
        }

        @unlink($tempPath);

        AuditLogArchive::query()->updateOrCreate(
            ['period' => $period, 'disk' => $disk],
            [
                'path' => $relativePath,
                'records_count' => $count,
                'size_bytes' => $sizeBytes,
                'checksum' => $checksum,
            ],
        );

        if (! $dryRun) {
            AuditLog::query()
                ->whereBetween('created_at', [$start, $end])
                ->delete();
        }

        $this->line(sprintf(
            ' - %s: %d records → %s (%s bytes)%s',
            $period,
            $count,
            $relativePath,
            number_format($sizeBytes),
            $dryRun ? ' [dry-run]' : '',
        ));

        return $count;
    }
}
