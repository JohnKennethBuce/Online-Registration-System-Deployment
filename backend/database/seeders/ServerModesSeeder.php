<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ServerModesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find the Super Admin user (from .env email)
        $superAdminEmail = env('SUPERADMIN_EMAIL', 'superadmin@dev.com');
        $superAdmin = DB::table('users')->where('email', $superAdminEmail)->first();

        if (!$superAdmin) {
            $this->command->warn("⚠️ SuperAdmin not found. Skipping ServerModesSeeder.");
            return;
        }

        // Avoid duplicate entries
        $exists = DB::table('server_modes')->exists();
        if ($exists) {
            return;
        }

        DB::table('server_modes')->insert([
            'mode' => env('DEFAULT_SERVER_MODE', 'onsite'), // configurable via .env
            'activated_by' => $superAdmin->id,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
