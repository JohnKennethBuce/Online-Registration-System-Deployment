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
        Schema::create('print_statuses', function (Blueprint $table) {
            $table->id(); // Primary Key

            // Badge or Ticket status
            $table->enum('type', ['badge', 'ticket'])
                  ->comment('Defines whether this status applies to badges or tickets');

            // Status name (unique within type)
            $table->string('name', 50)
                  ->comment('E.g., not_printed, printed, reprinted');

            $table->text('description')->nullable()
                  ->comment('Optional description of the status meaning');

            // Active flag
            $table->tinyInteger('active')->default(1)
                 ->comment('1 = Active, 0 = Disabled');  // Added comment

            // Timestamps
            $table->timestamps();

            // Constraints & Indexes
            $table->unique(['type', 'name']); // Prevent duplicate status names for same type
            $table->index('type'); // Quick lookups by type
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_statuses');
    }
};