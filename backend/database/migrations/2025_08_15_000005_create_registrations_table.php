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
            $table->text('email')->nullable();
            $table->string('email_hash', 64)->unique()->nullable();
            $table->text('phone')->nullable();
            $table->text('address')->nullable();
            $table->text('company_name');
            $table->enum('age_range', [
                    '18-24',
                    '25-34',
                    '35-44',
                    '45-54',
                    '55-64',
                    '65+'
                ])->nullable();

            $table->enum('gender', [
                    'Male',
                    'Female',
                    'Prefer not to say',
                    'Others'
                ])->nullable();
            $table->text('gender_other')->nullable(); // Encrypted, 

            $table->text('designation')->nullable(); // Encrypted,

            $table->text('industry_sector')->nullable(); // Encrypted
            $table->text('industry_sector_other')->nullable(); // Encrypted, for "Others" option

            $table->text('reason_for_attending')->nullable(); // Encrypted
            $table->text('reason_for_attending_other')->nullable(); // Encrypted, for "Others" option

            $table->text('specific_areas_of_interest')->nullable(); // Encrypted
            $table->text('specific_areas_of_interest_other')->nullable(); // Encrypted, for "Others" option

            $table->text('how_did_you_learn_about')->nullable(); // Encrypted
            $table->text('how_did_you_learn_about_other')->nullable();

            $table->enum('registration_type', ['onsite','online','pre-registered', 'complimentary'])->index();

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

            // Paid or Unpaid 
            $table->enum('payment_status', ['paid', 'unpaid', "complimentary"])->default('unpaid')->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
