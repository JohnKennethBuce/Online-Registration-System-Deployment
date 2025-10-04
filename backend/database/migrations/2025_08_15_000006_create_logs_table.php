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
        Schema::create('logs', function (Blueprint $table) {
            $table->id(); // Primary key
            
            // actor of the action
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // User who performed the action
            
            // action metadata
            $table->string('action', 255); // short action name 
            $table->string('target_type', 50)->nullable(); // Type of the target entity (e.g., 'registration', 'user', etc.)
            $table->unsignedBigInteger('target_id')->nullable(); // Related entity ID

            // IP address 
            $table->string('ip_address', 45)->nullable(); // IP address of the user performing the action
            $table->text('description')->nullable(); // Detailed description of the action
            
            $table->timestamps();

            // Indexes for performance
            $table->index('action');
            $table->index('created_at');
            $table->index('user_id');  // Added
            $table->index(['target_type', 'target_id']);  // Added composite index
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};