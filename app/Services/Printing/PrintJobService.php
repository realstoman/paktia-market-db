<?php

namespace App\Services\Printing;

use App\Models\PrintJob;
use App\Models\Printer;

class PrintJobService
{
    public function __construct(
        private readonly PrinterTransportService $printerTransportService,
    ) {}

    public function process(PrintJob $job, Printer $printer, string $content): PrintJob
    {
        $job->forceFill([
            'status' => 'processing',
            'attempts' => (int) $job->attempts + 1,
            'processed_at' => now(),
            'last_error' => null,
        ])->save();

        $result = $this->printerTransportService->sendNetworkPrint($printer, $content);

        if ($result['success'] ?? false) {
            $job->forceFill([
                'status' => 'printed',
                'printed_at' => now(),
                'last_error' => null,
            ])->save();

            return $job->fresh();
        }

        $job->forceFill([
            'status' => 'failed',
            'last_error' => $result['error'] ?? 'Unknown printer failure.',
        ])->save();

        return $job->fresh();
    }
}
