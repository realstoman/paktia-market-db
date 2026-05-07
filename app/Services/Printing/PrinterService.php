<?php

namespace App\Services\Printing;

use App\Models\Branch;
use App\Models\Kitchen;
use App\Models\PrintJob;
use App\Models\Printer;
use App\Models\PrinterAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PrinterService
{
    public function __construct(
        private readonly PrintJobService $printJobService,
    ) {}

    public function indexData(): array
    {
        return [
            'printers' => Printer::query()
                ->with([
                    'branch:id,name',
                    'assignments.kitchen:id,name',
                ])
                ->latest('id')
                ->get(),
            'branches' => Branch::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'kitchens' => Kitchen::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }

    public function create(array $validated): Printer
    {
        return DB::transaction(function () use ($validated) {
            $printer = Printer::query()->create($this->printerAttributes($validated));
            $this->syncAssignments($printer, $validated['assignments'] ?? []);

            return $printer->load(['branch:id,name', 'assignments.kitchen:id,name']);
        });
    }

    public function update(Printer $printer, array $validated): Printer
    {
        return DB::transaction(function () use ($printer, $validated) {
            $printer->update($this->printerAttributes($validated));
            $this->syncAssignments($printer, $validated['assignments'] ?? []);

            return $printer->load(['branch:id,name', 'assignments.kitchen:id,name']);
        });
    }

    public function delete(Printer $printer): void
    {
        DB::transaction(function () use ($printer) {
            $printer->assignments()->delete();
            $printer->delete();
        });
    }

    public function sendTestPrint(Printer $printer, User $user): PrintJob
    {
        $printer->loadMissing(['branch:id,name', 'assignments.kitchen:id,name']);
        $primaryAssignment = $printer->assignments
            ->sortBy('priority')
            ->first();

        $job = PrintJob::query()->create([
            'printer_id' => $printer->id,
            'printer_assignment_id' => $primaryAssignment?->id,
            'branch_id' => $printer->branch_id,
            'requested_by' => $user->id,
            'job_type' => 'test',
            'status' => 'pending',
            'title' => 'Printer test: '.$printer->name,
            'payload' => [
                'printer_name' => $printer->name,
                'ip_address' => $printer->ip_address,
                'assignment_type' => $primaryAssignment?->assignment_type,
            ],
        ]);

        return $this->printJobService->process(
            $job,
            $printer,
            $this->buildTestPrintContent($printer, $primaryAssignment),
        );
    }

    private function printerAttributes(array $validated): array
    {
        return [
            'branch_id' => $validated['branch_id'] ?? null,
            'name' => $validated['name'],
            'ip_address' => $validated['ip_address'],
            'port' => $validated['port'] ?? 9100,
            'connection_type' => $validated['connection_type'] ?? 'network',
            'paper_width' => $validated['paper_width'] ?? '80mm',
            'copies' => $validated['copies'] ?? 1,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'notes' => $validated['notes'] ?? null,
        ];
    }

    private function syncAssignments(Printer $printer, array $assignments): void
    {
        $printer->assignments()->delete();

        foreach ($assignments as $index => $assignment) {
            PrinterAssignment::query()->create([
                'printer_id' => $printer->id,
                'assignment_type' => $assignment['assignment_type'],
                'kitchen_id' => $assignment['kitchen_id'] ?? null,
                'order_type' => $assignment['order_type'] ?? null,
                'station_label' => $assignment['station_label'] ?? null,
                'is_active' => (bool) ($assignment['is_active'] ?? true),
                'priority' => $index + 1,
            ]);
        }
    }

    private function buildTestPrintContent(
        Printer $printer,
        ?PrinterAssignment $assignment,
    ): string {
        $assignmentLabel = match ($assignment?->assignment_type) {
            'kitchen' => 'Kitchen: '.($assignment->kitchen?->name ?? 'Unknown'),
            'order_type' => 'Order type: '.($assignment->order_type ?? 'Unknown'),
            'order_taker' => 'Order-taker: '.($assignment->station_label ?? 'Default station'),
            'cashier' => 'Cashier: '.($assignment->station_label ?? 'Cash desk'),
            'generic' => 'Label: '.($assignment->station_label ?? 'General'),
            default => 'No assignment yet',
        };

        return implode("\n", [
            'Baba Restaurant',
            'Printer Connectivity Test',
            now()->format('Y-m-d H:i:s'),
            '',
            'Printer: '.$printer->name,
            'Endpoint: '.$printer->ip_address.':'.$printer->port,
            'Paper: '.$printer->paper_width,
            $assignmentLabel,
            '',
            'If you can read this ticket,',
            'the local print pipeline is working.',
        ]);
    }
}
