<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Registration;
use App\Models\Scan;
use App\Models\Role;
use App\Models\PrintStatus;
use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;


class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $adminRoleId = Role::where('name', 'admin')->value('id');
        $userRoleId = Role::where('name', 'user')->value('id');
        $superAdmin = User::where('email', env('SUPERADMIN_EMAIL', 'superadmin@dev.com'))->first();
        $badgePrintedStatusId = PrintStatus::where('type', 'badge')->where('name', 'printed')->value('id');
        $ticketPrintedStatusId = PrintStatus::where('type', 'ticket')->where('name', 'printed')->value('id');

        if (!$superAdmin) {
            $this->command->error('SuperAdmin not found, cannot seed test data.');
            return;
        }

        // Create Admins with encrypted fields
        for ($i = 0; $i < 3; $i++) {
            User::create([
                'role_id' => $adminRoleId,
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('password'), // Will be hashed
                'phone' => $faker->phoneNumber, // Will be encrypted
                'status' => 'active',
                'created_by' => $superAdmin->id,
            ]);
        }

        // Create Users and their Registrations with encrypted fields
        for ($i = 0; $i < 10; $i++) {
            $email = $faker->unique()->safeEmail;
            $user = User::create([
                'role_id' => $userRoleId,
                'name' => $faker->name,
                'email' => $email,
                'password' => Hash::make('password'), // Will be hashed
                'phone' => $faker->phoneNumber, // Will be encrypted
                'status' => 'active',
                'created_by' => $superAdmin->id,
            ]);

            $registration = Registration::create([
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => $email, // Will be encrypted
                'email_hash' => hash('sha256', strtolower(trim($email))), // Consistent hash
                'phone' => $faker->phoneNumber, // Will be encrypted
                'address' => $faker->address, // Will be encrypted
                'registration_type' => $faker->randomElement(['onsite', 'online', 'pre-registered']),
                'server_mode' => 'onsite',
                'ticket_number' => 'TICKET-' . strtoupper(Str::random(12)),
                'registered_by' => $superAdmin->id,
                'badge_printed_status_id' => $badgePrintedStatusId,
                'ticket_printed_status_id' => $ticketPrintedStatusId,
                'confirmed' => $faker->boolean(50),
                'confirmed_by' => $faker->boolean(50) ? $superAdmin->id : null,
                'confirmed_at' => $faker->boolean(50) ? Carbon::now() : null,
            ]);

            if ($faker->boolean(50)) {
                Scan::create([
                    'registration_id' => $registration->id,
                    'scanned_by' => $faker->boolean(50) ? $superAdmin->id : User::where('role_id', $adminRoleId)->inRandomOrder()->first()->id,
                    'scanned_time' => Carbon::now()->subHours($faker->numberBetween(1, 24)),
                    'badge_printed_status_id' => $badgePrintedStatusId,
                    'ticket_printed_status_id' => $ticketPrintedStatusId,
                ]);
            }
        }
    }
}