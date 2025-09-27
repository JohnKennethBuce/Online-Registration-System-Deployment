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
        Schema::table('registrations', function (Blueprint $table) {
            $table->text('first_name')->change();
            $table->text('last_name')->change();
            $table->text('email')->change();
            $table->text('phone')->nullable()->change();
            $table->text('address')->nullable()->change();
        });
        //
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('first_name', 100)->change();
            $table->string('last_name', 100)->change();
            $table->string('email', 150)->change();
            $table->string('phone', 20)->nullable()->change();
            $table->string('address', 255)->nullable()->change();
        });
        //
    }
};
