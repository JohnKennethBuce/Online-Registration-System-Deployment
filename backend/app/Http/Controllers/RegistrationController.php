<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Models\PrintStatus;
use App\Models\ServerMode;
use App\Models\Scan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Crypt;
use App\Jobs\GenerateQrCode;

class RegistrationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum'); // Ensure authenticated user
    }

    public function index(Request $request): JsonResponse
{
    // Validate that the per_page is a reasonable number
    $perPage = $request->validate([
        'per_page' => 'integer|min:10|max:100'
    ])['per_page'] ?? 50;

    $registrations = Registration::with(['badgeStatus', 'ticketStatus'])
        ->latest() // Always good to have a default order
        ->paginate($perPage);

    // No change to the return format, Laravel handles it automatically
    return response()->json($registrations);
}

    public function store(Request $request): JsonResponse
        {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:registrations,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'registration_type' => 'required|in:onsite,online,pre-registered',
            ]);

            // Check for duplicate email hash
            $emailHash = hash('sha256', strtolower(trim($validated['email'])));
            if (Registration::where('email_hash', $emailHash)->exists()) {
                return response()->json(['error' => 'This email address is already registered.'], 409);
            }

            // ServerMode validation
            $serverMode = ServerMode::latest()->first();
            if (!$serverMode) {
                return response()->json(['error' => 'Server mode not configured.'], 500);
            }
            $allowedTypes = explode(',', str_replace('both', 'onsite,online', $serverMode->mode));
            if (!in_array($validated['registration_type'], $allowedTypes)) {
                return response()->json(['error' => 'Registration type not allowed in current mode'], 400);
            }

            // PrintStatus setup
            $badgeNotPrinted = PrintStatus::where('type', 'badge')->where('name', 'not_printed')->first();
            $ticketNotPrinted = PrintStatus::where('type', 'ticket')->where('name', 'not_printed')->first();
            if (!$badgeNotPrinted || !$ticketNotPrinted) {
                return response()->json(['error' => 'Print statuses not configured.'], 500);
            }

            // Create Registration first
            $ticketNumber = 'TICKET-' . strtoupper(Str::random(12));
            $registration = Registration::create([
                'first_name' => Crypt::encryptString($validated['first_name']),
                'last_name' => Crypt::encryptString($validated['last_name']),
                'email' => Crypt::encryptString($validated['email']),
                'email_hash' => $emailHash,
                'phone' => $validated['phone'] ? Crypt::encryptString($validated['phone']) : null,
                'address' => $validated['address'] ? Crypt::encryptString($validated['address']) : null,
                'registration_type' => $validated['registration_type'],
                'server_mode' => $serverMode->mode,
                'badge_printed_status_id' => $badgeNotPrinted->id,
                'ticket_printed_status_id' => $ticketNotPrinted->id,
                'ticket_number' => $ticketNumber,
                'registered_by' => Auth::id(),
            ]);

            // ✅ Dispatch a job to handle QR code generation in the background
            GenerateQrCode::dispatch($registration);

            Log::info('Registration created and QR job dispatched', [
                'ticket_number' => $ticketNumber,
                'user_id' => Auth::id(),
                'mode' => $serverMode->mode
            ]);

            return response()->json([
                'message' => 'Registration successful. The QR code will be generated shortly.',
                // We return the fresh registration object without the qr_url,
                // as it will be created in the background.
                'registration' => $registration->fresh(),
            ], 201);
        }
        
            public function show($ticketNumber): JsonResponse
            {
                $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();
                return response()->json([
                    'message' => 'Registration retrieved successfully',
                    'registration' => $registration,
                ]);
            }

        public function scan(Request $request): JsonResponse
            {
                $validated = $request->validate([
                    'ticket_number' => 'required|string|exists:registrations,ticket_number',
                ]);
            
                $registration = Registration::where('ticket_number', $validated['ticket_number'])->firstOrFail();
                $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';
            
                if ($registration->server_mode !== $currentMode && $currentMode !== 'both') {
                    return response()->json(['error' => 'Scan not allowed in current mode'], 403);
                }
            
                // --- Statuses ---
                $badgeQueued   = PrintStatus::where('type', 'badge')->where('name', 'queued')->first();
                $badgePrinting = PrintStatus::where('type', 'badge')->where('name', 'printing')->first();
                $badgePrinted  = PrintStatus::where('type', 'badge')->where('name', 'printed')->first();
                $badgeReprinted= PrintStatus::where('type', 'badge')->where('name', 'reprinted')->first();
                $badgeFailed   = PrintStatus::where('type', 'badge')->where('name', 'failed')->first();
            
                $ticketQueued   = PrintStatus::where('type', 'ticket')->where('name', 'queued')->first();
                $ticketPrinting = PrintStatus::where('type', 'ticket')->where('name', 'printing')->first();
                $ticketPrinted  = PrintStatus::where('type', 'ticket')->where('name', 'printed')->first();
                $ticketReprinted= PrintStatus::where('type', 'ticket')->where('name', 'reprinted')->first();
                $ticketFailed   = PrintStatus::where('type', 'ticket')->where('name', 'failed')->first();
            
                if (!$badgeQueued || !$badgePrinting || !$badgePrinted || !$ticketQueued || !$ticketPrinting || !$ticketPrinted) {
                    return response()->json(['error' => 'Print statuses not configured'], 400);
                }
            
                // --- Create scan log ---
                $scan = Scan::create([
                    'registration_id' => $registration->id,
                    'scanned_by' => Auth::id(),
                    'scanned_time' => now(),
                    'badge_printed_status_id' => $badgeQueued->id,
                    'ticket_printed_status_id' => $ticketQueued->id,
                ]);
            
                // --- Auto confirm if not already ---
                if (!$registration->confirmed) {
                    $registration->update([
                        'confirmed' => true,
                        'confirmed_by' => Auth::id(),
                        'confirmed_at' => now(),
                    ]);
                }
            
                // ------------------------------------------------------
                // ✅ Trigger print after scan (NOTED: print hook here)
                // ------------------------------------------------------
                try {
                    // Badge flow
                    if ($registration->badge_printed_status_id == $badgePrinted->id) {
                        $registration->update(['badge_printed_status_id' => $badgeReprinted->id]);
                    } else {
                        $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
                        $registration->update(['badge_printed_status_id' => $badgePrinting->id]);
                    
                        // 🚀 HERE you will dispatch actual badge print job
                        $registration->update(['badge_printed_status_id' => $badgePrinted->id]);
                    }
                
                    // Ticket flow
                    if ($registration->ticket_printed_status_id == $ticketPrinted->id) {
                        $registration->update(['ticket_printed_status_id' => $ticketReprinted->id]);
                    } else {
                        $registration->update(['ticket_printed_status_id' => $ticketQueued->id]);
                        $registration->update(['ticket_printed_status_id' => $ticketPrinting->id]);
                    
                        // 🚀 HERE you will dispatch actual ticket print job
                        $registration->update(['ticket_printed_status_id' => $ticketPrinted->id]);
                    }
                
                    Log::info('Registration scanned & printed', [
                        'ticket_number' => $validated['ticket_number'],
                        'user_id' => Auth::id(),
                        'mode' => $currentMode
                    ]);
                
                } catch (\Exception $e) {
                    if ($badgeFailed) $registration->update(['badge_printed_status_id' => $badgeFailed->id]);
                    if ($ticketFailed) $registration->update(['ticket_printed_status_id' => $ticketFailed->id]);
                
                    Log::error('Printing failed after scan', [
                        'ticket_number' => $validated['ticket_number'],
                        'error' => $e->getMessage()
                    ]);
                
                    return response()->json(['error' => 'Failed to print after scan'], 500);
                }
            
                return response()->json([
                    'message' => 'QR scanned → print triggered → marked printed/reprinted',
                    'scan' => $scan,
                    'registration' => $registration->fresh(),
                ], 200);
            }

            public function printBadge($ticketNumber): JsonResponse
            {
                $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();
            
                $badgeQueued = PrintStatus::where('type', 'badge')->where('name', 'queued')->first();
                $badgePrinting = PrintStatus::where('type', 'badge')->where('name', 'printing')->first();
                $badgePrinted = PrintStatus::where('type', 'badge')->where('name', 'printed')->first();
                $badgeFailed = PrintStatus::where('type', 'badge')->where('name', 'failed')->first();
            
                if (!$badgeQueued || !$badgePrinting || !$badgePrinted) {
                    return response()->json(['error' => 'Badge print statuses not configured'], 400);
                }
            
                // Transition to queued
                $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
                Log::info('Badge print queued', ['ticket_number' => $ticketNumber]);
            
                try {
                    // Transition to printing
                    $registration->update(['badge_printed_status_id' => $badgePrinting->id]);
            
                    // 🚀 Simulate actual print job here (dispatch to printer)
                    // If successful → mark printed
                    $registration->update(['badge_printed_status_id' => $badgePrinted->id]);
            
                    Log::info('Badge printed', ['ticket_number' => $ticketNumber, 'user_id' => Auth::id()]);
                    return response()->json([
                        'message' => 'Badge marked as printed',
                        'registration' => $registration->fresh(),
                    ], 200);
            
                } catch (\Exception $e) {
                    if ($badgeFailed) {
                        $registration->update(['badge_printed_status_id' => $badgeFailed->id]);
                    }
                    Log::error('Badge printing failed', ['ticket_number' => $ticketNumber, 'error' => $e->getMessage()]);
                    return response()->json(['error' => 'Failed to print badge'], 500);
                }
            }

            public function printTicket($ticketNumber): JsonResponse
            {
                $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();
            
                $ticketQueued = PrintStatus::where('type', 'ticket')->where('name', 'queued')->first();
                $ticketPrinting = PrintStatus::where('type', 'ticket')->where('name', 'printing')->first();
                $ticketPrinted = PrintStatus::where('type', 'ticket')->where('name', 'printed')->first();
                $ticketFailed = PrintStatus::where('type', 'ticket')->where('name', 'failed')->first();
            
                if (!$ticketQueued || !$ticketPrinting || !$ticketPrinted) {
                    return response()->json(['error' => 'Ticket print statuses not configured'], 400);
                }
            
                // Transition to queued
                $registration->update(['ticket_printed_status_id' => $ticketQueued->id]);
                Log::info('Ticket print queued', ['ticket_number' => $ticketNumber]);
            
                try {
                    // Transition to printing
                    $registration->update(['ticket_printed_status_id' => $ticketPrinting->id]);
                
                    // 🚀 Simulate actual print job here (dispatch to printer)
                    $registration->update(['ticket_printed_status_id' => $ticketPrinted->id]);
                
                    Log::info('Ticket printed', ['ticket_number' => $ticketNumber, 'user_id' => Auth::id()]);
                    return response()->json([
                        'message' => 'Ticket marked as printed',
                        'registration' => $registration->fresh(),
                    ], 200);
                
                } catch (\Exception $e) {
                    if ($ticketFailed) {
                        $registration->update(['ticket_printed_status_id' => $ticketFailed->id]);
                    }
                    Log::error('Ticket printing failed', ['ticket_number' => $ticketNumber, 'error' => $e->getMessage()]);
                    return response()->json(['error' => 'Failed to print ticket'], 500);
                }
            } 

             /**
     * Unified: Scan QR + Auto print Badge
     */
    public function scanAndPrintBadge($ticketNumber): JsonResponse
    {
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();

        $badgeQueued   = PrintStatus::where('type', 'badge')->where('name', 'queued')->first();
        $badgePrinting = PrintStatus::where('type', 'badge')->where('name', 'printing')->first();
        $badgePrinted  = PrintStatus::where('type', 'badge')->where('name', 'printed')->first();
        $badgeReprinted= PrintStatus::where('type', 'badge')->where('name', 'reprinted')->first();
        $badgeFailed   = PrintStatus::where('type', 'badge')->where('name', 'failed')->first();

        if (!$badgeQueued || !$badgePrinting || !$badgePrinted) {
            return response()->json(['error' => 'Badge print statuses not configured'], 400);
        }

        // --- Create scan log
        $scan = Scan::create([
            'registration_id' => $registration->id,
            'scanned_by' => Auth::id(),
            'scanned_time' => now(),
            'badge_printed_status_id' => $badgeQueued->id,
        ]);

        try {
            // If already printed → mark as reprinted
            if ($registration->badge_printed_status_id == $badgePrinted->id) {
                $registration->update(['badge_printed_status_id' => $badgeReprinted->id]);
            } else {
                $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
                $registration->update(['badge_printed_status_id' => $badgePrinting->id]);

                // 🚀 Simulate print here
                $registration->update(['badge_printed_status_id' => $badgePrinted->id]);
            }

            Log::info('Scan + badge print complete', [
                'ticket_number' => $ticketNumber,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Scanned → Badge printed',
                'scan' => $scan,
                'registration' => $registration->fresh(),
            ], 200);

        } catch (\Exception $e) {
            if ($badgeFailed) {
                $registration->update(['badge_printed_status_id' => $badgeFailed->id]);
            }
            Log::error('Badge printing failed after scan', [
                'ticket_number' => $ticketNumber,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to print badge after scan'], 500);
        }
    }

    /**
     * Unified: Scan QR + Auto print Ticket
     */
    public function scanAndPrintTicket($ticketNumber): JsonResponse
    {
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();

        $ticketQueued   = PrintStatus::where('type', 'ticket')->where('name', 'queued')->first();
        $ticketPrinting = PrintStatus::where('type', 'ticket')->where('name', 'printing')->first();
        $ticketPrinted  = PrintStatus::where('type', 'ticket')->where('name', 'printed')->first();
        $ticketReprinted= PrintStatus::where('type', 'ticket')->where('name', 'reprinted')->first();
        $ticketFailed   = PrintStatus::where('type', 'ticket')->where('name', 'failed')->first();

        if (!$ticketQueued || !$ticketPrinting || !$ticketPrinted) {
            return response()->json(['error' => 'Ticket print statuses not configured'], 400);
        }

        // --- Create scan log
        $scan = Scan::create([
            'registration_id' => $registration->id,
            'scanned_by' => Auth::id(),
            'scanned_time' => now(),
            'ticket_printed_status_id' => $ticketQueued->id,
        ]);

        try {
            // If already printed → mark as reprinted
            if ($registration->ticket_printed_status_id == $ticketPrinted->id) {
                $registration->update(['ticket_printed_status_id' => $ticketReprinted->id]);
            } else {
                $registration->update(['ticket_printed_status_id' => $ticketQueued->id]);
                $registration->update(['ticket_printed_status_id' => $ticketPrinting->id]);

                // 🚀 Simulate print here
                $registration->update(['ticket_printed_status_id' => $ticketPrinted->id]);
            }

            Log::info('Scan + ticket print complete', [
                'ticket_number' => $ticketNumber,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Scanned → Ticket printed',
                'scan' => $scan,
                'registration' => $registration->fresh(),
            ], 200);

        } catch (\Exception $e) {
            if ($ticketFailed) {
                $registration->update(['ticket_printed_status_id' => $ticketFailed->id]);
            }
            Log::error('Ticket printing failed after scan', [
                'ticket_number' => $ticketNumber,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to print ticket after scan'], 500);
        }
    }
}