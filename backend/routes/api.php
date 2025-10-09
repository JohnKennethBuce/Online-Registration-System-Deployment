<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\ServerModeController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\RoleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- PUBLIC ROUTES ---
Route::get('/test', fn () => response()->json(['message' => 'API is working!']));
Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
Route::get('/registrations/{ticketNumber}/badge', [BadgeController::class, 'show'])->name('registrations.badge');
Route::post('/registrations', [RegistrationController::class, 'store'])
     ->name('registrations.store')
     ->middleware('throttle:10,1');


// --- PROTECTED ROUTES ---
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', fn (Request $request) => $request->user()->load('role'));

    // --- User Management ---
    Route::apiResource('/users', UserController::class)
         ->middleware('can:manage-users');

    // --- Role & Permission Management ---
    Route::prefix('roles')->middleware('can:manage-users')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::put('/{role}', [RoleController::class, 'update']);
    });
    Route::get('/permissions', [RoleController::class, 'getAllPermissions'])
         ->middleware('can:manage-users');

    // --- Settings ---
    Route::get('/settings', [SettingController::class, 'index'])->middleware('can:manage-settings');
    Route::post('/settings', [SettingController::class, 'update'])->middleware('can:manage-settings');
        
    // --- Server Mode Management ---
    Route::prefix('server-mode')->name('server-mode.')->group(function () {
        Route::get('/', [ServerModeController::class, 'getCurrentMode'])->middleware('can:view-dashboard');
        Route::post('/', [ServerModeController::class, 'setMode'])->middleware('can:manage-server-mode');
        Route::get('/history', [ServerModeController::class, 'getHistory'])->middleware('can:manage-server-mode');
    });

    // --- Dashboard Routes ---
    Route::prefix('dashboard')->middleware('can:view-dashboard')->name('dashboard.')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/registrations', [DashboardController::class, 'registrationsBreakdown']);
        Route::get('/print-statuses', [DashboardController::class, 'printStatusBreakdown']);
        Route::get('/scans-per-user', [DashboardController::class, 'scansPerUser']);
        Route::get('/logs', [DashboardController::class, 'logs']);
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::post('/upload-logo', [DashboardController::class, 'uploadLogo']);
        Route::get('/logos', [DashboardController::class, 'getLogos']);
    });

    // --- Admin Registration Routes ---
    Route::prefix('registrations')->name('registrations.')->middleware('can:view-dashboard')->group(function () {
        Route::get('/', [RegistrationController::class, 'index']);
        Route::get('/{registration:ticket_number}', [RegistrationController::class, 'show']);
        Route::post('/{ticket_number}/scan', [RegistrationController::class, 'scan']);
        Route::post('/{ticket_number}/print-badge', [RegistrationController::class, 'printBadge']);
        Route::post('/{ticket_number}/print-ticket', [RegistrationController::class, 'printTicket']);
        Route::post('/{ticket_number}/scan-and-print-badge', [RegistrationController::class, 'scanAndPrintBadge']);
        Route::post('/{ticket_number}/scan-and-print-ticket', [RegistrationController::class, 'scanAndPrintTicket']);

        // Actions requiring higher privileges
        Route::put('/{registration}', [RegistrationController::class, 'update'])->middleware('can:edit-registration');
        Route::delete('/{registration}', [RegistrationController::class, 'destroy'])->middleware('can:delete-registration');
    });
});