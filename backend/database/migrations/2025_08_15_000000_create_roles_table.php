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
        Schema::create('roles', function (Blueprint $table) {
            $table->id(); // Primary key

            // Role Details
            $table->string('name', 50)->unique()->comment('Role name: Super Admin, Admin, User'); // Added unique constraint
            $table->json('permissions')->nullable()->comment('Storing Permission in JSON Format');
            $table->text('description')->nullable()->comment('Description of the role');
            $table->timestamps(); // Create_at, Updated_at timestamps
            
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};