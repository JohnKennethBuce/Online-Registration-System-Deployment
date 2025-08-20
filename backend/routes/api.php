<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\DashboardController;
use SebastianBergmann\CodeCoverage\Report\Html\Dashboard;

Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::middleware(['auth:sanctum', 'throttle:60,1'])->prefix('dashboard')->group(function () {
    Route::get('/summary', [DashboardController::class, 'summary']);
    Route::get('/registrations', [DashboardController::class, 'registrationsBreakdown']);
    Route::get('/print-statuses', [DashboardController::class, 'printStatusBreakdown']);
    Route::get('/scans-per-user', [DashboardController::class, 'scansPerUser']);

});