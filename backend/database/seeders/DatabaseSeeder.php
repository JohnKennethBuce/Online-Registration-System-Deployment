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
        // 1. Conditionally run truncate first (only for dev/local)
        if (app()->isLocal() || app()->environment('development')) {
            $this->call([
                TruncateTablesSeeder::class,
            ]);
        }

        // 2. Seed CORE data that should exist in ALL environments
        $this->call([
            RolesSeeder::class,
            PrintStatusesSeeder::class,
            SuperAdminSeeder::class,
            ServerModesSeeder::class,
            SettingsSeeder::class,
        ]);

        //  3. Add test/demo data (only for dev/local)
        // if (app()->isLocal() || app()->environment('development')) {
        //     $this->call([
        //         TestDataSeeder::class,
        //     ]);
        // }
    }
}
