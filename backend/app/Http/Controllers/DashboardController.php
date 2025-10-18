<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Registration;
use App\Models\ServerMode;
use App\Models\Scan;
use App\Models\PrintStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Models\Setting;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Dashboard summary (all key stats in one payload).
     */
    public function summary(): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            
            $cacheKey = "dashboard_summary:role_{$user->role->name}:user_{$user->id}";
            
            $summaryData = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($user, $isSuperAdmin) {
                $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';
                
                $registrationQuery = $isSuperAdmin 
                    ? Registration::query() 
                    : Registration::where('registered_by', $user->id);
                
                return [
                    'server_mode' => $currentMode,
                    
                    'registrations_by_type' => (clone $registrationQuery)
                        ->select('registration_type', DB::raw('count(*) as total'))
                        ->groupBy('registration_type')
                        ->get(),
                    
                    'confirmed_vs_pending' => (clone $registrationQuery)
                        ->select('confirmed', DB::raw('count(*) as total'))
                        ->groupBy('confirmed')
                        ->get(),
                    
                    'badge_statuses' => (clone $registrationQuery)
                        ->select('badge_printed_status_id', DB::raw('count(*) as total'))
                        ->groupBy('badge_printed_status_id')
                        ->get(),
                    
                    'ticket_statuses' => (clone $registrationQuery)
                        ->select('ticket_printed_status_id', DB::raw('count(*) as total'))
                        ->groupBy('ticket_printed_status_id')
                        ->get(),
                    
                    'scans_per_user' => User::withCount('scans')
                        ->when(!$isSuperAdmin, fn($q) => $q->where('id', $user->id))
                        ->get(['id', 'name', 'email']),
                ];
            });
            
            return response()->json($summaryData);
            
        } catch (\Exception $e) {
            Log::error('Dashboard summary error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to fetch dashboard summary',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrations breakdown by type.
     */
    public function registrationsBreakdown(): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            
            $query = $isSuperAdmin 
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);
            
            $breakdown = $query->select('registration_type', DB::raw('count(*) as total'))
                ->groupBy('registration_type')
                ->get();
            
            return response()->json($breakdown);
        } catch (\Exception $e) {
            Log::error('Registrations breakdown error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch registration breakdown',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Detailed stats breakdown by ServerMode.
     */
    public function stats(): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';

            $registrationQuery = $isSuperAdmin 
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);

            return response()->json([
                'server_mode' => $currentMode,
                'total_registrations' => (clone $registrationQuery)->count(),
                
                'by_mode' => (clone $registrationQuery)
                    ->select('server_mode', DB::raw('count(*) as total'))
                    ->groupBy('server_mode')
                    ->get(),
                
                'active_users' => User::where('status', 'active')->count(),
                
                'recent_scans' => Scan::query()
                    ->when(!$isSuperAdmin, fn($q) => $q->where('scanned_by', $user->id))
                    ->where('scanned_time', '>', now()->subHours(24))
                    ->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Stats error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Print status breakdown (badge + ticket).
     */
    public function printStatusBreakdown(): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            
            $query = $isSuperAdmin 
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);
            
            return response()->json([
                'badge_statuses' => (clone $query)
                    ->select('badge_printed_status_id', DB::raw('count(*) as total'))
                    ->groupBy('badge_printed_status_id')
                    ->get(),
                
                'ticket_statuses' => (clone $query)
                    ->select('ticket_printed_status_id', DB::raw('count(*) as total'))
                    ->groupBy('ticket_printed_status_id')
                    ->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Print status breakdown error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch print status breakdown',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Scans per user (admins & superadmin).
     */
    public function scansPerUser(): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            
            $users = User::withCount('scans')
                ->when(!$isSuperAdmin, fn($q) => $q->where('id', $user->id))
                ->get(['id', 'name', 'email']);
            
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Scans per user error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch scans per user',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logs endpoint for Super Admin.
     */
    public function logs(Request $request): JsonResponse
    {
        try {
            if (Auth::user()->role->name !== 'superadmin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Note: This assumes you have a Log model - adjust if using different logging
            $logs = Log::with('user')
                ->when($request->input('action'), fn ($q) => $q->where('action', $request->input('action')))
                ->when($request->input('target_type'), fn ($q) => $q->where('target_type', $request->input('target_type')))
                ->when($request->input('user_id'), fn ($q) => $q->where('user_id', $request->input('user_id')))
                ->latest()
                ->paginate(50);

            return response()->json($logs);
        } catch (\Exception $e) {
            Log::error('Logs error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch logs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload logos for badge/ticket (Super Admin only).
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        try {
            if (Auth::user()->role->name !== 'superadmin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $request->validate([
                'logo_type' => 'required|in:event,organizer,manager,registration',
                'logo_file' => 'required|image|max:2048',
            ]);

            $logoType = $request->input('logo_type');
            $file = $request->file('logo_file');

            $settingKeyMap = [
                'event'        => 'main_logo_path',
                'organizer'    => 'organizer_logo_path',
                'manager'      => 'manager_logo_path',
                'registration' => 'registration_logo_path',
            ];

            $settingKey = $settingKeyMap[$logoType];
            $existing = Setting::where('key', $settingKey)->first();
            $oldPath = $existing?->value;

            $newPath = $file->store('logos', 'public');

            if ($oldPath) {
                $oldRel = ltrim(str_replace('\\', '/', $oldPath), '/');
                $oldRel = preg_replace('#^storage/#i', '', $oldRel);
                if ($oldRel && Storage::disk('public')->exists($oldRel)) {
                    Storage::disk('public')->delete($oldRel);
                }
            }

            Setting::updateOrCreate(
                ['key' => $settingKey],
                ['value' => $newPath]
            );

            Log::info('Logo uploaded and setting updated', [
                'type' => $logoType,
                'path' => $newPath,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Logo uploaded successfully',
                'path' => $newPath,
                'url'  => asset('storage/' . $newPath),
            ]);
        } catch (\Exception $e) {
            Log::error('Logo upload error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to upload logo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve available logos (for badge/ticket rendering).
     */
    public function getLogos(): JsonResponse
    {
        try {
            $files = Storage::disk('public')->files('logos');
            $items = array_map(function ($path) {
                return [
                    'path' => $path,
                    'url'  => asset('storage/' . $path)
                ];
            }, $files);

            return response()->json(['logos' => $items]);
        } catch (\Exception $e) {
            Log::error('Get logos error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to retrieve logos',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get counts for reports page (printed, re-printed, paid, unpaid, total).
     */
    public function reportsCounts(): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            
            // ✅ FIX: Create proper base query
            $baseQuery = $isSuperAdmin 
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);

            $printedStatusId = PrintStatus::where('type', 'badge')->where('name', 'printed')->value('id');
            $reprintedStatusId = PrintStatus::where('type', 'badge')->where('name', 'reprinted')->value('id');

            return response()->json([
                'printed' => (clone $baseQuery)->where('badge_printed_status_id', $printedStatusId)->count(),
                'reprinted' => (clone $baseQuery)->where('badge_printed_status_id', $reprintedStatusId)->count(),
                'paid' => (clone $baseQuery)->where('payment_status', 'paid')->count(),
                'unpaid' => (clone $baseQuery)->where('payment_status', 'unpaid')->count(),
                'total' => (clone $baseQuery)->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Reports counts error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch reports counts',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reports List with search and export support.
     */
    public function reportsList(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $isSuperAdmin = $user->role->name === 'superadmin';
            $perPage = $request->input('per_page', 50);
            $all = $request->boolean('all', false);

            // ✅ FIX: Load relationships properly
            $query = Registration::with([
                'badgeStatus:id,name,type',
                'ticketStatus:id,name,type',
                'registeredBy:id,name,email'
            ]);

            if (!$isSuperAdmin) {
                $query->where('registered_by', $user->id);
            }

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('ticket_number', 'like', "%{$search}%");
                });
            }

            if ($all) {
                $registrations = $query->latest()->get();
                return response()->json(['data' => $registrations]);
            } else {
                $registrations = $query->latest()->paginate($perPage);
                return response()->json($registrations);
            }
        } catch (\Exception $e) {
            Log::error('Reports list error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch reports list',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}