<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();

            // Encrypted personal info
            $table->text('first_name');
            $table->text('last_name');
            $table->text('email');
            $table->text('phone')->nullable();
            $table->text('address')->nullable();

            $table->enum('registration_type', ['onsite','online','pre-registered'])->index();

            // Ticket / QR
            $table->string('ticket_number', 100)->unique()->nullable();
            $table->string('qr_code_path', 255)->nullable();

            $table->enum('server_mode', ['onsite','online','both'])->default('onsite')->index();

            // Print statuses
            $table->foreignId('badge_printed_status_id')->nullable()
                  ->constrained('print_statuses')->nullOnDelete();
            $table->foreignId('ticket_printed_status_id')->nullable()
                  ->constrained('print_statuses')->nullOnDelete();

            // Confirmation
            $table->boolean('confirmed')->default(false);
            $table->foreignId('confirmed_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();

            // Who registered
            $table->foreignId('registered_by')->nullable()
                  ->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
