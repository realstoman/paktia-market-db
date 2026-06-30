<?php

namespace App\Http\Controllers;

use App\Models\BusinessFinanceEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class BusinessFinanceController extends Controller
{
    private const BUSINESSES = [
        'dubai-restaurant' => [
            'key' => 'dubai_restaurant',
            'title' => 'Dubai Restaurant',
            'titleKey' => 'businessFinance.businesses.dubaiRestaurant.title',
            'descriptionKey' => 'businessFinance.businesses.dubaiRestaurant.description',
            'locationKey' => 'businessFinance.businesses.dubaiRestaurant.location',
            'defaultCurrency' => 'AED',
            'accent' => 'restaurant',
        ],
        'kabul-sarafi' => [
            'key' => 'kabul_sarafi',
            'title' => 'Kabul Gold & Sarafi',
            'titleKey' => 'businessFinance.businesses.kabulSarafi.title',
            'descriptionKey' => 'businessFinance.businesses.kabulSarafi.description',
            'locationKey' => 'businessFinance.businesses.kabulSarafi.location',
            'defaultCurrency' => 'AFN',
            'accent' => 'sarafi',
        ],
    ];

    public function show(string $business)
    {
        $config = $this->businessConfig($business);

        $entries = BusinessFinanceEntry::query()
            ->where('business_key', $config['key'])
            ->latest('entry_date')
            ->latest('id')
            ->limit(90)
            ->get();

        $latestValuation = BusinessFinanceEntry::query()
            ->where('business_key', $config['key'])
            ->whereNotNull('valuation')
            ->latest('entry_date')
            ->latest('id')
            ->first();

        $summary = BusinessFinanceEntry::query()
            ->where('business_key', $config['key'])
            ->selectRaw('COALESCE(SUM(sales), 0) as total_sales')
            ->selectRaw('COALESCE(SUM(income), 0) as total_income')
            ->selectRaw('COALESCE(SUM(expenses), 0) as total_expenses')
            ->selectRaw('COUNT(*) as entry_count')
            ->first();

        $monthlySummary = BusinessFinanceEntry::query()
            ->where('business_key', $config['key'])
            ->whereBetween('entry_date', [
                now()->startOfMonth()->toDateString(),
                now()->endOfMonth()->toDateString(),
            ])
            ->selectRaw('COALESCE(SUM(sales), 0) as sales')
            ->selectRaw('COALESCE(SUM(income), 0) as income')
            ->selectRaw('COALESCE(SUM(expenses), 0) as expenses')
            ->first();

        return Inertia::render('finance/business-finance/show', [
            'business' => [
                'slug' => $business,
                ...$config,
            ],
            'entries' => $entries->map(fn (BusinessFinanceEntry $entry) => [
                'id' => $entry->id,
                'entry_date' => $entry->entry_date?->toDateString(),
                'currency_code' => $entry->currency_code,
                'valuation' => $entry->valuation,
                'sales' => $entry->sales,
                'income' => $entry->income,
                'expenses' => $entry->expenses,
                'net' => (float) $entry->income - (float) $entry->expenses,
                'notes' => $entry->notes,
            ])->values(),
            'summary' => [
                'latestValuation' => $latestValuation?->valuation,
                'latestValuationDate' => $latestValuation?->entry_date?->toDateString(),
                'latestValuationCurrency' => $latestValuation?->currency_code ?? $config['defaultCurrency'],
                'totalSales' => (float) ($summary?->total_sales ?? 0),
                'totalIncome' => (float) ($summary?->total_income ?? 0),
                'totalExpenses' => (float) ($summary?->total_expenses ?? 0),
                'netIncome' => (float) ($summary?->total_income ?? 0) - (float) ($summary?->total_expenses ?? 0),
                'entryCount' => (int) ($summary?->entry_count ?? 0),
                'monthSales' => (float) ($monthlySummary?->sales ?? 0),
                'monthIncome' => (float) ($monthlySummary?->income ?? 0),
                'monthExpenses' => (float) ($monthlySummary?->expenses ?? 0),
                'monthNet' => (float) ($monthlySummary?->income ?? 0) - (float) ($monthlySummary?->expenses ?? 0),
            ],
        ]);
    }

    public function store(Request $request, string $business)
    {
        $config = $this->businessConfig($business);

        $validated = $request->validate([
            'entry_date' => ['required', 'date_format:Y-m-d'],
            'currency_code' => ['required', 'string', 'max:10'],
            'valuation' => ['nullable', 'numeric', 'min:0'],
            'sales' => ['nullable', 'numeric', 'min:0'],
            'income' => ['nullable', 'numeric', 'min:0'],
            'expenses' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        BusinessFinanceEntry::query()->updateOrCreate(
            [
                'business_key' => $config['key'],
                'entry_date' => $validated['entry_date'],
            ],
            [
                'currency_code' => strtoupper($validated['currency_code']),
                'valuation' => $validated['valuation'] ?? null,
                'sales' => $validated['sales'] ?? 0,
                'income' => $validated['income'] ?? 0,
                'expenses' => $validated['expenses'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ],
        );

        return back()->with('success', __('Business finance entry saved successfully.'));
    }

    public static function financeDashboardTotals(): array
    {
        if (! Schema::hasTable('business_finance_entries')) {
            return [
                'valuation' => 0.0,
                'sales' => 0.0,
                'income' => 0.0,
                'expenses' => 0.0,
                'net' => 0.0,
            ];
        }

        $totals = BusinessFinanceEntry::query()
            ->selectRaw('COALESCE(SUM(sales), 0) as sales')
            ->selectRaw('COALESCE(SUM(income), 0) as income')
            ->selectRaw('COALESCE(SUM(expenses), 0) as expenses')
            ->first();

        $valuation = collect(self::BUSINESSES)
            ->sum(function (array $business): float {
                $entry = BusinessFinanceEntry::query()
                    ->where('business_key', $business['key'])
                    ->whereNotNull('valuation')
                    ->latest('entry_date')
                    ->latest('id')
                    ->first();

                return (float) ($entry?->valuation ?? 0);
            });

        return [
            'valuation' => (float) $valuation,
            'sales' => (float) ($totals?->sales ?? 0),
            'income' => (float) ($totals?->income ?? 0),
            'expenses' => (float) ($totals?->expenses ?? 0),
            'net' => (float) ($totals?->income ?? 0) - (float) ($totals?->expenses ?? 0),
        ];
    }

    public static function financeDashboardCards(?string $startDate = null, ?string $endDate = null): array
    {
        if (! Schema::hasTable('business_finance_entries')) {
            return collect(self::BUSINESSES)->map(fn (array $business, string $slug) => [
                'slug' => $slug,
                'key' => $business['key'],
                'title' => $business['title'],
                'titleKey' => $business['titleKey'],
                'valuation' => 0.0,
                'sales' => 0.0,
                'income' => 0.0,
                'expenses' => 0.0,
                'net' => 0.0,
                'currencyCode' => $business['defaultCurrency'],
            ])->values()->all();
        }

        return collect(self::BUSINESSES)->map(function (array $business, string $slug) use ($startDate, $endDate): array {
            $periodQuery = BusinessFinanceEntry::query()
                ->where('business_key', $business['key'])
                ->when($startDate && $endDate, fn ($query) => $query->whereBetween('entry_date', [$startDate, $endDate]));

            $totals = (clone $periodQuery)
                ->selectRaw('COALESCE(SUM(sales), 0) as sales')
                ->selectRaw('COALESCE(SUM(income), 0) as income')
                ->selectRaw('COALESCE(SUM(expenses), 0) as expenses')
                ->first();

            $latestValuation = BusinessFinanceEntry::query()
                ->where('business_key', $business['key'])
                ->whereNotNull('valuation')
                ->latest('entry_date')
                ->latest('id')
                ->first();

            return [
                'slug' => $slug,
                'key' => $business['key'],
                'title' => $business['title'],
                'titleKey' => $business['titleKey'],
                'valuation' => (float) ($latestValuation?->valuation ?? 0),
                'sales' => (float) ($totals?->sales ?? 0),
                'income' => (float) ($totals?->income ?? 0),
                'expenses' => (float) ($totals?->expenses ?? 0),
                'net' => (float) ($totals?->income ?? 0) - (float) ($totals?->expenses ?? 0),
                'currencyCode' => $latestValuation?->currency_code ?? $business['defaultCurrency'],
            ];
        })->values()->all();
    }

    private function businessConfig(string $business): array
    {
        abort_unless(array_key_exists($business, self::BUSINESSES), 404);

        return self::BUSINESSES[$business];
    }
}
