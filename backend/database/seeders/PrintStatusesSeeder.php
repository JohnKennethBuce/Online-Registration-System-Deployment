<?php

namespace Database\Seeders;

use App\Models\PrintStatus;
use Illuminate\Database\Seeder;

class PrintStatusesSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['type' => 'badge', 'name' => 'not_printed', 'description' => 'Badge has not been printed yet', 'active' => 1],
            ['type' => 'badge', 'name' => 'printed', 'description' => 'Badge has been printed successfully', 'active' => 1],
            ['type' => 'badge', 'name' => 'reprinted', 'description' => 'Badge has been reprinted', 'active' => 1],
            ['type' => 'ticket', 'name' => 'not_printed', 'description' => 'Ticket has not been printed yet', 'active' => 1],
            ['type' => 'ticket', 'name' => 'printed', 'description' => 'Ticket has been printed successfully', 'active' => 1],
            ['type' => 'ticket', 'name' => 'reprinted', 'description' => 'Ticket has been reprinted', 'active' => 1],
        ];

        foreach ($statuses as $status) {
            PrintStatus::firstOrCreate(
                ['type' => $status['type'], 'name' => $status['name']],
                $status
            );
        }
    }
}