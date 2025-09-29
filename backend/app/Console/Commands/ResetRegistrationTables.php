<?php

namespace App\Console\Commands;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Console\Command;

class ResetRegistrationTables extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-registration-tables';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Truncates the registrations and scans tables';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Disabling foreign key checks...');
        Schema::disableForeignKeyConstraints();

        $this->info('Truncating scans table...');
        DB::table('scans')->truncate();

        $this->info('Truncating registrations table...');
        DB::table('registrations')->truncate();

        $this->info('Truncating roles table...'); 
        DB::table('roles')->truncate();

        $this->info('Re-enabling foreign key checks...');
        Schema::enableForeignKeyConstraints();

        $this->info('✅ Done. Tables have been reset.');
        return 0;
    }
}
