<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
       $this->call([
            RoleSeeder::class,          // must come first (SuperAdmin role)
            PrintStatusesSeeder::class,  // print status options
            SuperAdminSeeder::class,     // creates SuperAdmin user from .env
            ServerModesSeeder::class,    // links server mode to SuperAdmin 
            TestDataSeeder::class,       // dev/demo data
        ]);

        // Only run test/demo data in local or developement environments
        if (app()->environment(['local', 'development'])) {
            $this->call(TestDataSeeder::class);
        }
    }
}
