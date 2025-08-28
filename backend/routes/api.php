<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;

// ----------------------
// API Testing route
// ----------------------
Route::get('/test', fn() => response()->json(['message' => 'API is working!']));

// ----------------------
// Auth routes
// ----------------------
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

// ----------------------
// User's role info
// ----------------------
Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return $request->user()->load('role');
});

// ----------------------
// Protected routes
// ----------------------
Route::middleware(['auth:sanctum'])->group(function () {

    // ✅ Superadmin-only test
    Route::get('/only-superadmin', function (Request $request) {
        return response()->json([
            'ok'   => true,
            'role' => $request->user()->role->name
        ]);
    })->middleware('can:superadmin-only');

    // ✅ Dashboard routes (Admin or Superadmin)
    Route::prefix('dashboard')->middleware('can:admin-or-superadmin')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/registrations', [DashboardController::class, 'registrationsBreakdown']);
        Route::get('/print-statuses', [DashboardController::class, 'printStatusBreakdown']);
        Route::get('/scans-per-user', [DashboardController::class, 'scansPerUser']);
    });
});
