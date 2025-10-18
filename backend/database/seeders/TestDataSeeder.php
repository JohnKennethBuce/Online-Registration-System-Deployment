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
        
        // ✅ Get all print statuses
        $badgeNotPrintedId = PrintStatus::where('type', 'badge')->where('name', 'not_printed')->value('id');
        $badgePrintedId = PrintStatus::where('type', 'badge')->where('name', 'printed')->value('id');
        $ticketNotPrintedId = PrintStatus::where('type', 'ticket')->where('name', 'not_printed')->value('id');
        $ticketPrintedId = PrintStatus::where('type', 'ticket')->where('name', 'printed')->value('id');

        if (!$superAdmin) {
            $this->command->error('SuperAdmin not found, cannot seed test data.');
            return;
        }

        // ✅ FIX: Create 3 Admins and collect their IDs
        $adminIds = [];
        for ($i = 0; $i < 3; $i++) {
            $admin = User::create([
                'role_id' => $adminRoleId,
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('password'),
                'phone' => $faker->phoneNumber,
                'status' => 'active',
                'created_by' => $superAdmin->id,
            ]);
            $adminIds[] = $admin->id; // ✅ Store ID in array
        }

        // ✅ Create 10 registrations with varied registered_by
        for ($i = 0; $i < 10; $i++) {
            $email = $faker->unique()->safeEmail;
            
            // ✅ Randomly assign to superadmin or one of the admins
            $registeredBy = $faker->boolean(10) 
                ? $superAdmin->id 
                : $faker->randomElement($adminIds);

            $registration = Registration::create([
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => $email,
                'email_hash' => hash('sha256', strtolower(trim($email))),
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'company_name' => $faker->boolean(60) ? $faker->company : null,
                'registration_type' => $faker->randomElement(['onsite', 'online', 'pre-registered']),
                'server_mode' => 'onsite',
                'ticket_number' => 'TICKET-' . strtoupper(Str::random(12)),
                'registered_by' => $registeredBy, // ✅ Important!
                'badge_printed_status_id' => $faker->randomElement([$badgeNotPrintedId, $badgePrintedId]),
                'ticket_printed_status_id' => $faker->randomElement([$ticketNotPrintedId, $ticketPrintedId]),
                'confirmed' => $faker->boolean(70),
                'confirmed_by' => $faker->boolean(70) ? $registeredBy : null,
                'confirmed_at' => $faker->boolean(70) ? Carbon::now()->subDays($faker->numberBetween(0, 30)) : null,
                'payment_status' => $faker->randomElement(['paid', 'unpaid']),
            ]);

            // ✅ Create scans for 60% of registrations
            if ($faker->boolean(60)) {
                // ✅ FIX: Use array_merge instead of spread operator
                $allUserIds = array_merge([$superAdmin->id], $adminIds);
                
                Scan::create([
                    'registration_id' => $registration->id,
                    'scanned_by' => $faker->randomElement($allUserIds),
                    'scanned_time' => Carbon::now()->subHours($faker->numberBetween(1, 72)),
                    'badge_printed_status_id' => $badgePrintedId,
                    'ticket_printed_status_id' => $ticketPrintedId,
                ]);
            }
        }

        $this->command->info('✅ Created 3 admins, 50 registrations, and scans');
    }
}