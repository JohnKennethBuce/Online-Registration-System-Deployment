<?php

namespace App\Http\Controllers;

use App\Models\ServerMode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ServerModeController extends Controller
{
    /**
     * Get the current (latest) server mode.
     * This is what the entire application will check against.
     */
    public function getCurrentMode(): JsonResponse
    {
        $currentMode = ServerMode::latest()->with('activatedBy:id,name')->first();

        if (!$currentMode) {
            return response()->json(['error' => 'Server mode is not configured.'], 404);
        }

        return response()->json([
            'message' => 'Current server mode retrieved.',
            'current_mode' => $currentMode,
        ]);
    }

    /**
     * Set a new server mode. This creates a new record, effectively
     * making it the latest and current mode.
     * Restricted to Superadmins only.
     */
    public function setMode(Request $request): JsonResponse
    {
        // Use the 'superadmin-only' Gate for authorization
        if (!Gate::allows('superadmin-only')) {
            abort(403, 'This action is unauthorized.');
        }

        $validated = $request->validate([
            'mode' => 'required|string|in:onsite,online,both,deactivate',
        ]);

        // Create a new mode entry, which becomes the current active mode
        $newMode = ServerMode::create([
            'mode' => $validated['mode'],
            'activated_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Server mode successfully updated.',
            'new_mode' => $newMode->load('activatedBy:id,name'),
        ], 201);
    }

    /**
     * Get the history of all server mode changes, paginated.
     * Useful for an audit log in the admin panel.
     */
    public function getHistory(): JsonResponse
    {
        $history = ServerMode::latest()
            ->with('activatedBy:id,name')
            ->paginate(15); // Paginate for performance

        return response()->json($history);
    }
}