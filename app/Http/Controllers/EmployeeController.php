<?php

namespace App\Http\Controllers;

use App\Enums\EmployeeStatus;
use App\Enums\PermissionEnum;
use App\Models\Employee;
use App\Models\EmployeeAdvance;
use App\Models\EmployeeContractPaymentSchedule;
use App\Models\EmployeePosition;
use App\Models\EmploymentType;
use App\Models\PayrollRunItem;
use App\Models\Property;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_VIEW->value);

        $employees = Employee::query()
            ->with(['property:id,name,name_translations', 'employmentType:id,name', 'employeePosition:id,name', 'shift:id,name,start_time,end_time'])
            ->orderByDesc('id')
            ->get();

        $employeeIds = $employees->pluck('id');

        $advancesByEmployee = EmployeeAdvance::query()
            ->with(['property:id,name,name_translations'])
            ->whereIn('employee_id', $employeeIds)
            ->orderByDesc('advance_date')
            ->orderByDesc('id')
            ->get()
            ->groupBy('employee_id');

        $payrollItemsByEmployee = PayrollRunItem::query()
            ->with(['payrollRun:id,property_id,period_start,period_end,status,paid_at', 'payrollRun.property:id,name,name_translations'])
            ->whereIn('employee_id', $employeeIds)
            ->orderByDesc('id')
            ->get()
            ->groupBy('employee_id');

        $contractSchedulesByEmployee = EmployeeContractPaymentSchedule::query()
            ->with(['contract:id,employee_id,property_id,contract_amount,start_date,end_date,status', 'contract.property:id,name,name_translations'])
            ->whereHas('contract', fn ($query) => $query->whereIn('employee_id', $employeeIds))
            ->orderBy('due_date')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (EmployeeContractPaymentSchedule $schedule) => $schedule->contract?->employee_id);

        $employees = $employees
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'full_name' => trim($employee->first_name.' '.$employee->last_name),
                'phone' => $employee->phone,
                'address' => $employee->address,
                'description' => $employee->description,
                'profile_picture' => $employee->profile_picture,
                'attachments' => $employee->attachments,
                'property' => $employee->property?->name,
                'property_id' => $employee->property_id,
                'employment_type' => $employee->employmentType?->name,
                'employment_type_id' => $employee->employment_type_id,
                'employee_position' => $employee->employeePosition?->name,
                'employee_position_id' => $employee->employee_position_id,
                'shift' => $employee->shift
                    ? $employee->shift->name.' ('.$this->formatTimeTo12Hour((string) $employee->shift->start_time).' - '.$this->formatTimeTo12Hour((string) $employee->shift->end_time).')'
                    : null,
                'shift_id' => $employee->shift_id,
                'salary' => $employee->salary,
                'salary_currency' => $employee->salary_currency,
                'contract_start_date' => $employee->contract_start_date?->toDateString(),
                'contract_end_date' => $employee->contract_end_date?->toDateString(),
                'contract_amount' => $employee->contract_amount,
                'status' => $employee->status,
                'is_active' => $employee->is_active,
                'advances' => ($advancesByEmployee->get($employee->id) ?? collect())
                    ->map(fn (EmployeeAdvance $advance) => [
                        'id' => $advance->id,
                        'advance_date' => $advance->advance_date?->toDateString(),
                        'amount' => $advance->amount,
                        'deducted_amount' => $advance->deducted_amount,
                        'remaining_balance' => $advance->remaining_balance,
                        'status' => $advance->status,
                        'reason' => $advance->reason,
                        'repayment_method' => $advance->repayment_method,
                        'property' => $advance->property ? [
                            'id' => $advance->property->id,
                            'name' => $advance->property->name,
                        ] : null,
                        'created_at' => $advance->created_at?->toIso8601String(),
                    ])
                    ->values(),
                'payroll_items' => ($payrollItemsByEmployee->get($employee->id) ?? collect())
                    ->map(fn (PayrollRunItem $item) => [
                        'id' => $item->id,
                        'gross_salary' => $item->gross_salary,
                        'bonuses' => $item->bonuses,
                        'deductions' => $item->deductions,
                        'advances_deducted' => $item->advances_deducted,
                        'overtime_amount' => $item->overtime_amount,
                        'net_salary' => $item->net_salary,
                        'salary_type' => $item->salary_type,
                        'payment_method' => $item->payment_method,
                        'payment_status' => $item->payment_status,
                        'payment_date' => $item->payment_date?->toDateString(),
                        'advance_breakdown' => collect($item->advance_breakdown ?? [])
                            ->filter(fn ($entry) => is_array($entry) && (float) ($entry['amount'] ?? 0) > 0)
                            ->map(fn (array $entry) => [
                                'advance_id' => isset($entry['advance_id']) ? (int) $entry['advance_id'] : null,
                                'amount' => round((float) ($entry['amount'] ?? 0), 2),
                                'reason' => trim((string) ($entry['reason'] ?? '')) ?: 'Salary advance deduction',
                                'type' => (string) ($entry['type'] ?? 'advance'),
                            ])
                            ->values()
                            ->all(),
                        'covered_period_dates' => $item->covered_period_dates,
                        'covered_month_count' => $item->covered_month_count,
                        'payroll_run' => $item->payrollRun ? [
                            'id' => $item->payrollRun->id,
                            'status' => $item->payrollRun->status,
                            'period_start' => $item->payrollRun->period_start?->toDateString(),
                            'period_end' => $item->payrollRun->period_end?->toDateString(),
                            'paid_at' => $item->payrollRun->paid_at?->toIso8601String(),
                            'property' => $item->payrollRun->property ? [
                                'id' => $item->payrollRun->property->id,
                                'name' => $item->payrollRun->property->name,
                            ] : null,
                        ] : null,
                    ])
                    ->values(),
                'contract_schedules' => ($contractSchedulesByEmployee->get($employee->id) ?? collect())
                    ->map(fn (EmployeeContractPaymentSchedule $schedule) => [
                        'id' => $schedule->id,
                        'due_date' => $schedule->due_date?->toDateString(),
                        'title' => $schedule->title,
                        'amount' => $schedule->amount,
                        'status' => $schedule->status,
                        'payment_method' => $schedule->payment_method,
                        'paid_at' => $schedule->paid_at?->toIso8601String(),
                        'contract' => $schedule->contract ? [
                            'id' => $schedule->contract->id,
                            'status' => $schedule->contract->status,
                            'contract_amount' => $schedule->contract->contract_amount,
                            'start_date' => $schedule->contract->start_date?->toDateString(),
                            'end_date' => $schedule->contract->end_date?->toDateString(),
                            'property' => $schedule->contract->property ? [
                                'id' => $schedule->contract->property->id,
                                'name' => $schedule->contract->property->name,
                            ] : null,
                        ] : null,
                    ])
                    ->values(),
                'upcoming_payment' => $this->resolveUpcomingPayment(
                    $employee,
                    $contractSchedulesByEmployee->get($employee->id) ?? collect(),
                    $payrollItemsByEmployee->get($employee->id) ?? collect(),
                ),
                'created_at' => $employee->created_at,
                'updated_at' => $employee->updated_at,
            ])
            ->values();

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'properties' => Property::orderBy('name')->get(['id', 'name', 'name_translations']),
            'employmentTypes' => EmploymentType::orderBy('name')->get(['id', 'name', 'description']),
            'employeePositions' => EmployeePosition::orderBy('name')->get(['id', 'name', 'description']),
            'shifts' => Shift::orderBy('name')->get(['id', 'name', 'start_time', 'end_time', 'description']),
            'canCreate' => Gate::allows(PermissionEnum::EMPLOYEES_CREATE->value),
        ]);
    }

    private function resolveUpcomingPayment(
        Employee $employee,
        Collection $contractSchedules,
        Collection $payrollItems,
    ): array {
        $nextSchedule = $contractSchedules
            ->first(fn (EmployeeContractPaymentSchedule $schedule) => $schedule->status !== 'paid');

        if ($nextSchedule) {
            return [
                'source' => 'contract_schedule',
                'title' => $nextSchedule->title ?: 'Contract payment',
                'amount' => $nextSchedule->amount,
                'currency' => $employee->salary_currency ?? 'AFN',
                'status' => $nextSchedule->status,
                'due_date' => $nextSchedule->due_date?->toDateString(),
            ];
        }

        $nextPayroll = $payrollItems
            ->filter(fn (PayrollRunItem $item) => $item->payment_status !== 'paid')
            ->sortBy(fn (PayrollRunItem $item) => $item->payrollRun?->period_end?->timestamp ?? PHP_INT_MAX)
            ->first();

        if ($nextPayroll) {
            return [
                'source' => 'payroll',
                'title' => 'Monthly salary',
                'amount' => $nextPayroll->net_salary,
                'currency' => $employee->salary_currency ?? 'AFN',
                'status' => $nextPayroll->payment_status,
                'due_date' => $nextPayroll->payrollRun?->period_end?->toDateString(),
            ];
        }

        return [
            'source' => 'scheduled',
            'title' => $employee->contract_amount ? 'Contract payment' : 'Monthly salary',
            'amount' => $employee->contract_amount ?? $employee->salary ?? 0,
            'currency' => $employee->salary_currency ?? 'AFN',
            'status' => 'scheduled',
            'due_date' => Carbon::now()->endOfMonth()->toDateString(),
        ];
    }

    public function store(Request $request)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_CREATE->value);

        $validated = $request->validate($this->rules());

        if ($request->hasFile('profile_picture')) {
            $validated['profile_picture'] = $request
                ->file('profile_picture')
                ->store('employees/profile-pictures', 'public');
        }

        $attachments = $request->file('attachments', []);
        if (! empty($attachments)) {
            $validated['attachments'] = collect($attachments)
                ->map(fn ($file) => $file->store('employees/attachments', 'public'))
                ->values()
                ->all();
        }

        $this->normalizeCompensationPayload($validated);

        Employee::create($validated);

        return redirect()->route('employees.index')
            ->with('success', 'Employee created successfully.');
    }

    public function update(Request $request, Employee $employee)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate($this->rules());

        $attachmentsToRemove = collect($validated['remove_attachment_paths'] ?? [])
            ->filter(fn ($path) => is_string($path) && $path !== '')
            ->values()
            ->all();

        if ($request->hasFile('profile_picture')) {
            if (! empty($employee->profile_picture)) {
                Storage::disk('public')->delete($employee->profile_picture);
            }

            $validated['profile_picture'] = $request
                ->file('profile_picture')
                ->store('employees/profile-pictures', 'public');
        }

        $attachments = $request->file('attachments', []);
        $currentAttachments = array_values(
            array_diff(
                is_array($employee->attachments) ? $employee->attachments : [],
                $attachmentsToRemove,
            ),
        );

        if (! empty($attachmentsToRemove)) {
            Storage::disk('public')->delete($attachmentsToRemove);
        }

        if (! empty($attachments)) {
            if ((count($currentAttachments) + count($attachments)) > 25) {
                return back()->withErrors([
                    'attachments' => 'Total attachments cannot exceed 25 files.',
                ])->withInput();
            }

            $storedAttachments = collect($attachments)
                ->map(fn ($file) => $file->store('employees/attachments', 'public'))
                ->values()
                ->all();

            $validated['attachments'] = array_values(
                array_merge($currentAttachments, $storedAttachments),
            );
        } elseif (! empty($attachmentsToRemove)) {
            $validated['attachments'] = $currentAttachments;
        }

        $this->normalizeCompensationPayload($validated);

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

        if (! empty($employee->profile_picture)) {
            Storage::disk('public')->delete($employee->profile_picture);
        }

        if (! empty($employee->attachments)) {
            Storage::disk('public')->delete($employee->attachments);
        }

        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee deleted successfully.');
    }

    public function storePosition(Request $request)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:employee_positions,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        EmployeePosition::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('employees.index')
            ->with('success', 'Employee position created successfully.');
    }

    public function updatePosition(Request $request, EmployeePosition $employeePosition)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('employee_positions', 'name')->ignore($employeePosition->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $employeePosition->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('employees.index')
            ->with('success', 'Employee position updated successfully.');
    }

    public function destroyPosition(EmployeePosition $employeePosition)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $employeePosition->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee position deleted successfully.');
    }

    public function storeEmploymentType(Request $request)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:employment_types,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        EmploymentType::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('employees.index')
            ->with('success', 'Employment type created successfully.');
    }

    public function updateEmploymentType(Request $request, EmploymentType $employmentType)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('employment_types', 'name')->ignore($employmentType->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $employmentType->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('employees.index')
            ->with('success', 'Employment type updated successfully.');
    }

    public function destroyEmploymentType(EmploymentType $employmentType)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $employmentType->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employment type deleted successfully.');
    }

    public function storeShift(Request $request)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:shifts,name'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        Shift::create([
            'name' => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('employees.index')
            ->with('success', 'Shift created successfully.');
    }

    public function updateShift(Request $request, Shift $shift)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('shifts', 'name')->ignore($shift->id),
            ],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $shift->update([
            'name' => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()->route('employees.index')
            ->with('success', 'Shift updated successfully.');
    }

    public function destroyShift(Shift $shift)
    {
        Gate::authorize(PermissionEnum::EMPLOYEES_UPDATE->value);

        $shift->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Shift deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'property_id' => ['required', 'exists:properties,id'],
            'employment_type_id' => ['nullable', 'exists:employment_types,id'],
            'employee_position_id' => ['nullable', 'exists:employee_positions,id'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_contract_based' => ['required', 'boolean'],
            'salary' => ['nullable', 'numeric', 'min:0', 'required_unless:is_contract_based,true'],
            'salary_currency' => ['required', Rule::in(['AFN', 'USD'])],
            'contract_start_date' => ['nullable', 'date', 'required_with:employment_type_id'],
            'contract_end_date' => ['nullable', 'date', 'required_with:employment_type_id', 'after_or_equal:contract_start_date'],
            'contract_amount' => ['nullable', 'numeric', 'min:0', 'required_if:is_contract_based,true'],
            'profile_picture' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'attachments' => ['nullable', 'array', 'max:25'],
            'attachments.*' => [
                'file',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,csv,txt',
                'max:5120',
            ],
            'remove_attachment_paths' => ['nullable', 'array'],
            'remove_attachment_paths.*' => ['string'],
            'status' => [
                'required',
                Rule::in(array_map(static fn (EmployeeStatus $status) => $status->value, EmployeeStatus::cases())),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }

    private function formatTimeTo12Hour(string $time): string
    {
        $timestamp = strtotime($time);

        if ($timestamp === false) {
            return $time;
        }

        return date('g:i A', $timestamp);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function normalizeCompensationPayload(array &$validated): void
    {
        $isContract = (bool) ($validated['is_contract_based'] ?? false);

        if ($isContract) {
            $validated['salary'] = null;
        } else {
            $validated['contract_amount'] = null;
        }

        unset($validated['is_contract_based']);
    }
}
