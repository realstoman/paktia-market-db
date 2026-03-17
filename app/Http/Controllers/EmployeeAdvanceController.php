<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeAdvanceController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'employee_id' => ['nullable', 'exists:employees,id'],
            'status' => ['nullable', 'in:draft,submitted,approved'],
        ]);

        $branchId = isset($validated['branch_id']) ? (int) $validated['branch_id'] : null;
        $employeeId = isset($validated['employee_id']) ? (int) $validated['employee_id'] : null;
        $status = $validated['status'] ?? null;

        $baseQuery = EmployeeAdvance::query()
            ->with([
                'employee:id,first_name,last_name,branch_id',
                'branch:id,name',
                'creator:id,name',
                'approver:id,name',
            ])
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))
            ->when($status, fn ($query, $value) => $query->where('status', $value));

        $advances = (clone $baseQuery)
            ->orderByDesc('advance_date')
            ->orderByDesc('id')
            ->get();

        $summaryQuery = EmployeeAdvance::query()
            ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
            ->when($employeeId, fn ($query) => $query->where('employee_id', $employeeId))
            ->when($status, fn ($query, $value) => $query->where('status', $value));

        return Inertia::render('finance/employee-advances/index', [
            'filters' => [
                'branchId' => $branchId,
                'employeeId' => $employeeId,
                'status' => $status,
            ],
            'summary' => [
                'totalAmount' => (float) (clone $summaryQuery)->sum('amount'),
                'outstandingBalance' => (float) (clone $summaryQuery)->sum('remaining_balance'),
                'submittedCount' => (int) (clone $summaryQuery)->where('status', 'submitted')->count(),
                'approvedCount' => (int) (clone $summaryQuery)->where('status', 'approved')->count(),
            ],
            'advances' => $advances,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'employees' => Employee::query()
                ->with('branch:id,name')
                ->where('is_active', true)
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateAdvance($request);
        $status = $validated['status'] ?? 'draft';

        EmployeeAdvance::create([
            'employee_id' => $validated['employee_id'],
            'branch_id' => $validated['branch_id'] ?? null,
            'advance_date' => $validated['advance_date'],
            'amount' => $validated['amount'],
            'deducted_amount' => 0,
            'remaining_balance' => $validated['amount'],
            'repayment_method' => $validated['repayment_method'] ?? null,
            'status' => $status,
            'reason' => $validated['reason'] ?? null,
            'approved_by' => $status === 'approved' ? $request->user()?->id : null,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('finance.employee-advances.index')
            ->with('success', 'Employee advance created successfully.');
    }

    public function update(Request $request, EmployeeAdvance $employeeAdvance)
    {
        if (($employeeAdvance->status ?? 'draft') === 'approved') {
            return redirect()
                ->route('finance.employee-advances.index')
                ->withErrors(['advance' => 'Approved advance cannot be edited.']);
        }

        $validated = $this->validateAdvance($request);
        $status = $validated['status'] ?? $employeeAdvance->status ?? 'draft';

        $employeeAdvance->update([
            'employee_id' => $validated['employee_id'],
            'branch_id' => $validated['branch_id'] ?? null,
            'advance_date' => $validated['advance_date'],
            'amount' => $validated['amount'],
            'remaining_balance' => max(
                0,
                (float) $validated['amount'] - (float) $employeeAdvance->deducted_amount
            ),
            'repayment_method' => $validated['repayment_method'] ?? null,
            'status' => $status,
            'reason' => $validated['reason'] ?? null,
            'approved_by' => $status === 'approved' ? $request->user()?->id : null,
        ]);

        return redirect()
            ->route('finance.employee-advances.index')
            ->with('success', 'Employee advance updated successfully.');
    }

    public function approve(Request $request, EmployeeAdvance $employeeAdvance)
    {
        $employeeAdvance->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('finance.employee-advances.index')
            ->with('success', 'Employee advance approved successfully.');
    }

    public function reject(EmployeeAdvance $employeeAdvance)
    {
        $employeeAdvance->update([
            'status' => 'draft',
            'approved_by' => null,
        ]);

        return redirect()
            ->route('finance.employee-advances.index')
            ->with('success', 'Employee advance moved back to draft.');
    }

    protected function validateAdvance(Request $request): array
    {
        return $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'advance_date' => ['required', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'min:1'],
            'repayment_method' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:draft,submitted,approved'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
