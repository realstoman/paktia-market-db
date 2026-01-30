<?php

use App\Models\Branch;

class BranchService
{
    public function create(array $data): Branch
    {
        return Branch::create($data);
    }
}
