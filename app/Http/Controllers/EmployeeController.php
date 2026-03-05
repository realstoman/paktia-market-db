<?php

namespace App\Http\Controllers;

use App\Enums\EmployeeStatus;
use App\Enums\PermissionEnum;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\EmployeePosition;
use App\Models\EmploymentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_VIEW->value);

        $employees = Employee::query()
            ->with(['branch:id,name', 'employmentType:id,name', 'employeePosition:id,name'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'full_name' => trim($employee->first_name.' '.$employee->last_name),
                'phone' => $employee->phone,
                'address' => $employee->address,
                'description' => $employee->description,
                'branch' => $employee->branch?->name,
                'branch_id' => $employee->branch_id,
                'employment_type' => $employee->employmentType?->name,
                'employment_type_id' => $employee->employment_type_id,
                'employee_position' => $employee->employeePosition?->name,
                'employee_position_id' => $employee->employee_position_id,
                'salary' => $employee->salary,
                'salary_currency' => $employee->salary_currency,
                'status' => $employee->status,
                'is_active' => $employee->is_active,
                'created_at' => $employee->created_at,
                'updated_at' => $employee->updated_at,
            ])
            ->values();

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'branches' => Branch::orderBy('name')->get(['id', 'name']),
            'employmentTypes' => EmploymentType::orderBy('name')->get(['id', 'name']),
            'employeePositions' => EmployeePosition::orderBy('name')->get(['id', 'name']),
            'canCreate' => Gate::allows(PermissionEnum::EMPLOYEES_CREATE->value),
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_CREATE->value);

        $validated = $request->validate($this->rules());

        Employee::create($validated);

        return redirect()->route('employees.index')
            ->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate($this->rules());

        $employee->update($validated);

        return redirect()->route('employees.index')
            ->with('success', 'Employee updated successfully.');
    }

    public function toggleActive(Employee $employee)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $employee->update([
            'is_active' => ! $employee->is_active,
            'status' => $employee->is_active ? EmployeeStatus::INACTIVE->value : EmployeeStatus::ACTIVE->value,
        ]);

        return back()->with('success', 'Employee status updated successfully.');
    }

    public function destroy(Employee $employee)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'employment_type_id' => ['nullable', 'exists:employment_types,id'],
            'employee_position_id' => ['nullable', 'exists:employee_positions,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'salary_currency' => ['required', Rule::in(['AFN', 'USD'])],
            'status' => [
                'required',
                Rule::in(array_map(static fn (EmployeeStatus $status) => $status->value, EmployeeStatus::cases())),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
