<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // This column will store a hash of the email for fast, unique lookups.
            // It should not be nullable as our application logic always provides it.
            $table->string('email_hash')->after('email')->unique()->nullable(false);
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // Ensure we check if the column exists before trying to drop it.
            if (Schema::hasColumn('registrations', 'email_hash')) {
                $table->dropColumn('email_hash');
            }
        });
    }
};
