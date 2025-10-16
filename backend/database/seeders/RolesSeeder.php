<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use App\Enums\Permission; // <-- Import our new Permission Enum

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        // The 'superadmin' role gets all permissions.
        Role::updateOrCreate(
            ['name' => 'superadmin'],
            [
                'description' => 'Full System Control',
                'permissions' => Permission::all(), // <-- Assigns all permissions from the Enum
            ]
        );

        // The 'admin' role gets a specific, limited set of permissions.
        Role::updateOrCreate(
            ['name' => 'admin'],
            [
                'description' => 'Event operations and Monitoring',
                'permissions' => [
                    Permission::VIEW_DASHBOARD->value,
                    Permission::VIEW_REGISTRATIONS->value,
                    Permission::CREATE_REGISTRATION->value,
                    Permission::EDIT_REGISTRATION->value,
                    Permission::SCAN_REGISTRATION->value,
                    // Note: We are intentionally NOT giving them delete permissions by default.
                ],
            ]
        );

        // The 'user' role for attendees has no specific system permissions.
        Role::updateOrCreate(
            ['name' => 'user'],
            [
                'description' => 'Attendee / Registrant',
                'permissions' => [], // <-- Correctly an empty array
            ]
        );
    }
}