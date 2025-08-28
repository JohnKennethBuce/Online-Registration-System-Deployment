<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Registration;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * Dashboard summary (all key stats in one payload).
     */
    public function summary(): JsonResponse
    {
        try {
            // 🔹 Debug: log the current authenticated user
            Log::info('Dashboard Summary accessed by:', [
                'id'   => Auth::id(),
                'user' => Auth::user(),
            ]);

            Log::info('Current User:', [
                'role' => Auth::user()->role->name,
                'permissions' => Auth::user()->role->permissions
            ]);

            return response()->json([
                'registrations_by_type' => $this->getRegistrationsByType(),
                'confirmed_vs_pending'  => $this->getConfirmedVsPending(),
                'badge_statuses'        => $this->getBadgeStatuses(),
                'ticket_statuses'       => $this->getTicketStatuses(),
                'scans_per_user'        => $this->getScansPerUser(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch dashboard summary',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ------------------------------
    // Queries extracted as reusable functions
    // ------------------------------

    private function getRegistrationsByType()
    {
        return Registration::select('registration_type', DB::raw('count(*) as total'))
            ->groupBy('registration_type')
            ->get();
    }

    private function getConfirmedVsPending()
    {
        return Registration::select('confirmed', DB::raw('count(*) as total'))
            ->groupBy('confirmed')
            ->get();
    }

    private function getBadgeStatuses()
    {
        return Registration::select('badge_printed_status_id', DB::raw('count(*) as total'))
            ->groupBy('badge_printed_status_id')
            ->get();
    }

    private function getTicketStatuses()
    {
        return Registration::select('ticket_printed_status_id', DB::raw('count(*) as total'))
            ->groupBy('ticket_printed_status_id')
            ->get();
    }

    private function getScansPerUser()
    {
        return User::withCount('scans')
            ->get([
                'id', 'role_id', 'name', 'email',
                'phone', 'status', 'created_by',
                'created_at', 'updated_at'
            ]);
    }

    // ------------------------------
    // API endpoints reusing queries
    // ------------------------------

    public function registrationsBreakdown(): JsonResponse
    {
        try {
            return response()->json($this->getRegistrationsByType());
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch registration breakdown',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function printStatusBreakdown(): JsonResponse
    {
        try {
            return response()->json([
                'badge_statuses'  => $this->getBadgeStatuses(),
                'ticket_statuses' => $this->getTicketStatuses(),
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
            return response()->json($this->getScansPerUser());
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch scans per user',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
