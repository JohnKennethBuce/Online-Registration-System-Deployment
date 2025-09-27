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
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();

            // Basic information about the registrant
            $table->text('first_name');       // First name of the registrant
            $table->text('last_name');        // Last name of the registrant
            $table->text('email')->unique();  // Unique email of the registrant
            $table->text('phone')->nullable();// Phone number of the registrant
            $table->text('address')->nullable();// Address of the registrant

            // Registration type auto-assigned based on server mode
            $table->enum('registration_type', ['onsite', 'online', 'pre-registered'])->index();

            // QR / Ticket identifiers
            $table->string('ticket_number', 100)->unique()->nullable(); // Unique ticket number
            $table->string('qr_code_path', 255)->nullable();            // Path to the QR code image

            // Server mode at time of registration (historical snapshot)
            $table->enum('server_mode', ['onsite','online','both'])->default('onsite')->index();
            
            // Badge / Ticket printing status (configurable via print_statuses)
            $table->foreignId('badge_printed_status_id')->nullable()
                  ->constrained('print_statuses')->nullOnDelete();
            $table->foreignId('ticket_printed_status_id')->nullable()
                  ->constrained('print_statuses')->nullOnDelete();

            // Confirmation tracking
            $table->tinyInteger('confirmed')->default(0); // 0 = pending, 1 = confirmed
            $table->foreignId('confirmed_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();

            // Who registered this user
            $table->foreignId('registered_by')->nullable()
                  ->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
