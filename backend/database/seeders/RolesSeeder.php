<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        Role::updateOrCreate(
            ['name' => 'superadmin'],
            [
                'description' => 'Full System Control',
                'permissions' => json_encode(['*']), // Explicitly JSON-encoded
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        Role::updateOrCreate(
            ['name' => 'admin'],
            [
                'description' => 'Event operations and Monitoring',
                'permissions' => json_encode(['admin']), // Explicitly JSON-encoded
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );

        Role::updateOrCreate(
            ['name' => 'user'],
            [
                'description' => 'attendee / Registrant',
                'permissions' => json_encode(['user']), // Explicitly JSON-encoded
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        );
    }
}