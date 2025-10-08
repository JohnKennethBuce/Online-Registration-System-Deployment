<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'event_location', 'value' => 'World Trade Center, Manila'],
            ['key' => 'event_datetime', 'value' => 'October 24-26, 2025 | 10:00 am - 6:00 pm'],
            ['key' => 'event_name', 'value' => 'DAY 1'],
            ['key' => 'main_logo_path', 'value' => 'logos/main_logo.png'],
            ['key' => 'organizer_logo_path', 'value' => 'logos/organizer_logo.png'],
            ['key' => 'manager_logo_path', 'value' => 'logos/manager_logo.png'],
            ['key' => 'registration_logo_path', 'value' => 'logos/registration_logo.png'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}