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
            /** @var \App\Models\User $user */

            // ✅ FIX: Check permission OR superadmin role
            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-dashboard');

            $cacheKey = "dashboard_summary:role_{$user->role->name}:user_{$user->id}";

            $summaryData = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($user, $canViewAll) {
                $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';

                // ✅ Use permission-based filtering
                $registrationQuery = $canViewAll
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
                        ->when(!$canViewAll, fn($q) => $q->where('id', $user->id))
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
            /** @var \App\Models\User $user */
            
            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-dashboard');
            
            $query = $canViewAll
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
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-dashboard');
            $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';

            $registrationQuery = $canViewAll
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
                    ->when(!$canViewAll, fn($q) => $q->where('scanned_by', $user->id))
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
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-dashboard');

            $query = $canViewAll
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
            /** @var \App\Models\User $user */
            
            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-dashboard');
            
            $users = User::withCount('scans')
                ->when(!$canViewAll, fn($q) => $q->where('id', $user->id))
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
     * ✅ UPDATED: Get counts for reports page with new demographic and survey breakdowns
     */
    public function reportsCounts(): JsonResponse
    {
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-reports');
            
            $baseQuery = $canViewAll
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);

            $notPrintedStatusId = PrintStatus::where('type', 'badge')->where('name', 'not_printed')->value('id');
            $printedStatusId = PrintStatus::where('type', 'badge')->where('name', 'printed')->value('id');
            $reprintedStatusId = PrintStatus::where('type', 'badge')->where('name', 'reprinted')->value('id');

            return response()->json([
                // Badge Status Counts
                'badge_status' => [
                    'not_printed' => (clone $baseQuery)->where(function ($query) use ($notPrintedStatusId) {
                        $query->where('badge_printed_status_id', $notPrintedStatusId)
                              ->orWhereNull('badge_printed_status_id');
                    })->count(),
                    'printed' => (clone $baseQuery)->where('badge_printed_status_id', $printedStatusId)->count(),
                    'reprinted' => (clone $baseQuery)->where('badge_printed_status_id', $reprintedStatusId)->count(),
                ],

                // Payment Status Counts
                'payment_status' => [
                    'paid' => (clone $baseQuery)->where('payment_status', 'paid')->count(),
                    'unpaid' => (clone $baseQuery)->where('payment_status', 'unpaid')->count(),
                    'complimentary' => (clone $baseQuery)->where('payment_status', 'complimentary')->count(),
                ],

                // Registration Type Counts
                'registration_type' => [
                    'onsite' => (clone $baseQuery)->where('registration_type', 'onsite')->count(),
                    'online' => (clone $baseQuery)->where('registration_type', 'online')->count(),
                    'pre_registered' => (clone $baseQuery)->where('registration_type', 'pre-registered')->count(),
                    'complimentary' => (clone $baseQuery)->where('registration_type', 'complimentary')->count(),
                ],

                // Demographics Counts
                'demographics' => [
                    'age_ranges' => (clone $baseQuery)
                        ->select('age_range', DB::raw('count(*) as count'))
                        ->whereNotNull('age_range')
                        ->where('age_range', '!=', '')
                        ->groupBy('age_range')
                        ->orderBy('age_range')
                        ->pluck('count', 'age_range'),
                    
                    'gender' => (clone $baseQuery)
                        ->select('gender', DB::raw('count(*) as count'))
                        ->whereNotNull('gender')
                        ->where('gender', '!=', '')
                        ->groupBy('gender')
                        ->pluck('count', 'gender'),
                    
                    'total_with_demographics' => (clone $baseQuery)
                        ->where(function ($q) {
                            $q->whereNotNull('age_range')
                              ->orWhereNotNull('gender');
                        })
                        ->count(),
                ],

                // Survey Data Counts
                'survey' => [
                    'industry_sector' => (clone $baseQuery)
                        ->select('industry_sector', DB::raw('count(*) as count'))
                        ->whereNotNull('industry_sector')
                        ->where('industry_sector', '!=', '')
                        ->groupBy('industry_sector')
                        ->orderByDesc('count')
                        ->limit(10)
                        ->pluck('count', 'industry_sector'),
                    
                    'reason_for_attending' => (clone $baseQuery)
                        ->select('reason_for_attending', DB::raw('count(*) as count'))
                        ->whereNotNull('reason_for_attending')
                        ->where('reason_for_attending', '!=', '')
                        ->groupBy('reason_for_attending')
                        ->orderByDesc('count')
                        ->limit(10)
                        ->pluck('count', 'reason_for_attending'),
                    
                    'areas_of_interest' => (clone $baseQuery)
                        ->select('specific_areas_of_interest', DB::raw('count(*) as count'))
                        ->whereNotNull('specific_areas_of_interest')
                        ->where('specific_areas_of_interest', '!=', '')
                        ->groupBy('specific_areas_of_interest')
                        ->orderByDesc('count')
                        ->limit(10)
                        ->pluck('count', 'specific_areas_of_interest'),
                    
                    'how_did_you_learn' => (clone $baseQuery)
                        ->select('how_did_you_learn_about', DB::raw('count(*) as count'))
                        ->whereNotNull('how_did_you_learn_about')
                        ->where('how_did_you_learn_about', '!=', '')
                        ->groupBy('how_did_you_learn_about')
                        ->orderByDesc('count')
                        ->limit(10)
                        ->pluck('count', 'how_did_you_learn_about'),
                    
                    'total_with_survey' => (clone $baseQuery)
                        ->where(function ($q) {
                            $q->whereNotNull('industry_sector')
                              ->orWhereNotNull('reason_for_attending')
                              ->orWhereNotNull('specific_areas_of_interest')
                              ->orWhereNotNull('how_did_you_learn_about');
                        })
                        ->count(),
                ],

                // Overall Totals
                'total' => (clone $baseQuery)->count(),
                'confirmed' => (clone $baseQuery)->where('confirmed', true)->count(),
                'unconfirmed' => (clone $baseQuery)->where('confirmed', false)->count(),
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
     * ✅ UPDATED: Reports List with enhanced search and export support
     */
    public function reportsList(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-reports');

            $perPage = $request->input('per_page', 50);
            $all = $request->boolean('all', false);

            $query = Registration::with([
                'badgeStatus:id,name,type',
                'ticketStatus:id,name,type',
                'registeredBy:id,name,email'
            ]);

            if (!$canViewAll) {
                $query->where('registered_by', $user->id);
            }

            // ✅ Enhanced search to include company_name and designation
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('company_name', 'like', "%{$search}%")
                      ->orWhere('designation', 'like', "%{$search}%")
                      ->orWhere('ticket_number', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // ✅ Filter by registration type
            if ($type = $request->input('registration_type')) {
                $query->where('registration_type', $type);
            }

            // ✅ Filter by payment status
            if ($payment = $request->input('payment_status')) {
                $query->where('payment_status', $payment);
            }

            // ✅ Filter by badge status
            if ($badgeStatus = $request->input('badge_status')) {
                $statusId = PrintStatus::where('type', 'badge')
                    ->where('name', $badgeStatus)
                    ->value('id');
                if ($statusId) {
                    $query->where('badge_printed_status_id', $statusId);
                }
            }

            // ✅ Filter by date range
            if ($startDate = $request->input('start_date')) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate = $request->input('end_date')) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            // ✅ Filter by industry sector
            if ($industry = $request->input('industry_sector')) {
                $query->where('industry_sector', $industry);
            }

            // ✅ Filter by age range
            if ($ageRange = $request->input('age_range')) {
                $query->where('age_range', $ageRange);
            }

            // ✅ Filter by gender
            if ($gender = $request->input('gender')) {
                $query->where('gender', $gender);
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

    /**
     * ✅ NEW: Get detailed demographics breakdown
     */
    public function demographicsBreakdown(): JsonResponse
    {
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-reports');
            
            $baseQuery = $canViewAll
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);

            return response()->json([
                'age_ranges' => (clone $baseQuery)
                    ->select('age_range', DB::raw('count(*) as count'))
                    ->whereNotNull('age_range')
                    ->where('age_range', '!=', '')
                    ->groupBy('age_range')
                    ->orderBy('age_range')
                    ->get(),
                
                'gender_distribution' => (clone $baseQuery)
                    ->select('gender', DB::raw('count(*) as count'))
                    ->whereNotNull('gender')
                    ->where('gender', '!=', '')
                    ->groupBy('gender')
                    ->orderByDesc('count')
                    ->get(),
                
                'total_registrations' => (clone $baseQuery)->count(),
                'with_demographics' => (clone $baseQuery)
                    ->where(function ($q) {
                        $q->whereNotNull('age_range')
                          ->orWhereNotNull('gender');
                    })
                    ->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Demographics breakdown error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch demographics breakdown',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Get survey data analysis
     */
    public function surveyAnalysis(): JsonResponse
    {
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-reports');
            
            $baseQuery = $canViewAll
                ? Registration::query() 
                : Registration::where('registered_by', $user->id);

            return response()->json([
                'industry_sectors' => (clone $baseQuery)
                    ->select('industry_sector', DB::raw('count(*) as count'))
                    ->whereNotNull('industry_sector')
                    ->where('industry_sector', '!=', '')
                    ->groupBy('industry_sector')
                    ->orderByDesc('count')
                    ->get(),
                
                'reasons_for_attending' => (clone $baseQuery)
                    ->select('reason_for_attending', DB::raw('count(*) as count'))
                    ->whereNotNull('reason_for_attending')
                    ->where('reason_for_attending', '!=', '')
                    ->groupBy('reason_for_attending')
                    ->orderByDesc('count')
                    ->get(),
                
                'areas_of_interest' => (clone $baseQuery)
                    ->select('specific_areas_of_interest', DB::raw('count(*) as count'))
                    ->whereNotNull('specific_areas_of_interest')
                    ->where('specific_areas_of_interest', '!=', '')
                    ->groupBy('specific_areas_of_interest')
                    ->orderByDesc('count')
                    ->get(),
                
                'marketing_channels' => (clone $baseQuery)
                    ->select('how_did_you_learn_about', DB::raw('count(*) as count'))
                    ->whereNotNull('how_did_you_learn_about')
                    ->where('how_did_you_learn_about', '!=', '')
                    ->groupBy('how_did_you_learn_about')
                    ->orderByDesc('count')
                    ->get(),
                
                'total_responses' => (clone $baseQuery)
                    ->where(function ($q) {
                        $q->whereNotNull('industry_sector')
                          ->orWhereNotNull('reason_for_attending')
                          ->orWhereNotNull('specific_areas_of_interest')
                          ->orWhereNotNull('how_did_you_learn_about');
                    })
                    ->count(),
                
                'total_registrations' => (clone $baseQuery)->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Survey analysis error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch survey analysis',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Export reports data (CSV format)
     */
    public function exportReports(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            /** @var \App\Models\User $user */

            $canViewAll = $user->role->name === 'superadmin' || $user->can('view-reports');

            $query = Registration::with([
                'badgeStatus:id,name,type',
                'ticketStatus:id,name,type',
                'registeredBy:id,name,email'
            ]);

            if (!$canViewAll) {
                $query->where('registered_by', $user->id);
            }

            // Apply same filters as reportsList
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('company_name', 'like', "%{$search}%")
                      ->orWhere('ticket_number', 'like', "%{$search}%");
                });
            }

            if ($type = $request->input('registration_type')) {
                $query->where('registration_type', $type);
            }

            if ($payment = $request->input('payment_status')) {
                $query->where('payment_status', $payment);
            }

            $registrations = $query->latest()->get();

            // Format data for export
            $exportData = $registrations->map(function ($reg) {
                return [
                    'ticket_number' => $reg->ticket_number,
                    'first_name' => $reg->first_name,
                    'last_name' => $reg->last_name,
                    'email' => $reg->email ?? 'N/A',
                    'phone' => $reg->phone ?? 'N/A',
                    'company' => $reg->company_name ?? 'N/A',
                    'designation' => $reg->designation ?? 'N/A',
                    'registration_type' => ucfirst($reg->registration_type),
                    'payment_status' => ucfirst($reg->payment_status),
                    'badge_status' => $reg->badgeStatus?->name ?? 'not_printed',
                    'age_range' => $reg->age_range ?? 'N/A',
                    'gender' => $reg->gender ?? 'N/A',
                    'industry_sector' => $reg->industry_sector ?? 'N/A',
                    'reason_for_attending' => $reg->reason_for_attending ?? 'N/A',
                    'areas_of_interest' => $reg->specific_areas_of_interest ?? 'N/A',
                    'how_learned_about' => $reg->how_did_you_learn_about ?? 'N/A',
                    'registered_at' => $reg->created_at->format('Y-m-d H:i:s'),
                    'registered_by' => $reg->registeredBy?->name ?? 'System',
                ];
            });

            return response()->json([
                'data' => $exportData,
                'total' => $exportData->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Export reports error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to export reports',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}