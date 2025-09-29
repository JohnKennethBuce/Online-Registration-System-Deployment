<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed CORE data that should exist in ALL environments (production, staging, etc.).
        // These seeders should be idempotent (using updateOrCreate) to run safely anytime.
        $this->call([
            RoleSeeder::class,
            PrintStatusesSeeder::class,
            SuperAdminSeeder::class,
            ServerModesSeeder::class,
        ]);

        // 2. Conditionally run seeders that are ONLY for non-production environments.
        if (app()->isLocal() || app()->environment('development')) {
            $this->call([
                // First, wipe the dev tables for a clean slate.
                TruncateTablesSeeder::class,

                // Then, add the test/demo data.
                TestDataSeeder::class,
            ]);
        }
    }
}