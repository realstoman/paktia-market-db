<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            Schema::create('countries', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // Afghanistan, UAE
                $table->string('iso_code', 2)->unique(); // AF, AE
                $table->string('currency_code', 3); // AFN, AED, USD
                $table->string('currency_symbol')->nullable(); // ؋, د.إ
                $table->timestamps();
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
