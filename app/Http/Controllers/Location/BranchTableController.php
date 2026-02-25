<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Models\BranchTable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchTableController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'table_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('branch_tables')->where(
                    fn ($query) => $query->where('branch_id', $request->input('branch_id')),
                ),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        BranchTable::create([
            'branch_id' => $validated['branch_id'],
            'table_number' => trim($validated['table_number']),
            'title' => trim($validated['title']),
            'description' => $validated['description']
                ? trim($validated['description'])
                : null,
        ]);

        return redirect()->route('branches.index')
            ->with('success', 'Table created successfully.');
    }

    public function update(Request $request, BranchTable $branchTable)
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'table_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('branch_tables')
                    ->ignore($branchTable->id)
                    ->where(
                        fn ($query) => $query->where('branch_id', $request->input('branch_id')),
                    ),
            ],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $branchTable->update([
            'branch_id' => $validated['branch_id'],
            'table_number' => trim($validated['table_number']),
            'title' => trim($validated['title']),
            'description' => $validated['description']
                ? trim($validated['description'])
                : null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()->route('branches.index')
            ->with('success', 'Table updated successfully.');
    }

    public function destroy(BranchTable $branchTable)
    {
        $branchTable->delete();

        return redirect()->route('branches.index')
            ->with('success', 'Table deleted successfully.');
    }
}
