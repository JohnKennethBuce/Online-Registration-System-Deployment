<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings as a key-value object.
     */
    public function index()
    {
        // Return all settings as a simple key-value object
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update settings from the request.
     */
    public function update(Request $request)
    {
        // Note: Logo paths are updated via the DashboardController's uploadLogo method.
        // This controller handles text-based settings.
        $settingsData = $request->validate([
            'event_location' => 'nullable|string|max:255',
            'event_datetime' => 'nullable|string|max:255',
            'event_name' => 'nullable|string|max:255',
        ]);

        foreach ($settingsData as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }
}