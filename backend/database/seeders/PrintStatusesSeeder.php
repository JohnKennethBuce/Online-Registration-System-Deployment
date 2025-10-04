<?php

namespace Database\Seeders;

use App\Models\PrintStatus;
use Illuminate\Database\Seeder;

class PrintStatusesSeeder extends Seeder
{
        public function run(): void
        {
            $statuses = [
                // Badge statuses
                ['type' => 'badge', 'name' => 'not_printed', 'description' => 'Badge has not been printed yet', 'active' => 1],
                ['type' => 'badge', 'name' => 'queued', 'description' => 'Badge is waiting to be printed', 'active' => 1],
                ['type' => 'badge', 'name' => 'printing', 'description' => 'Badge is currently being printed', 'active' => 1],
                ['type' => 'badge', 'name' => 'printed', 'description' => 'Badge has been printed successfully', 'active' => 1],
                ['type' => 'badge', 'name' => 'reprinted', 'description' => 'Badge has been reprinted', 'active' => 1],
                ['type' => 'badge', 'name' => 'failed', 'description' => 'Badge printing failed', 'active' => 1],
            
                // Ticket statuses
                ['type' => 'ticket', 'name' => 'not_printed', 'description' => 'Ticket has not been printed yet', 'active' => 1],
                ['type' => 'ticket', 'name' => 'queued', 'description' => 'Ticket is waiting to be printed', 'active' => 1],
                ['type' => 'ticket', 'name' => 'printing', 'description' => 'Ticket is currently being printed', 'active' => 1],
                ['type' => 'ticket', 'name' => 'printed', 'description' => 'Ticket has been printed successfully', 'active' => 1],
                ['type' => 'ticket', 'name' => 'reprinted', 'description' => 'Ticket has been reprinted', 'active' => 1],
                ['type' => 'ticket', 'name' => 'failed', 'description' => 'Ticket printing failed', 'active' => 1],
            ];
        
            foreach ($statuses as $status) {
                PrintStatus::firstOrCreate(
                    ['type' => $status['type'], 'name' => $status['name']],
                    $status
                );
        }
    }
}
