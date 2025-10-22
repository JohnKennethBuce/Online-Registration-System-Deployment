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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class RegistrationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['store']);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->validate(['per_page' => 'integer|min:10|max:500'])['per_page'] ?? 500;
        $registrations = Registration::with(['badgeStatus', 'ticketStatus'])->latest()->paginate($perPage);
        return response()->json($registrations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Personal Info
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'company_name' => 'required|string|max:255',
            'designation' => 'nullable|string|max:255',
    
            // Demographics
            'age_range' => ['nullable', Rule::in(['18-24', '25-34', '35-44', '45-54', '55-64', '65+'])],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Prefer not to say', 'Others'])],
            'gender_other' => 'nullable|string|max:255|required_if:gender,Others',
    
            // Survey Questions
            'industry_sector' => 'nullable|string|max:255',
            'industry_sector_other' => 'nullable|string|max:255',
            'reason_for_attending' => 'nullable|string|max:1000',
            'reason_for_attending_other' => 'nullable|string|max:1000',
            'specific_areas_of_interest' => 'nullable|string|max:1000',
            'specific_areas_of_interest_other' => 'nullable|string|max:1000',
            'how_did_you_learn_about' => 'nullable|string|max:1000',
            'how_did_you_learn_about_other' => 'nullable|string|max:1000',
    
            // System Info
            'registration_type' => ['required', Rule::in(['onsite', 'online', 'pre-registered', 'complimentary'])],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'complimentary'])],
        ]);

        $firstName = $validated['first_name'];
        $existing = Registration::all()->first(function ($registration) use ($firstName) {
            return strtolower($registration->first_name) === strtolower($firstName);
        });

        if ($existing) {
            return response()->json(['error' => 'A registration with this first name already exists.'], 409);
        }
    
        $emailHash = null;
        if (!empty($validated['email'])) {
            $emailHash = hash('sha256', strtolower(trim($validated['email'])));
            if (Registration::where('email_hash', $emailHash)->exists()) {
                return response()->json(['error' => 'This email address is already registered.'], 409);
            }
        }
    
        $serverMode = ServerMode::latest()->first();
        if (!$serverMode) {
            return response()->json(['error' => 'Server mode not configured.'], 500);
        }
    
        if (!in_array($validated['registration_type'], ['pre-registered', 'complimentary'])) {
            $allowedTypes = explode(',', str_replace('both', 'onsite,online', $serverMode->mode));
            if (!in_array($validated['registration_type'], $allowedTypes)) {
                return response()->json(['error' => 'Registration type not allowed in current mode'], 400);
            }
        }
    
        $badgeNotPrinted = PrintStatus::where('type', 'badge')->where('name', 'not_printed')->first();
        $ticketNotPrinted = PrintStatus::where('type', 'ticket')->where('name', 'not_printed')->first();
        if (!$badgeNotPrinted || !$ticketNotPrinted) {
            return response()->json(['error' => 'Print statuses not configured.'], 500);
        }
    
        $ticketNumber = 'TICKET-' . strtoupper(Str::random(12));
        $registration = Registration::create(array_merge($validated, [
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
        ]));
    
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

    /**
     * ✅ OPTIMIZED BATCH IMPORT - Handles hundreds of records efficiently
     */
    public function batchStore(Request $request): JsonResponse
    {
        // Validate the batch request
        $validated = $request->validate([
            'registrations' => 'required|array|min:1|max:1000',
            'registrations.*.first_name' => 'required|string|max:255',
            'registrations.*.last_name' => 'required|string|max:255',
            'registrations.*.email' => 'nullable|email|max:255',
            'registrations.*.phone' => 'nullable|string|max:20',
            'registrations.*.address' => 'nullable|string|max:255',
            'registrations.*.company_name' => 'nullable|string|max:255',
            'registrations.*.designation' => 'nullable|string|max:255',
            'registrations.*.age_range' => ['nullable', Rule::in(['18-24', '25-34', '35-44', '45-54', '55-64', '65+'])],
            'registrations.*.gender' => ['nullable', Rule::in(['Male', 'Female', 'Prefer not to say', 'Others'])],
            'registrations.*.gender_other' => 'nullable|string|max:255',
            'registrations.*.industry_sector' => 'nullable|string|max:255',
            'registrations.*.industry_sector_other' => 'nullable|string|max:255',
            'registrations.*.reason_for_attending' => 'nullable|string|max:1000',
            'registrations.*.reason_for_attending_other' => 'nullable|string|max:1000',
            'registrations.*.specific_areas_of_interest' => 'nullable|string|max:1000',
            'registrations.*.specific_areas_of_interest_other' => 'nullable|string|max:1000',
            'registrations.*.how_did_you_learn_about' => 'nullable|string|max:1000',
            'registrations.*.how_did_you_learn_about_other' => 'nullable|string|max:1000',
            'registrations.*.registration_type' => ['nullable', Rule::in(['onsite', 'online', 'pre-registered', 'complimentary'])],
            'registrations.*.payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'complimentary'])],
        ]);

        // Check permissions
        $successful = 0;
        $failed = 0;
        $errors = [];

        // Pre-load necessary data once
        $serverMode = ServerMode::latest()->first();
        if (!$serverMode) {
            return response()->json(['error' => 'Server mode not configured.'], 500);
        }

        $badgeNotPrinted = PrintStatus::where('type', 'badge')->where('name', 'not_printed')->first();
        $ticketNotPrinted = PrintStatus::where('type', 'ticket')->where('name', 'not_printed')->first();
        
        if (!$badgeNotPrinted || !$ticketNotPrinted) {
            return response()->json(['error' => 'Print statuses not configured.'], 500);
        }

        // ✅ PRE-LOAD ALL EXISTING REGISTRATIONS (for duplicate checking)
        // This is much faster than checking DB for each record
        $existingRegistrations = Registration::all();
        
        // Create lookup maps for faster duplicate detection
        $existingNames = $existingRegistrations->map(function($reg) {
            return strtolower(trim($reg->first_name)) . '|' . 
                   strtolower(trim($reg->last_name)) . '|' . 
                   strtolower(trim($reg->company_name ?? ''));
        })->toArray();

        $existingEmailHashes = $existingRegistrations
            ->pluck('email_hash')
            ->filter()
            ->toArray();

        // Process in transaction for data integrity
        DB::beginTransaction();

        try {
            // Process each registration
            foreach ($validated['registrations'] as $index => $data) {
                try {
                    $rowNum = $index + 1;

                    // Normalize data
                    $firstName = trim($data['first_name']);
                    $lastName = trim($data['last_name']);
                    $companyName = isset($data['company_name']) ? trim($data['company_name']) : '';
                    $registrationType = $data['registration_type'] ?? 'pre-registered';
                    $paymentStatus = $data['payment_status'] ?? 'unpaid';

                    // ✅ CHECK DUPLICATE BY NAME + COMPANY (in-memory)
                    $lookupKey = strtolower($firstName) . '|' . 
                                 strtolower($lastName) . '|' . 
                                 strtolower($companyName);
                    
                    if (in_array($lookupKey, $existingNames)) {
                        $errors[] = "Row {$rowNum}: Duplicate - {$firstName} {$lastName} ({$companyName}) already exists";
                        $failed++;
                        continue;
                    }

                    // ✅ CHECK DUPLICATE EMAIL (if provided)
                    $emailHash = null;
                    if (!empty($data['email'])) {
                        $emailHash = hash('sha256', strtolower(trim($data['email'])));
                        if (in_array($emailHash, $existingEmailHashes)) {
                            $errors[] = "Row {$rowNum}: Email {$data['email']} already registered";
                            $failed++;
                            continue;
                        }
                        // Add to existing list to prevent duplicates within the batch
                        $existingEmailHashes[] = $emailHash;
                    }

                    // Validate registration type against server mode
                    if (!in_array($registrationType, ['pre-registered', 'complimentary'])) {
                        $allowedTypes = explode(',', str_replace('both', 'onsite,online', $serverMode->mode));
                        if (!in_array($registrationType, $allowedTypes)) {
                            $errors[] = "Row {$rowNum}: Registration type '{$registrationType}' not allowed in current mode";
                            $failed++;
                            continue;
                        }
                    }

                    // Generate unique ticket number
                    $ticketNumber = 'TICKET-' . strtoupper(Str::random(12));

                    // Prepare registration data
                    $registrationData = [
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $data['email'] ?? null,
                        'email_hash' => $emailHash,
                        'phone' => $data['phone'] ?? null,
                        'address' => $data['address'] ?? null,
                        'company_name' => $companyName ?: null,
                        'designation' => $data['designation'] ?? null,
                        'age_range' => $data['age_range'] ?? null,
                        'gender' => $data['gender'] ?? null,
                        'gender_other' => $data['gender_other'] ?? null,
                        'industry_sector' => $data['industry_sector'] ?? null,
                        'industry_sector_other' => $data['industry_sector_other'] ?? null,
                        'reason_for_attending' => $data['reason_for_attending'] ?? null,
                        'reason_for_attending_other' => $data['reason_for_attending_other'] ?? null,
                        'specific_areas_of_interest' => $data['specific_areas_of_interest'] ?? null,
                        'specific_areas_of_interest_other' => $data['specific_areas_of_interest_other'] ?? null,
                        'how_did_you_learn_about' => $data['how_did_you_learn_about'] ?? null,
                        'how_did_you_learn_about_other' => $data['how_did_you_learn_about_other'] ?? null,
                        'registration_type' => $registrationType,
                        'payment_status' => $paymentStatus,
                        'server_mode' => $serverMode->mode,
                        'badge_printed_status_id' => $badgeNotPrinted->id,
                        'ticket_printed_status_id' => $ticketNotPrinted->id,
                        'ticket_number' => $ticketNumber,
                        'registered_by' => Auth::id(),
                    ];

                    // Create registration
                    $registration = Registration::create($registrationData);

                    // Add to existing names to prevent duplicates within the batch
                    $existingNames[] = $lookupKey;

                    // Queue QR code generation
                    GenerateQrCode::dispatch($registration);

                    $successful++;

                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Row {$rowNum}: {$e->getMessage()}";
                    Log::error('Batch import row error', [
                        'row' => $rowNum,
                        'error' => $e->getMessage(),
                        'data' => $data
                    ]);
                }
            }

            // Commit transaction if any were successful
            if ($successful > 0) {
                DB::commit();
                
                Log::info('Batch import completed', [
                    'successful' => $successful,
                    'failed' => $failed,
                    'total' => count($validated['registrations']),
                    'user_id' => Auth::id()
                ]);
            } else {
                DB::rollBack();
            }

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Batch import failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'error' => 'Batch import failed: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'successful' => $successful,
            'failed' => $failed,
            'errors' => $errors,
            'message' => "Imported {$successful} registrations successfully" . 
                        ($failed > 0 ? ", {$failed} failed" : "")
        ], 200);
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
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('registrations')->ignore($registration->id)],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'age_range' => ['nullable', Rule::in(['18-24', '25-34', '35-44', '45-54', '55-64', '65+'])],
            'gender' => ['nullable', Rule::in(['Male', 'Female', 'Prefer not to say', 'Others'])],
            'gender_other' => 'nullable|string|max:255|required_if:gender,Others',
            'industry_sector' => 'nullable|string|max:255',
            'industry_sector_other' => 'nullable|string|max:255',
            'reason_for_attending' => 'nullable|string|max:1000',
            'reason_for_attending_other' => 'nullable|string|max:1000',
            'specific_areas_of_interest' => 'nullable|string|max:1000',
            'specific_areas_of_interest_other' => 'nullable|string|max:1000',
            'how_did_you_learn_about' => 'nullable|string|max:1000',
            'how_did_you_learn_about_other' => 'nullable|string|max:1000',
            'registration_type' => ['required', Rule::in(['onsite', 'online', 'pre-registered', 'complimentary'])],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'paid', 'complimentary'])],
        ]);

        $firstName = $validated['first_name'];
        $lastName = $validated['last_name'];
        
        $existing = Registration::where('id', '!=', $registration->id)->get()
            ->first(function ($otherReg) use ($firstName, $lastName) {
                return strtolower($otherReg->first_name) === strtolower($firstName) &&
                       strtolower($otherReg->last_name) === strtolower($lastName);
            });

        if ($existing) {
            return response()->json(['error' => 'Another registration with this first and last name already exists.'], 409);
        }

        if ($registration->email !== $validated['email']) {
            $validated['email_hash'] = !empty($validated['email']) ? hash('sha256', strtolower(trim($validated['email']))) : null;
        }

        $registration->update($validated);

        return response()->json($registration->fresh(['badgeStatus', 'ticketStatus', 'registeredBy:id,name']));
    }

    public function updatePaymentStatus(Request $request, Registration $registration): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_status' => ['required', Rule::in(['paid', 'unpaid', 'complimentary'])]
            ]);
        
            $oldStatus = $registration->payment_status;
            $newStatus = $validated['payment_status'];
        
            $registration->update(['payment_status' => $newStatus]);
            
            Log::info('Payment status updated', [
                'registration_id' => $registration->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'user_id' => Auth::id()
            ]);
        
            return response()->json($registration->fresh(['badgeStatus', 'ticketStatus', 'registeredBy:id,name']));
        
        } catch (\Exception $e) {
            Log::error('Failed to update payment status', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage()
            ]);
        
            return response()->json(['error' => 'Could not update payment status'], 500);
        }
    }

    public function destroy(Registration $registration)
    {
        $registration->delete();
        return response()->json(null, 204);
    }

    // ... (Keep all your other methods: scan, printBadge, printTicket, scanAndPrintBadge, scanAndPrintTicket, verifyPreRegistration)
    // I'm omitting them here for brevity since they don't need changes
    
    public function scan(Request $request, ?string $ticket_number = null): JsonResponse
    {
        $ticket = $ticket_number ?: $request->input('ticket_number');
        if (!$ticket) {
            return response()->json(['error' => 'ticket_number is required'], 422);
        }
    
        $registration = Registration::where('ticket_number', $ticket)->firstOrFail();
        $currentMode = ServerMode::latest()->first()->mode ?? 'onsite';
    
        if ($registration->server_mode !== $currentMode && $currentMode !== 'both') {
            return response()->json(['error' => 'Scan not allowed in current mode'], 403);
        }
    
        $user = $request->user();
        $isSuperAdmin = $user->role->name === 'superadmin';
    
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
    
        $scan = Scan::create([
            'registration_id' => $registration->id,
            'scanned_by' => Auth::id(),
            'scanned_time' => now(),
            'badge_printed_status_id' => $badgeQueued->id,
            'ticket_printed_status_id' => $ticketQueued->id,
            'payment_status' => $registration->payment_status,
        ]);
    
        if (!$registration->confirmed) {
            $registration->update([
                'confirmed' => true,
                'confirmed_by' => Auth::id(),
                'confirmed_at' => now(),
            ]);
        }
    
        $badgeStatusId = $registration->badge_printed_status_id;
        if ($badgeStatusId === $badgeReprinted->id) {
            if (!$isSuperAdmin) {
                return response()->json(['error' => 'Badge already reprinted once. Reprint limit reached.'], 409);
            }
        } elseif ($badgeStatusId === $badgePrinted->id) {
            $registration->update(['badge_printed_status_id' => $badgeReprinted->id]);
        } else {
            $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
            $registration->update(['badge_printed_status_id' => $badgePrinting->id]);
            $registration->update(['badge_printed_status_id' => $badgePrinted->id]);
        }
    
        $ticketStatusId = $registration->ticket_printed_status_id;
        if ($ticketStatusId === $ticketReprinted->id) {
            if (!$isSuperAdmin) {
                // Optional: enforce limit
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
    
        $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
        Log::info('Badge print queued', ['ticket_number' => $ticketNumber]);
    
        try {
            $registration->update(['badge_printed_status_id' => $badgePrinting->id]);
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
    
        $registration->update(['ticket_printed_status_id' => $ticketQueued->id]);
        Log::info('Ticket print queued', ['ticket_number' => $ticketNumber]);
    
        try {
            $registration->update(['ticket_printed_status_id' => $ticketPrinting->id]);
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

        $scan = Scan::create([
            'registration_id' => $registration->id,
            'scanned_by' => Auth::id(),
            'scanned_time' => now(),
            'badge_printed_status_id' => $badgeQueued->id,
        ]);

        try {
            if ($registration->badge_printed_status_id == $badgePrinted->id) {
                $registration->update(['badge_printed_status_id' => $badgeReprinted->id]);
            } else {
                $registration->update(['badge_printed_status_id' => $badgeQueued->id]);
                $registration->update(['badge_printed_status_id' => $badgePrinting->id]);
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

        $scan = Scan::create([
            'registration_id' => $registration->id,
            'scanned_by' => Auth::id(),
            'scanned_time' => now(),
            'ticket_printed_status_id' => $ticketQueued->id,
        ]);

        try {
            if ($registration->ticket_printed_status_id == $ticketPrinted->id) {
                $registration->update(['ticket_printed_status_id' => $ticketReprinted->id]);
            } else {
                $registration->update(['ticket_printed_status_id' => $ticketQueued->id]);
                $registration->update(['ticket_printed_status_id' => $ticketPrinting->id]);
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

    public function verifyPreRegistration(string $code): JsonResponse
    {
        try {
            $registration = Registration::where('ticket_number', $code)
                ->where('registration_type', 'pre-registered')
                ->first();
            
            if (!$registration) {
                return response()->json([
                    'valid' => false,
                    'error' => 'Invalid or non-existent pre-registration code'
                ], 404);
            }
            
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
                'address' => $registration->address,
                'company_name' => $registration->company_name,
                'designation' => $registration->designation,
                'age_range' => $registration->age_range,
                'gender' => $registration->gender,
                'gender_other' => $registration->gender_other,
                'industry_sector' => $registration->industry_sector,
                'industry_sector_other' => $registration->industry_sector_other,
                'reason_for_attending' => $registration->reason_for_attending,
                'reason_for_attending_other' => $registration->reason_for_attending_other,
                'specific_areas_of_interest' => $registration->specific_areas_of_interest,
                'specific_areas_of_interest_other' => $registration->specific_areas_of_interest_other,
                'how_did_you_learn_about' => $registration->how_did_you_learn_about,
                'how_did_you_learn_about_other' => $registration->how_did_you_learn_about_other,
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