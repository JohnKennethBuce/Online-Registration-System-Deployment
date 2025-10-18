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
        Schema::create('scans', function (Blueprint $table) {
            $table->id();
           
            // Registration being Scanned
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();

            // Who scanned (nullable, e.g. Auto scan)
            $table->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();

            // When it was scanned
            $table->timestamp('scanned_time')->useCurrent();

            // Badge / Ticket printing status (configurable via print_statuses)
            $table->foreignId('badge_printed_status_id')->nullable()->constrained('print_statuses')->nullOnDelete();
            $table->foreignId('ticket_printed_status_id')->nullable()->constrained('print_statuses')->nullOnDelete();

            $table->timestamps();

            // Indexes for performance
            $table->index('scanned_time');
            $table->index(['registration_id', 'badge_printed_status_id']);
            $table->index(['registration_id', 'ticket_printed_status_id']);
            $table->enum('payment_status', ['paid', 'unpaid'])->default('unpaid');
            $table->index('scanned_by');  // Added
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scans');
    }
};