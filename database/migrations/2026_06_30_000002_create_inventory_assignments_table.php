<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 12, 2)->default(1);
            $table->date('assigned_at')->index();
            $table->date('expected_return_at')->nullable();
            $table->date('returned_at')->nullable()->index();
            $table->string('condition_out', 120)->nullable();
            $table->string('condition_in', 120)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('returned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['inventory_item_id', 'returned_at']);
            $table->index(['employee_id', 'returned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_assignments');
    }
};
