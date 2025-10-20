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
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Crypt;
use App\Jobs\GenerateQrCode;
use Illuminate\Validation\Rule;

class RegistrationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['store']);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->validate(['per_page' => 'integer|min:10|max:100'])['per_page'] ?? 50;
        $registrations = Registration::with(['badgeStatus', 'ticketStatus'])->latest()->paginate($perPage);
        return response()->json($registrations);
    }

    public function store(Request $request): JsonResponse
    {
        // 🎨 UPDATED: Removed the incorrect 'unique' validation rules for encrypted name fields.
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255', // The email_hash check below handles uniqueness.
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255', // 'required' is not needed with 'nullable'.
            'registration_type' => 'required|in:onsite,online,pre-registered',
            'payment_status' => 'nullable|in:unpaid,paid',
        ]);

        // ✅ NEW: Manual uniqueness check for the full name combination.
        // This is required because the database cannot enforce uniqueness on encrypted columns.
        // ⚠️ WARNING: On very large datasets (10,000+), this could become slow as it decrypts names in memory.
        $firstName = $validated['first_name'];
        $lastName = $validated['last_name'];
        $existing = Registration::all()->first(function ($registration) use ($firstName, $lastName) {
            // Use accessors to compare decrypted values case-insensitively.
            return strtolower($registration->first_name) === strtolower($firstName) &&
                   strtolower($registration->last_name) === strtolower($lastName);
        });

        if ($existing) {
            return response()->json(['error' => 'A registration with this first and last name already exists.'], 409); // 409 Conflict
        }
    
        // Check for duplicate email hash
        $emailHash = null;
        if (!empty($validated['email'])) {
            $emailHash = hash('sha256', strtolower(trim($validated['email'])));
            if (Registration::where('email_hash', $emailHash)->exists()) {
                return response()->json(['error' => 'This email address is already registered.'], 409);
            }
        }
    
        // Get current server mode (needed for registration record)
        $serverMode = ServerMode::latest()->first();
        if (!$serverMode) {
            return response()->json(['error' => 'Server mode not configured.'], 500);
        }
    
        // ServerMode validation
        if ($validated['registration_type'] !== 'pre-registered') {
            $allowedTypes = explode(',', str_replace('both', 'onsite,online', $serverMode->mode));
            if (!in_array($validated['registration_type'], $allowedTypes)) {
                return response()->json(['error' => 'Registration type not allowed in current mode'], 400);
            }
        }
    
        // PrintStatus setup
        $badgeNotPrinted = PrintStatus::where('type', 'badge')->where('name', 'not_printed')->first();
        $ticketNotPrinted = PrintStatus::where('type', 'ticket')->where('name', 'not_printed')->first();
        if (!$badgeNotPrinted || !$ticketNotPrinted) {
            return response()->json(['error' => 'Print statuses not configured.'], 500);
        }
    
        // Create Registration
        $ticketNumber = 'TICKET-' . strtoupper(Str::random(12));
        $registration = Registration::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'email_hash' => $emailHash,
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'company_name' => $validated['company_name'],
            'registration_type' => $validated['registration_type'],
            'server_mode' => $serverMode->mode,
            'badge_printed_status_id' => $badgeNotPrinted->id,
            'ticket_printed_status_id' => $ticketNotPrinted->id,
            'ticket_number' => $ticketNumber,
            'registered_by' => Auth::id(),
            'payment_status' => $validated['payment_status'] ?? 'unpaid',
        ]);
    
        // Dispatch QR code generation job
        (new GenerateQrCode($registration))->handle();
    
        Log::info('Registration created and QR job dispatched', [
            'ticket_number' => $ticketNumber, 'user_id' => Auth::id(), 'mode' => $serverMode->mode, 'type' => $validated['registration_type']
        ]);
        
        $fresh = $registration->fresh(['badgeStatus', 'ticketStatus', 'registeredBy:id,name']);
        
        $qrUrl = $fresh->qr_code_path ? asset('storage/' . ltrim(str_replace('\\', '/', $fresh->qr_code_path), '/')) : null;
        
        return response()->json([
            'message' => 'Registration successful. The QR code will be generated shortly.',
            'registration' => array_merge($fresh->toArray(), ['qr_url' => $qrUrl,]),
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

    public function update(Request $request, Registration $registration)
    {
        // 🎨 UPDATED: Removed incorrect 'unique' validation and 'payment_status'.
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('registrations')->ignore($registration->id)],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'registration_type' => 'required|in:onsite,online,pre-registered',
        ]);

        // ✅ NEW: Manual uniqueness check for the full name combination on update.
        $firstName = $validated['first_name'];
        $lastName = $validated['last_name'];
        
        // Find any OTHER registration with the same full name.
        $existing = Registration::where('id', '!=', $registration->id)->get()
            ->first(function ($otherReg) use ($firstName, $lastName) {
                return strtolower($otherReg->first_name) === strtolower($firstName) &&
                       strtolower($otherReg->last_name) === strtolower($lastName);
            });

        if ($existing) {
            return response()->json(['error' => 'Another registration with this first and last name already exists.'], 409);
        }

        // Update the email_hash if the email has changed
        if ($registration->email !== $validated['email']) {
            $validated['email_hash'] = !empty($validated['email']) ? hash('sha256', strtolower(trim($validated['email']))) : null;
        }

        // The model's accessors/mutators will handle encryption automatically
        $registration->update($validated);

        return response()->json($registration->fresh(['badgeStatus', 'ticketStatus', 'registeredBy:id,name']));
    }

    /**
     * Toggles the payment status of a registration.
     */
    public function togglePaymentStatus(Registration $registration): JsonResponse
    {
        try {
            $newStatus = $registration->payment_status === 'paid' ? 'unpaid' : 'paid';

            $registration->update(['payment_status' => $newStatus]);
            
            Log::info('Payment status toggled', [
                'registration_id' => $registration->id,
                'new_status' => $newStatus,
                'user_id' => Auth::id()
            ]);

            // Return the entire fresh model so the frontend can update its state
            return response()->json($registration->fresh(['badgeStatus', 'ticketStatus', 'registeredBy:id,name']));

        } catch (\Exception $e) {
            Log::error('Failed to toggle payment status', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Could not update payment status'], 500);
        }
    }

    /**
     * Delete a registration.
     */
        public function destroy(Registration $registration)
            {
                $registration->delete();
            
                return response()->json(null, 204); // 204 No Content success response
            }
    public function scan(Request $request, ?string $ticket_number = null): JsonResponse
        {
            // Accept from route param or request body
            $ticket = $ticket_number ?: $request->input('ticket_number');
            if (!$ticket) {
                return response()->json(['error' => 'ticket_number is required'], 422);
            }
        
            $registration = Registration::where('ticket_number', $ticket)->firstOrFail();
            $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';
        
            if ($registration->server_mode !== $currentMode && $currentMode !== 'both') {
                return response()->json(['error' => 'Scan not allowed in current mode'], 403);
            }
        
            // ✅ RE-INTRODUCE THIS SPECIFIC CHECK for the unlimited reprint permission
            $user = $request->user();
            $isSuperAdmin = $user->role->name === 'superadmin';
        
            // --- Statuses ---
            $badgeQueued     = PrintStatus::where('type', 'badge')->where('name', 'queued')->first();
            $badgePrinting   = PrintStatus::where('type', 'badge')->where('name', 'printing')->first();
            $badgePrinted    = PrintStatus::where('type', 'badge')->where('name', 'printed')->first();
            $badgeReprinted  = PrintStatus::where('type', 'badge')->where('name', 'reprinted')->first();
        
            $ticketQueued    = PrintStatus::where('type', 'ticket')->where('name', 'queued')->first();
            $ticketPrinting  = PrintStatus::where('type', 'ticket')->where('name', 'printing')->first();
            $ticketPrinted   = PrintStatus::where('type', 'ticket')->where('name', 'printed')->first();
            $ticketReprinted = PrintStatus::where('type', 'ticket')->where('name', 'reprinted')->first();
        
            if (!$badgeQueued || !$badgePrinting || !$badgePrinted || !$badgeReprinted ||
                !$ticketQueued || !$ticketPrinting || !$ticketPrinted || !$ticketReprinted) {
                return response()->json(['error' => 'Print statuses not configured'], 400);
            }
        
            // --- Create scan log ---
            $scan = Scan::create([
                'registration_id' => $registration->id,
                'scanned_by' => Auth::id(),
                'scanned_time' => now(),
                'badge_printed_status_id' => $badgeQueued->id,
                'ticket_printed_status_id' => $ticketQueued->id,
                'payment_status' => $registration->payment_status,
            ]);
        
            // --- Auto confirm if not already ---
            if (!$registration->confirmed) {
                $registration->update([
                    'confirmed' => true,
                    'confirmed_by' => Auth::id(),
                    'confirmed_at' => now(),
                ]);
            }
        
            // --- Badge flow with one-time reprint limit (superadmin bypass) ---
            $badgeStatusId = $registration->badge_printed_status_id;
            if ($badgeStatusId === $badgeReprinted->id) {
            
                // ✅ THE FIX: The reprint limit is bypassed ONLY if the user is a superadmin.
                // This will now correctly block an Admin user who tries to reprint more than once.
                if (!$isSuperAdmin) {
                    return response()->json(['error' => 'Badge already reprinted once. Reprint limit reached.'], 409);
                }
                // Superadmin can proceed without status change.
            
            } elseif ($badgeStatusId === $badgePrinted->id) {
                // printed → reprinted (This is the first and ONLY reprint for a normal Admin)
                $registration->update(['badge_printed_status_id' => $badgeReprinted->id]);
            } else {
                // not_printed (or other) → queue → printing → printed
                $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
                $registration->update(['badge_printed_status_id' => $badgePrinting->id]);
                $registration->update(['badge_printed_status_id' => $badgePrinted->id]);
            }
        
            // --- Ticket flow (apply same specific logic) ---
            $ticketStatusId = $registration->ticket_printed_status_id;
            if ($ticketStatusId === $ticketReprinted->id) {
                if (!$isSuperAdmin) {
                    // Optional: enforce same limit for tickets if desired
                    // return response()->json(['error' => 'Ticket already reprinted once.'], 409);
                }
            } elseif ($ticketStatusId === $ticketPrinted->id) {
                $registration->update(['ticket_printed_status_id' => $ticketReprinted->id]);
            } else {
                $registration->update(['ticket_printed_status_id' => $ticketQueued->id]);
                $registration->update(['ticket_printed_status_id' => $ticketPrinting->id]);
                $registration->update(['ticket_printed_status_id' => $ticketPrinted->id]);
            }
        
            Log::info('Registration scanned; statuses updated', [
                'ticket_number' => $ticket,
                'user_id' => Auth::id(),
                'mode' => $currentMode,
                'is_superadmin_reprint' => $isSuperAdmin,
            ]);
        
            return response()->json([
                'message' => 'Scanned. Print statuses updated (printed/reprinted).',
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

            /**
         * Verify pre-registration by ticket number
         * Used to auto-fill form for pre-registered attendees
         */
        public function verifyPreRegistration(string $code): JsonResponse
        {
            try {
                // Look up by ticket_number (since that's your unique identifier)
                $registration = Registration::where('ticket_number', $code)
                    ->where('registration_type', 'pre-registered')
                    ->first();
                
                if (!$registration) {
                    return response()->json([
                        'valid' => false,
                        'error' => 'Invalid or non-existent pre-registration code'
                    ], 404);
                }
                
                // Check if already confirmed/checked-in
                if ($registration->confirmed) {
                    return response()->json([
                        'valid' => true,
                        'already_confirmed' => true,
                        'message' => 'This registration has already been checked in',
                        'confirmed_at' => $registration->confirmed_at,
                        'first_name' => $registration->first_name,
                        'last_name' => $registration->last_name,
                    ], 200);
                }
                
                Log::info('Pre-registration verified', [
                    'ticket_number' => $code,
                    'registration_id' => $registration->id
                ]);
                
                return response()->json([
                    'valid' => true,
                    'already_confirmed' => false,
                    'first_name' => $registration->first_name,
                    'last_name' => $registration->last_name,
                    'email' => $registration->email,
                    'phone' => $registration->phone,
                    'company_name' => $registration->company_name,
                    'payment_status' => $registration->payment_status,
                    'ticket_number' => $registration->ticket_number,
                ], 200);
                
            } catch (\Exception $e) {
                Log::error('Pre-registration verification error', [
                    'code' => $code,
                    'error' => $e->getMessage()
                ]);
                
                return response()->json([
                    'valid' => false,
                    'error' => 'Verification failed. Please try again.'
                ], 500);
            }
        }
    
}