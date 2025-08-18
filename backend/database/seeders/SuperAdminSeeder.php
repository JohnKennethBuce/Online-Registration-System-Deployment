<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // fetch the Super Admin role ID dynamically
        $superAdminRoleId = DB::table('roles')->where('name', 'superadmin')->value('id');

        // Read from .env with fallbacks
        $email = env('SUPERADMIN_EMAIL', 'superadmin@dev.com');
        $password = env('SUPERADMIN_PASSWORD', 'password123');

        $exists = DB::table('users')->where('email', $email)->exists();
        if ($exists) {
            return;
        }

        DB::table('users')->insert([
            'role_id' => $superAdminRoleId,
            'name' => env('SUPERADMIN_NAME', 'System SuperAdmin'),
            'email' => $email,
            'email_verified_at' => Carbon::now(),
            'password' => Hash::make($password),
            'phone' => env('SUPERADMIN_PHONE', null),
            'status' => 'active',
            'created_by' => null,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);


    }
}
