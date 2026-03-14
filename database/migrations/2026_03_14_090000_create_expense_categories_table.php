<?php

use App\Enums\ExpenseCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('expense_account_id')->nullable()->constrained('finance_accounts')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        $defaults = collect(ExpenseCategory::cases())
            ->values()
            ->map(fn (ExpenseCategory $category, int $index) => [
                'name' => $category->label(),
                'slug' => $category->value,
                'description' => null,
                'expense_account_id' => null,
                'is_active' => true,
                'sort_order' => $index + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::table('expense_categories')->insert($defaults);

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('expense_category_id')
                ->nullable()
                ->after('expense_type')
                ->constrained('expense_categories')
                ->nullOnDelete();
        });

        $categories = DB::table('expense_categories')
            ->pluck('id', 'slug');

        DB::table('expenses')
            ->select(['id', 'expense_type'])
            ->orderBy('id')
            ->chunk(200, function ($expenses) use ($categories, $now) {
                foreach ($expenses as $expense) {
                    $slug = str((string) $expense->expense_type)
                        ->trim()
                        ->lower()
                        ->replace(['/', ' '], ['_', '_'])
                        ->replace('-', '_')
                        ->value();

                    if (! isset($categories[$slug])) {
                        $name = str((string) $expense->expense_type)->replace('_', ' ')->title()->toString();

                        $categoryId = DB::table('expense_categories')->insertGetId([
                            'name' => $name,
                            'slug' => $slug,
                            'description' => 'Imported from existing expenses.',
                            'expense_account_id' => null,
                            'is_active' => true,
                            'sort_order' => 999,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);

                        $categories[$slug] = $categoryId;
                    }

                    DB::table('expenses')
                        ->where('id', $expense->id)
                        ->update(['expense_category_id' => $categories[$slug]]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('expense_category_id');
        });

        Schema::dropIfExists('expense_categories');
    }
};
