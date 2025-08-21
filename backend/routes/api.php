<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;

// API Testing route
Route::get('/test', fn() => response()->json(['message' => 'API is working!']));

// User's role determination route
Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return $request->user()->load('role');
});

Route::middleware(['auth:sanctum', 'throttle:60,1'])
    ->prefix('dashboard')
    ->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/registrations', [DashboardController::class, 'registrationsBreakdown']);
        Route::get('/print-statuses', [DashboardController::class, 'printStatusBreakdown']);
        Route::get('/scans-per-user', [DashboardController::class, 'scansPerUser']);
    });

