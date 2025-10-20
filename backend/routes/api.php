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

// 🔐 AUTH - Public
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

// 🎫 Public badge printing
Route::get('/registrations/{ticketNumber}/badge', [BadgeController::class, 'show'])
    ->name('registrations.badge');

// 📝 Public registration form (rate limited)
Route::post('/registrations', [RegistrationController::class, 'store'])
    ->name('registrations.store')
    ->middleware('throttle:10,1');

// 🎟️ Pre-registration verification (NEW - ADD THIS)
Route::get('/verify-registration/{code}', [RegistrationController::class, 'verifyPreRegistration'])
    ->name('registrations.verify')
    ->middleware('throttle:20,1');

// 🟢 Public server mode status (read-only)
Route::get('/server-mode/status', [ServerModeController::class, 'getCurrentMode']);
Route::get('/server-mode', [ServerModeController::class, 'getCurrentMode']); // alias

// --- PROTECTED ROUTES ---
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | AUTH ROUTES
    |--------------------------------------------------------------------------
    */
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

        // ✅ Used by React AuthContext → fetchUser()
        Route::get('/me', fn (Request $request) => $request->user()->load('role'));

        // Optional - debug only
        Route::get('/check', function (Request $request) {
            $user = $request->user()->load('role');
            return response()->json([
                'authenticated' => $user !== null,
                'user' => $user,
                'role' => $user?->role?->name,
                'permissions' => $user?->role?->permissions ?? [],
            ]);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | USER MANAGEMENT
    |--------------------------------------------------------------------------
    */
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('can:view-users');
        Route::post('/', [UserController::class, 'store'])->middleware('can:create-user');
        Route::put('/{user}', [UserController::class, 'update'])->middleware('can:edit-user');
        Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('can:delete-user');
    });

    /*
    |--------------------------------------------------------------------------
    | ROLE & PERMISSION MANAGEMENT
    |--------------------------------------------------------------------------
    */
    Route::prefix('roles')->middleware('can:manage-roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::put('/{role}', [RoleController::class, 'update']);
    });
    Route::get('/permissions', [RoleController::class, 'getAllPermissions'])
        ->middleware('can:manage-roles');

    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingController::class, 'index'])->middleware('can:view-settings');
        Route::post('/', [SettingController::class, 'update'])->middleware('can:edit-settings');
    });

    /*
    |--------------------------------------------------------------------------
    | SERVER MODE MANAGEMENT
    |--------------------------------------------------------------------------
    */
    Route::prefix('server-mode')->group(function () {
        // GET is public above; keep only mutating/history protected
        Route::post('/', [ServerModeController::class, 'setMode'])
            ->middleware('can:edit-server-mode');
        Route::get('/history', [ServerModeController::class, 'getHistory'])
            ->middleware('can:edit-server-mode');
    });

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */
    Route::prefix('dashboard')->middleware('can:view-dashboard')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/registrations', [DashboardController::class, 'registrationsBreakdown']);
        Route::get('/print-statuses', [DashboardController::class, 'printStatusBreakdown']);
        Route::get('/scans-per-user', [DashboardController::class, 'scansPerUser']);
        Route::get('/logs', [DashboardController::class, 'logs']);
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::post('/upload-logo', [DashboardController::class, 'uploadLogo']);
        Route::get('/logos', [DashboardController::class, 'getLogos']);
        Route::get('/reports-counts', [DashboardController::class,'reportsCounts'])->middleware('can:view-reports');
        Route::get('/reports-list', [DashboardController::class,'reportsList'])->middleware('can:view-reports');
    });

    /*
    |--------------------------------------------------------------------------
    | REGISTRATION MANAGEMENT (Admin)
    |--------------------------------------------------------------------------
    */
    Route::prefix('registrations')->group(function () {
        Route::get('/', [RegistrationController::class, 'index'])->middleware('can:view-registrations');
        Route::get('/{registration:ticket_number}', [RegistrationController::class, 'show'])
            ->middleware('can:view-registrations');
        Route::post('/{ticket_number}/scan', [RegistrationController::class, 'scan'])
            ->middleware('can:scan-registration');
        Route::put('/{registration}', [RegistrationController::class, 'update'])
            ->middleware('can:edit-registration');
        Route::delete('/{registration}', [RegistrationController::class, 'destroy'])
            ->middleware('can:delete-registration');
    });
});