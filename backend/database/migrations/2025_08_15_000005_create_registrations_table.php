<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();

            // ✅ Encrypted PII (Personal Identifiable Information)
            $table->text('first_name');                    // Encrypted
            $table->text('last_name');                     // Encrypted
            $table->text('email')->nullable();             // Encrypted
            $table->string('email_hash', 64)->unique()->nullable();
            $table->text('phone')->nullable();             // Encrypted
            $table->text('address')->nullable();           // Encrypted
            $table->text('company_name');                  // Encrypted

            // ✅ Demographics - NOT encrypted (for analytics)
            $table->enum('age_range', [
                '18-24',
                '25-34',
                '35-44',
                '45-54',
                '55-64',
                '65+'
            ])->nullable()->index();  // Added index for faster queries

            $table->enum('gender', [
                'Male',
                'Female',
                'Prefer not to say',
                'Others'
            ])->nullable()->index();  // Added index for faster queries

            $table->string('gender_other', 100)->nullable();  // Plain text for analytics

            // ✅ Professional Info - NOT encrypted
            $table->string('designation', 255)->nullable();  // Plain text

            // ✅ Survey Data - NOT encrypted (for analytics and groupBy)
            $table->string('industry_sector', 255)->nullable()->index();  // Plain text, indexed
            $table->string('industry_sector_other', 255)->nullable();     // Plain text

            $table->text('reason_for_attending')->nullable();             // Plain text (can be long)
            $table->text('reason_for_attending_other')->nullable();       // Plain text

            $table->string('specific_areas_of_interest', 255)->nullable()->index();  // Plain text, indexed
            $table->text('specific_areas_of_interest_other')->nullable();            // Plain text

            $table->string('how_did_you_learn_about', 255)->nullable()->index();  // Plain text, indexed
            $table->text('how_did_you_learn_about_other')->nullable();            // Plain text

            // ✅ System Fields
            $table->enum('registration_type', ['onsite','online','pre-registered', 'complimentary'])->index();
            $table->string('ticket_number', 100)->unique()->nullable();
            $table->string('qr_code_path', 255)->nullable();
            $table->enum('server_mode', ['onsite','online','both'])->default('onsite')->index();

            // ✅ Print Statuses
            $table->foreignId('badge_printed_status_id')->nullable()
                  ->constrained('print_statuses')->nullOnDelete();
            $table->foreignId('ticket_printed_status_id')->nullable()
                  ->constrained('print_statuses')->nullOnDelete();

            // ✅ Confirmation
            $table->boolean('confirmed')->default(false)->index();
            $table->foreignId('confirmed_by')->nullable()
                  ->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();

            // ✅ Registration Tracking
            $table->foreignId('registered_by')->nullable()
                  ->constrained('users')->nullOnDelete();

            // ✅ Payment Status
            $table->enum('payment_status', ['paid', 'unpaid', 'complimentary'])->default('unpaid')->index();

            $table->timestamps();

            // ✅ Composite indexes for common queries
            $table->index(['registration_type', 'payment_status']);
            $table->index(['created_at', 'registration_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};