<?php

namespace App\Services\Printing;

use App\Models\Printer;

class PrinterTransportService
{
    /**
     * @return array{success: bool, error?: string|null}
     */
    public function sendNetworkPrint(Printer $printer, string $content): array
    {
        $socket = @fsockopen(
            $printer->ip_address,
            (int) $printer->port,
            $errorNumber,
            $errorMessage,
            2
        );

        if (! $socket) {
            return [
                'success' => false,
                'error' => trim($errorMessage) !== ''
                    ? $errorMessage
                    : 'Unable to connect to the printer socket.',
            ];
        }

        stream_set_timeout($socket, 2);

        $payload = "\x1B@\x1Ba\x01".$content."\n\n\n"."\x1DV\x41\x00";
        $bytesWritten = @fwrite($socket, $payload);
        @fflush($socket);
        @fclose($socket);

        if ($bytesWritten === false || $bytesWritten === 0) {
            return [
                'success' => false,
                'error' => 'Printer connection opened but no data was written.',
            ];
        }

        return ['success' => true];
    }
}
