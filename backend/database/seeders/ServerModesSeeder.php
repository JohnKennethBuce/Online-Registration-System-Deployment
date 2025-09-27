<?php

namespace Database\Seeders;

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
            $this->command->warn("⚠️ SuperAdmin not found. Using null for activated_by.");
            return;
        }

        // Avoid duplicate entries
        if (DB::table('server_modes')->exists()) {
            $this->command->info("Server modes already seeded. Skipping.");
            return;
        }

        $modes = [
            [   'mode' => 'onsite',
                'activated_by' => $superAdmin ? $superAdmin->id : null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'mode' => 'online',
                'activated_by' => $superAdmin ? $superAdmin->id : null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'mode' => 'both',
                'activated_by' => $superAdmin ? $superAdmin->id : null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ];

        DB::table('server_modes')->insert($modes);
    }
}
