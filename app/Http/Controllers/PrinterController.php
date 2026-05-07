<?php

namespace App\Http\Controllers;

use App\Models\Printer;
use App\Services\Printing\PrinterService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrinterController extends Controller
{
    public function index(PrinterService $printerService)
    {
        return Inertia::render('location/printers/index', [
            ...$printerService->indexData(),
        ]);
    }

    public function store(Request $request, PrinterService $printerService)
    {
        $validated = $this->validatePrinter($request);
        $printerService->create($validated);

        return redirect()->route('printers.index')
            ->with('success', 'Printer created successfully.');
    }

    public function update(Request $request, Printer $printer, PrinterService $printerService)
    {
        $validated = $this->validatePrinter($request);
        $printerService->update($printer, $validated);

        return redirect()->route('printers.index')
            ->with('success', 'Printer updated successfully.');
    }

    public function destroy(Printer $printer, PrinterService $printerService)
    {
        $printerService->delete($printer);

        return redirect()->route('printers.index')
            ->with('success', 'Printer deleted successfully.');
    }

    public function testPrint(Request $request, Printer $printer, PrinterService $printerService)
    {
        $job = $printerService->sendTestPrint($printer, $request->user());

        return redirect()->route('printers.index')
            ->with(
                $job->status === 'printed' ? 'success' : 'error',
                $job->status === 'printed'
                    ? 'Test print sent successfully.'
                    : 'Test print failed: '.($job->last_error ?? 'Unknown printer error.')
            );
    }

    private function validatePrinter(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'ip_address' => ['required', 'ip'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'connection_type' => ['required', 'in:network'],
            'paper_width' => ['required', 'in:58mm,80mm'],
            'copies' => ['required', 'integer', 'min:1', 'max:5'],
            'is_active' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'assignments' => ['nullable', 'array'],
            'assignments.*.assignment_type' => ['required', 'in:kitchen,order_taker,cashier,order_type,generic'],
            'assignments.*.kitchen_id' => ['nullable', 'exists:kitchens,id'],
            'assignments.*.order_type' => ['nullable', 'in:dine_in,takeaway,delivery'],
            'assignments.*.station_label' => ['nullable', 'string', 'max:255'],
            'assignments.*.is_active' => ['required', 'boolean'],
        ]);
    }
}
