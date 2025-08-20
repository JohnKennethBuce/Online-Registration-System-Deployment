<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // Total Registrations by type
    public function registrationsByType()
    {
        return Registration::Select('registration_type', DB::raw('count(*) as total'))
            ->groupBy('registration_type')
            ->get();
    }
    

}
