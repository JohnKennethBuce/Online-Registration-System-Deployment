<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('roles')->upsert([
            [
                'id' => 1,
                'name' => 'superadmin',
                'description' => 'Full System Control',
                'permissions' => json_encode(['*']), // All permissions granted
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 2,
                'name' => 'admin',
                'description' => 'Event operations and Monitoring',
                'permissions' => json_encode(['manage_registrations','view_logs','scan_qr']), // limited permissions for admin
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 3,
                'name' => 'user',
                'description' => 'attendee / Registrant',
                'permissions' => json_encode([]), // No permissions granted by default
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ], ['id'], ['name','description','permissions','updated_at']);   
       
    }
}
