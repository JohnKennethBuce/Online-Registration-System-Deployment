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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            // Link to roles table
            $table->foreignId('role_id')->constrained('roles')->cascadeOnUpdate()->restrictOnDelete();
            
            // User basic information
            $table->string('name'); // Full name of the user
            $table->string('email')->unique()->index(); // Added index for search performance
            $table->timestamp('email_verified_at')->nullable(); // Timestamp when the email was verified
            $table->string('password', 255)->nullable(); // Keep nullable if some users (attendees) don’t need login 
            $table->string('phone', 1000)->nullable(); // Increased length for encryption

            // User account status
            $table->enum('status', ['active', 'inactive'])->default('active')->index(); 

            // Remember token for password reset
            $table->rememberToken();

            // Track who created this user (self-referencing FK)
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email', 150)->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};