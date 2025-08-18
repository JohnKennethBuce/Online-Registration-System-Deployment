<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PrintStatusesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('print_statuses')->insert([
            // Badge Statuses
            ['Type' => 'badge', 'name' => 'not_printed', 'description' => 'Badge has not been printed yet', 'created_at' => $now, 'updated_at' => $now],
            ['Type' => 'badge', 'name' => 'printed', 'description' => 'Badge has been printed successfully', 'created_at' => $now, 'updated_at' => $now],
            ['Type' => 'badge', 'name' => 'reprinted', 'description' => 'Badge has been reprinted', 'created_at' => $now, 'updated_at' => $now],
            

            // Ticket Statuses
            ['Type' => 'ticket', 'name' => 'not_printed', 'description' => 'Ticket has not been printed yet', 'created_at' => $now, 'updated_at' => $now],
            ['Type' => 'ticket', 'name' => 'printed', 'description' => 'Ticket has been printed successfully', 'created_at' => $now, 'updated_at' => $now],
            ['Type' => 'ticket', 'name' => 'reprinted', 'description' => 'Ticket has been reprinted', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
