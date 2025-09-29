<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User; // 👈 Import User model
use App\Models\Registration; // 👈 Import Registration model
use App\Models\Scan; // 👈 Import Scan model (assuming it exists)
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Faker\Factory as Faker;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // ✅ Fetch role and status IDs once to be efficient
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
        $userRoleId = DB::table('roles')->where('name', 'user')->value('id');
        $superAdmin = User::where('email', env('SUPERADMIN_EMAIL', 'superadmin@dev.com'))->first();
        $badgePrintedStatusId = DB::table('print_statuses')->where('type', 'badge')->where('name', 'printed')->value('id');
        $ticketPrintedStatusId = DB::table('print_statuses')->where('type', 'ticket')->where('name', 'printed')->value('id');

        // ✅ Create Admins using the User model
        for ($i = 0; $i < 3; $i++) {
            User::create([
                'role_id' => $adminRoleId,
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'email_verified_at' => Carbon::now(),
                'password' => 'password', // The User model will hash this automatically
                'phone' => $faker->phoneNumber,
                'status' => 'active',
                'created_by' => $superAdmin->id,
            ]);
        }

        // ✅ Create Users (attendees) and their Registrations
        for ($i = 0; $i < 10; $i++) {
            $user = User::create([
                'role_id' => $userRoleId,
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'password' => 'password',
                'phone' => $faker->phoneNumber,
                'status' => 'active',
                'created_by' => $superAdmin->id,
            ]);

            // ✅ Create Registrations using the Registration model
            // THIS IS THE CRITICAL FIX: Using the model triggers the encryption
            $registration = Registration::create([
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => $faker->unique()->safeEmail,
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'registration_type' => $faker->randomElement(['onsite', 'online', 'pre-registered']),
                'qr_code_path' => '/qrcodes/' . uniqid() . '.png',
                'server_mode' => 'onsite',
                'ticket_number' => uniqid('TICKET-'),
                'registered_by' => $superAdmin->id,
                'badge_printed_status_id' => $badgePrintedStatusId,
                'ticket_printed_status_id' => $ticketPrintedStatusId,
                'confirmed' => false,
            ]);

            // ✅ Simulate scans
            if ($faker->boolean(50)) {
                // Assuming a Scan model exists and registration_id, scanned_by are fillable
                Scan::create([
                    'registration_id' => $registration->id,
                    'scanned_by' => $superAdmin->id,
                    'scanned_time' => Carbon::now(),
                    'badge_printed_status_id' => $badgePrintedStatusId,
                    'ticket_printed_status_id' => $ticketPrintedStatusId,
                ]);
            }
        }

        // It's better to log actions within a controller, but we'll leave this for now.
        DB::table('logs')->insert([
            'user_id' => $superAdmin->id,
            'action' => 'system_seed',
            'ip_address'=>'127.0.0.1',
            'description' => 'Initial test data seeded.',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
