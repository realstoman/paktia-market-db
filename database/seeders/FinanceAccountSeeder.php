<?php

namespace Database\Seeders;

use App\Models\FinanceAccount;
use Illuminate\Database\Seeder;

class FinanceAccountSeeder extends Seeder
{
    public function run(): void
    {
        $assets = $this->upsertAccount([
            'code' => '1000',
            'name' => 'Assets',
            'type' => 'asset',
            'is_postable' => false,
            'is_system' => true,
            'status' => 'active',
            'description' => 'Top-level assets group.',
        ]);

        $liabilities = $this->upsertAccount([
            'code' => '2000',
            'name' => 'Liabilities',
            'type' => 'liability',
            'is_postable' => false,
            'is_system' => true,
            'status' => 'active',
            'description' => 'Top-level liabilities group.',
        ]);

        $equity = $this->upsertAccount([
            'code' => '3000',
            'name' => 'Equity',
            'type' => 'equity',
            'is_postable' => false,
            'is_system' => true,
            'status' => 'active',
            'description' => 'Top-level equity group.',
        ]);

        $revenue = $this->upsertAccount([
            'code' => '4000',
            'name' => 'Revenue',
            'type' => 'revenue',
            'is_postable' => false,
            'is_system' => true,
            'status' => 'active',
            'description' => 'Top-level revenue group.',
        ]);

        $cogs = $this->upsertAccount([
            'code' => '5000',
            'name' => 'Cost of Goods Sold',
            'type' => 'cogs',
            'is_postable' => false,
            'is_system' => true,
            'status' => 'active',
            'description' => 'Top-level COGS group.',
        ]);

        $expenses = $this->upsertAccount([
            'code' => '6000',
            'name' => 'Operating Expenses',
            'type' => 'expense',
            'is_postable' => false,
            'is_system' => true,
            'status' => 'active',
            'description' => 'Top-level operating expenses group.',
        ]);

        $this->seedAssets($assets->id);
        $this->seedLiabilities($liabilities->id);
        $this->seedEquity($equity->id);
        $this->seedRevenue($revenue->id);
        $this->seedCogs($cogs->id);
        $this->seedExpenses($expenses->id);
    }

    protected function seedAssets(int $parentId): void
    {
        $this->upsertAccount([
            'code' => '1100',
            'name' => 'Cash on Hand',
            'type' => 'asset',
            'parent_id' => $parentId,
            'currency_code' => 'AFN',
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '1200',
            'name' => 'Bank Account',
            'type' => 'asset',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '1300',
            'name' => 'Inventory',
            'type' => 'asset',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '1400',
            'name' => 'Accounts Receivable',
            'type' => 'asset',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '1500',
            'name' => 'Branch Petty Cash',
            'type' => 'asset',
            'parent_id' => $parentId,
            'currency_code' => 'AFN',
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);
    }

    protected function seedLiabilities(int $parentId): void
    {
        $this->upsertAccount([
            'code' => '2100',
            'name' => 'Supplier Payable',
            'type' => 'liability',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '2200',
            'name' => 'Salaries Payable',
            'type' => 'liability',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '2300',
            'name' => 'Taxes Payable',
            'type' => 'liability',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '2400',
            'name' => 'Customer Advances',
            'type' => 'liability',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);
    }

    protected function seedEquity(int $parentId): void
    {
        $this->upsertAccount([
            'code' => '3100',
            'name' => 'Owner Capital',
            'type' => 'equity',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '3200',
            'name' => 'Retained Earnings',
            'type' => 'equity',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '3300',
            'name' => 'Owner Drawings',
            'type' => 'equity',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);
    }

    protected function seedRevenue(int $parentId): void
    {
        $this->upsertAccount([
            'code' => '4100',
            'name' => 'Food Sales',
            'type' => 'revenue',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '4200',
            'name' => 'Delivery Sales',
            'type' => 'revenue',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '4300',
            'name' => 'Catering Sales',
            'type' => 'revenue',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '4400',
            'name' => 'Other Income',
            'type' => 'revenue',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);
    }

    protected function seedCogs(int $parentId): void
    {
        $this->upsertAccount([
            'code' => '5100',
            'name' => 'Raw Material Consumption',
            'type' => 'cogs',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '5200',
            'name' => 'Packaging Cost',
            'type' => 'cogs',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '5300',
            'name' => 'Direct Store Supplies',
            'type' => 'cogs',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);
    }

    protected function seedExpenses(int $parentId): void
    {
        $this->upsertAccount([
            'code' => '6100',
            'name' => 'Salaries Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6200',
            'name' => 'Rent Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6300',
            'name' => 'Utilities Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6400',
            'name' => 'Internet Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6500',
            'name' => 'Transport Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6600',
            'name' => 'Cleaning Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6700',
            'name' => 'Maintenance Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6800',
            'name' => 'Marketing Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);

        $this->upsertAccount([
            'code' => '6900',
            'name' => 'Miscellaneous Expense',
            'type' => 'expense',
            'parent_id' => $parentId,
            'is_postable' => true,
            'is_system' => true,
            'status' => 'active',
        ]);
    }

    protected function upsertAccount(array $attributes): FinanceAccount
    {
        return FinanceAccount::query()->updateOrCreate(
            ['code' => $attributes['code']],
            $attributes
        );
    }
}
