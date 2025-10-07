<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\ServerModeController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| This file defines all the API routes for the application.
| Routes are grouped logically for clarity and security.
|
*/

// --- Public Routes ---
// Routes accessible without authentication.
// NEW: Group auth routes together
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->name('login');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth:sanctum');
    });
    
    
    // --- Protected Routes ---
    // All routes within this group require a valid Sanctum token and are rate-limited.
    // --- Public Routes ---
    // --- Public Routes ---
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])->name('login');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth:sanctum');
    });
    
    // --- Badge Generation Route (Now Public) ---
    Route::get('/registrations/{ticketNumber}/badge', [BadgeController::class, 'show'])
         ->name('registrations.badge');
    
    
    // --- Protected Routes ---
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
     
     
    // ... rest of the protected routes ...
    // --- User & Authentication ---
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', fn (Request $request) => $request->user()->load('role'));

    // --- User Management Routes (Superadmin Only) ---
    Route::apiResource('/users', UserController::class)
         ->middleware('can:superadmin-only');
         
    // --- Server Mode Management Routes ---
    // Accessible only to authenticated users, with specific admin restrictions.
    Route::prefix('server-mode')->name('server-mode.')->group(function () {
        
        // GET /api/server-mode - Get the current active mode. (For all admins)
        Route::get('/', [ServerModeController::class, 'getCurrentMode'])
             ->name('get.current')
             ->middleware('can:admin-or-superadmin');

        // POST /api/server-mode - Set a new mode. (Superadmin only)
        Route::post('/', [ServerModeController::class, 'setMode'])
             ->name('set')
             ->middleware('can:superadmin-only');

        // GET /api/server-mode/history - Get the audit log of mode changes. (Superadmin only)
        Route::get('/history', [ServerModeController::class, 'getHistory'])
             ->name('get.history')
             ->middleware('can:superadmin-only');
    });
    // --- Dashboard Routes ---
    // Accessible only to 'admin' or 'superadmin' roles.
    Route::prefix('dashboard')->middleware('can:admin-or-superadmin')->name('dashboard.')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary'])->name('summary');
        Route::get('/registrations', [DashboardController::class, 'registrationsBreakdown'])->name('registrations');
        Route::get('/print-statuses', [DashboardController::class, 'printStatusBreakdown'])->name('print-statuses');
        Route::get('/scans-per-user', [DashboardController::class, 'scansPerUser'])->name('scans-per-user');
        Route::get('/logs', [DashboardController::class, 'logs'])->name('logs');
        Route::get('/stats', [DashboardController::class, 'stats'])->name('stats');
        Route::post('/upload-logo', [DashboardController::class, 'uploadLogo'])->name('upload-logo');
        Route::get('/logos', [DashboardController::class, 'getLogos'])->name('logos');
    });

    // --- Registration Routes ---
    // All registration-related actions are grouped here.
    Route::prefix('registrations')->name('registrations.')->group(function () {
        // GET /api/registrations - Fetches all registrations.
        Route::get('/', [RegistrationController::class, 'index'])->name('index');

        // POST /api/registrations - Creates a new registration (with stricter rate limit).
        Route::post('/', [RegistrationController::class, 'store'])->name('store')->middleware('throttle:10,1');

        // GET /api/registrations/{ticket_number} - Fetches a single registration.
        Route::get('/{ticket_number}', [RegistrationController::class, 'show'])->name('show');
        
        // POST /api/registrations/{ticket_number}/scan - Logs a scan for a ticket.
        Route::post('/{ticket_number}/scan', [RegistrationController::class, 'scan'])->name('scan');

        // POST /api/registrations/{ticket_number}/print-badge - Manually prints a badge.
        Route::post('/{ticket_number}/print-badge', [RegistrationController::class, 'printBadge'])->name('print.badge');

        // POST /api/registrations/{ticket_number}/print-ticket - Manually prints a ticket.
        Route::post('/{ticket_number}/print-ticket', [RegistrationController::class, 'printTicket'])->name('print.ticket');

        // POST /api/registrations/{ticket_number}/scan-and-print-badge - Unified scan and print.
        Route::post('/{ticket_number}/scan-and-print-badge', [RegistrationController::class, 'scanAndPrintBadge'])->name('scan.print.badge');

        // POST /api/registrations/{ticket_number}/scan-and-print-ticket - Unified scan and print.
        Route::post('/{ticket_number}/scan-and-print-ticket', [RegistrationController::class, 'scanAndPrintTicket'])->name('scan.print.ticket');
    });

    // --- Superadmin-Only Routes (Example) ---
    // For testing high-level permissions.
    Route::get('/only-superadmin', function (Request $request) {
        return response()->json(['ok' => true, 'role' => $request->user()->role->name]);
    })->middleware('can:superadmin-only');

});