<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Carbon\Carbon;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // 🔹 fetch the Super Admin role ID dynamically
        $superAdminRoleId = DB::table('roles')->where('name', 'superadmin')->value('id');

        if (!$superAdminRoleId) {
            $this->command->error("❌ 'superadmin' role not found. Please seed roles first.");
            return;
        }

        // 🔹 Read from .env with fallbacks
        $email = env('SUPERADMIN_EMAIL', 'superadmin@dev.com');
        $password = env('SUPERADMIN_PASSWORD', 'password123');

        // 🔹 Check if SuperAdmin exists
        $exists = User::where('email', $email)->first();

        if (!$exists) {
            $user = User::create([
                'role_id' => $superAdminRoleId,
                'name' => env('SUPERADMIN_NAME', 'System SuperAdmin'),
                'email' => $email,
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make($password),
                'phone' => env('SUPERADMIN_PHONE', '09946855004'),
                'status' => 'active',
                'created_by' => null,
            ]);

            $token = $user->createToken('superadmin-token')->plainTextToken;

            $this->command->info("✅ SuperAdmin created: {$user->email}");
            $this->command->info("🔑 Token: {$token}");
        } else {
            $token = $exists->createToken('superadmin-token')->plainTextToken;

            $this->command->warn("ℹ️ SuperAdmin already exists: {$exists->email}");
            $this->command->info("🔑 New Token: {$token}");
        }
    }
}
