<?php

namespace Database\Seeders;

use App\Models\ServerMode;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServerModesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find the Super Admin user to attribute the action to.
        $superAdmin = User::where('email', env('SUPERADMIN_EMAIL', 'superadmin@dev.com'))->first();

        if (!$superAdmin) {
            $this->command->warn("⚠️ SuperAdmin not found. Cannot seed the initial server mode.");
            return;
        }

        // --- CORRECTED LOGIC ---
        // We only want to seed ONE initial server mode. The 'firstOrCreate' method is
        // perfect for this. It checks if any server mode exists. If not, it creates
        // our specified default mode. If the table already has entries, it does nothing.
        // This makes the seeder safe to run multiple times.

        ServerMode::firstOrCreate(
            [], // No conditions, we just want to check if the table is empty.
            [
                'mode' => 'onsite', // Set 'onsite' as the default starting mode.
                'activated_by' => $superAdmin->id,
            ]
        );

        $this->command->info("✅ Initial server mode ensured.");
    }
}