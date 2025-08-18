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
        Schema::create('error_logs', function (Blueprint $table) {
            $table->id();

            // user who experienced the error (nullable)
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Error details
            $table->string('error_code', 50)->nullable(); // Optional Error Code 
            $table->text('error_message'); // Detailed error message
            $table->longText('stack_trace')->nullable(); // Stack trace for debugging (optional)

            $table->timestamps();

            $table->index('created_at'); // Index for performance
        }); 
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('error_logs');
    }
};
