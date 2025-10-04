<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class TruncateTablesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        DB::table('scans')->truncate();
        DB::table('registrations')->truncate();
        DB::table('users')->truncate(); // Added to clear users
        DB::table('logs')->truncate(); // Added to clear logs
        DB::table('error_logs')->truncate(); // Added to clear error logs
        DB::table('server_modes')->truncate(); // Added to clear server modes

        Schema::enableForeignKeyConstraints();
    }
}