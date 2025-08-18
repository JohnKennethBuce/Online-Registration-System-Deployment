<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

        // ✅ Fetch role IDs
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
        $userRoleId = DB::table('roles')->where('name', 'user')->value('id');
        $superAdminId= DB::table('users')->where('email', env('SUPERADMIN_EMAIL', 'superadmin@dev.com'))->value('id');

        // ✅ Create Admins 
        // ($i = 0; $i < 3; $i++) means "create 3 admin users"
        for ($i = 0; $i < 3; $i++){
            DB::table('users')->insert([
                'role_id' => $adminRoleId,
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'email_verified_at' => Carbon::now(),
                'password' => Hash::make('password'), // default password for testing
                'phone' => $faker->phoneNumber,
                'status' => 'active',
                'created_by' => $superAdminId, // created by SuperAdmin
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]); 
        }
        // ✅ Create Users (attendees)
        // ($i = 0; $i < 10; $i++) means "create 10 user attendees"
        for ($i = 0; $i < 10; $i++){
            $userId = DB::table('users')->insertGetId([
                'role_id' => $userRoleId,
                'name' => $faker->name,
                'email' => $faker->unique()->safeEmail,
                'email_verified_at' => null, // not verified for testing
                'password' => Hash::make('password'), // default password for testing
                'phone' => $faker->phoneNumber,
                'status' => 'active',
                'created_by' => $superAdminId, // created by SuperAdmin
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // ✅ Registrations for each user
            $registrationId = DB::table('registrations')->insertGetId([
                'registered_by' => $superAdminId, // created by SuperAdmin
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'email' => $faker->unique()->safeEmail,
                'phone' => $faker->phoneNumber,
                'address' => $faker->address,
                'registration_type' => $faker->randomElement(['onsite', 'online', 'pre-registered']),
                'qr_code_path' => '/qrcodes'. uniqid().'.png', // Example QR code path
                'server_mode' => 'onsite', // Default server mode
                'badge_printed_status_id' => DB::table('print_statuses')->where('type', 'badge')->where('name', 'printed')->value('id'),
                'ticket_printed_status_id' => DB::table('print_statuses')->where('type', 'ticket')->where('name', 'printed')->value('id'),
                'confirmed' => 0, // Not confirmed by default
                'confirmed_by' => null, // Not confirmed yet
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // ✅ Simulate scans
            if ($faker->boolean(50)) {
                DB::table('scans')->insert([
                    'registration_id' => $registrationId,
                    'scanned_by' => $superAdminId, // scanned by SuperAdmin
                    'scanned_time' => Carbon::now(),
                    'badge_printed_status_id' => DB::table('print_statuses')->where('type', 'badge')->where('name', 'printed')->value('id'),
                    'ticket_printed_status_id' => DB::table('print_statuses')->where('type', 'ticket')->where('name', 'printed')->value('id'),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
            }
        }

        // ✅ Logs
        DB::table('logs')->insert([
            'user_id' => $superAdminId, // SuperAdmin created the logs
            'action' => 'system_seed',
            'target_id' => null, // No specific target for this action
            'ip_address'=>'127.0.0.1',
            'description' => 'Initial test data seeded. ',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
    }
}
