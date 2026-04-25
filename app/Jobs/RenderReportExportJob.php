<?php

namespace App\Jobs;

use App\Services\Reports\ReportFileRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Renders a previously-prepared report payload into PDF/XLSX bytes and
 * persists the file to the configured exports disk so the requesting
 * user can download it later through the reports/exports endpoint.
 *
 * Heavy CPU-bound rendering (DOMPDF, PhpSpreadsheet) runs off the web
 * worker; the user gets an immediate "we'll have this ready shortly"
 * response from the controller.
 */
class RenderReportExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public int $tries = 2;

    public function __construct(
        public readonly int $userId,
        public readonly string $format,
        public readonly array $data,
        public readonly string $filename,
    ) {
        $this->onQueue((string) config('pos.exports.queue', 'default'));
    }

    public function handle(ReportFileRenderer $renderer): void
    {
        $bytes = match ($this->format) {
            'pdf' => $renderer->renderPdf($this->data),
            'xlsx' => $renderer->renderXlsx($this->data),
            default => throw new \InvalidArgumentException(
                "Unsupported export format [{$this->format}]."
            ),
        };

        $disk = (string) config('pos.exports.disk', 'local');
        $path = static::storagePath($this->userId, $this->filename);

        Storage::disk($disk)->put($path, $bytes, 'private');

        Log::info('Generated report export.', [
            'user_id' => $this->userId,
            'format' => $this->format,
            'path' => $path,
            'bytes' => strlen($bytes),
        ]);
    }

    /**
     * Canonical storage path for a generated export. Centralized so the
     * job and the download endpoint stay in sync.
     */
    public static function storagePath(int $userId, string $filename): string
    {
        $base = trim((string) config('pos.exports.path', 'reports/exports'), '/');
        $safeFilename = basename($filename);

        return "{$base}/{$userId}/{$safeFilename}";
    }
}
