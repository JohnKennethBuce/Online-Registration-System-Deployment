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
        // Disable foreign key checks
        Schema::disableForeignKeyConstraints();

        // Now you can safely truncate the tables
        DB::table('scans')->truncate();
        DB::table('registrations')->truncate();
        // Add any other tables you need to truncate here

        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }
}