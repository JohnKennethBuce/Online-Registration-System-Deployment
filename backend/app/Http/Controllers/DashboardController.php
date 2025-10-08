<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Registration;
use App\Models\ServerMode;
use App\Models\Scan;
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
        $this->middleware('auth:sanctum'); // Ensure authenticated user
    }
    /**
     * Dashboard summary (all key stats in one payload).
     */
    public function summary(): JsonResponse
    {
        try {
            $user = Auth::user();
        
            // Each user gets their own cache. A superadmin sees all, an admin sees their own.
            $cacheKey = "dashboard_summary:role_{$user->role->name}:user_{$user->id}";
        
            // Store the result for 10 minutes. If the key exists, it's returned instantly.
            // If not, the closure runs, and its result is stored and returned.
            $summaryData = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($user) {
                $isSuperAdmin = $user->role->name === 'superadmin';
                $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';
            
                $baseQuery = fn ($q) => $isSuperAdmin ? $q : $q->where('registered_by', $user->id);
            
                // The exact same queries from before, now inside the cache closure
                return [
                    'server_mode'           => $currentMode,
                    'registrations_by_type' => $baseQuery(Registration::select('registration_type', DB::raw('count(*) as total'))->groupBy('registration_type'))->get(),
                    'confirmed_vs_pending'  => $baseQuery(Registration::select('confirmed', DB::raw('count(*) as total'))->groupBy('confirmed'))->get(),
                    'badge_statuses'        => $baseQuery(Registration::select('badge_printed_status_id', DB::raw('count(*) as total'))->groupBy('badge_printed_status_id'))->get(),
                    'ticket_statuses'       => $baseQuery(Registration::select('ticket_printed_status_id', DB::raw('count(*) as total'))->groupBy('ticket_printed_status_id'))->get(),
                    'scans_per_user'        => User::withCount('scans')->get(),
                ];
            });
        
            return response()->json($summaryData);
        
        } 
        
        catch (\Exception $e) {
            Log::error('Dashboard summary error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Failed to fetch dashboard summary',
                'message' => $e->getMessage()
            ], 500);
            
            }
        }

    // ------------------------------
    // Queries extracted as reusable functions with role filtering
    // ------------------------------

    private function getRegistrationsByType(bool $isSuperAdmin)
    {
        $query = Registration::select('registration_type', DB::raw('count(*) as total'))
            ->groupBy('registration_type');
        return $isSuperAdmin ? $query->get() : $query->where('registered_by', Auth::id())->get();
    }

    private function getConfirmedVsPending(bool $isSuperAdmin)
    {
        $query = Registration::select('confirmed', DB::raw('count(*) as total'))
            ->groupBy('confirmed');
        return $isSuperAdmin ? $query->get() : $query->where('registered_by', Auth::id())->get();
    }

    private function getBadgeStatuses(bool $isSuperAdmin)
    {
        $query = Registration::select('badge_printed_status_id', DB::raw('count(*) as total'))
            ->groupBy('badge_printed_status_id');
        return $isSuperAdmin ? $query->get() : $query->where('registered_by', Auth::id())->get();
    }

    private function getTicketStatuses(bool $isSuperAdmin)
    {
        $query = Registration::select('ticket_printed_status_id', DB::raw('count(*) as total'))
            ->groupBy('ticket_printed_status_id');
        return $isSuperAdmin ? $query->get() : $query->where('registered_by', Auth::id())->get();
    }

    private function getScansPerUser(bool $isSuperAdmin)
    {
        $query = User::withCount('scans')
            ->select(['id', 'role_id', 'name', 'email', 'phone', 'status', 'created_by', 'created_at', 'updated_at']);
        return $isSuperAdmin ? $query->get() : $query->where('id', Auth::id())->get();
    }

    // ------------------------------
    // API endpoints reusing queries
    // ------------------------------

    public function registrationsBreakdown(): JsonResponse
    {
        try {
            return response()->json($this->getRegistrationsByType(Auth::user()->role->name === 'superadmin'));
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch registration breakdown',
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
 
             $baseQuery = fn ($q) => $isSuperAdmin ? $q : $q->where('registered_by', $user->id);
 
             return response()->json([
                 'server_mode' => $currentMode,
                 'total_registrations' => $baseQuery(Registration::query())->count(),
                 'by_mode' => Registration::select('server_mode', DB::raw('count(*) as total'))
                     ->groupBy('server_mode')
                     ->get(),
                 'active_users' => $baseQuery(User::where('status', 'active'))->count(),
                 'recent_scans' => Scan::where('scanned_time', '>', now()->subHours(24))->count(),
             ]);
         } catch (\Exception $e) {
             Log::error('Stats error: ' . $e->getMessage());
             return response()->json([
                 'error'   => 'Failed to fetch stats',
                 'message' => $e->getMessage()
             ], 500);
         }
     }
    

    public function printStatusBreakdown(): JsonResponse
    {
        try {
            $isSuperAdmin = Auth::user()->role->name === 'superadmin';
            return response()->json([
                'badge_statuses'  => $this->getBadgeStatuses($isSuperAdmin),
                'ticket_statuses' => $this->getTicketStatuses($isSuperAdmin),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch print status breakdown',
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
            return response()->json($this->getScansPerUser(Auth::user()->role->name === 'superadmin'));
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch scans per user',
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

            $logs = Log::with('user')
                ->when($request->input('action'), fn ($q) => $q->where('action', $request->input('action')))
                ->when($request->input('target_type'), fn ($q) => $q->where('target_type', $request->input('target_type')))
                ->when($request->input('user_id'), fn ($q) => $q->where('user_id', $request->input('user_id')))
                ->latest()
                ->paginate(50); // Paginate for better performance

            return response()->json($logs);
        } catch (\Exception $e) {
            Log::error('Logs error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Failed to fetch logs',
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
                'logo_file' => 'required|image|max:2048', // Max 2MB
            ]);

            $logoType = $request->input('logo_type');
            $file = $request->file('logo_file');
            
            // This is the relative path we will store in the database
            $fileName = 'logos/' . time() . '_' . $logoType . '.' . $file->getClientOriginalExtension();

            if (!Storage::disk('public')->exists('logos')) {
                Storage::disk('public')->makeDirectory('logos');
            }
            Storage::disk('public')->put($fileName, file_get_contents($file));

            // --- NEW LOGIC TO UPDATE THE DATABASE ---
            $settingKeyMap = [
                'event'        => 'main_logo_path',
                'organizer'    => 'organizer_logo_path',
                'manager'      => 'manager_logo_path',
                'registration' => 'registration_logo_path',
            ];

            if (array_key_exists($logoType, $settingKeyMap)) {
                $settingKey = $settingKeyMap[$logoType];
                Setting::updateOrCreate(
                    ['key' => $settingKey],
                    ['value' => $fileName]
                );
            }
            // --- END NEW LOGIC ---

            Log::info('Logo uploaded and setting updated', ['type' => $logoType, 'path' => $fileName, 'user_id' => Auth::id()]);
            
            return response()->json([
                'message' => 'Logo uploaded successfully',
                'path' => $fileName, // Return the relative path
            ]);
        } catch (\Exception $e) {
            Log::error('Logo upload error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Failed to upload logo',
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
            $logos = Storage::disk('public')->files('logos');
            $logoUrls = array_map(fn ($path) => '/storage/' . $path, $logos);
            return response()->json(['logos' => $logoUrls]);
        } catch (\Exception $e) {
            Log::error('Get logos error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Failed to retrieve logos',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}