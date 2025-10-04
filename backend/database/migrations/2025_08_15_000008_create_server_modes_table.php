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
        Schema::create('server_modes', function (Blueprint $table) {
            $table->id();

            // Mode set by Super Admin
            $table->enum('mode', ['onsite', 'online', 'both'])->index();  // Added index

            // who activated this mode
            $table->foreignId('activated_by')
                  ->nullable()
                  ->constrained('users')
                  ->cascadeOnUpdate()
                  ->nullOnDelete();
            $table->timestamps();

            // Indexes for Reporting
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_modes');
    }
};