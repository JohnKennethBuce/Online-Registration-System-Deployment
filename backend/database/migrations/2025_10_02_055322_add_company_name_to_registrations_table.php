<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            // Add company_name field, make it nullable and of type TEXT for encryption
            $table->text('company_name')->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            if (Schema::hasColumn('registrations', 'company_name')) {
                $table->dropColumn('company_name');
            }
        });
    }
};