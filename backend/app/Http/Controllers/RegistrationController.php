<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Models\PrintStatus;
use App\Models\ServerMode;
use App\Models\Scan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator; // ✅ add this
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\Log;

class RegistrationController extends Controller
{
    public function index()
    {
        $registrations = Registration::all();
        $registrations = Registration::with(['badgeStatus','ticketStatus'])->get();
        return response()->json([
            'message' => 'Registrations retrieved successfully',
            'registrations' => $registrations,
        ]);
    }
    
    public function store(Request $request)
    {
        // ✅ now call the imported names directly (no backslash)
        $validator = Validator::make($request->all(), [
            'first_name'        => 'required|string|max:255',
            'last_name'         => 'required|string|max:255',
            'email'             => 'required|email|max:255',
            'phone'             => 'nullable|string|max:20',
            'address'           => 'nullable|string|max:255',
            'registration_type' => 'required|in:onsite,online,pre-registered',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error'   => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // manual uniqueness check
        $duplicate = Registration::get()->contains(fn($r) => $r->email === $validated['email']);
        if ($duplicate) {
            return response()->json([
                'error' => 'This email address is already registered.'
            ], 422);
        }

        $serverMode = ServerMode::latest()->first();
        if (!$serverMode) {
            return response()->json(['error' => 'No server mode Configured'], 400);
        }

        $badgeNotPrinted  = PrintStatus::where('type', 'badge')
                            ->where('name', 'not_printed')->where('active', 1)->first();
        $ticketNotPrinted = PrintStatus::where('type', 'ticket')
                            ->where('name', 'not_printed')->where('active', 1)->first();

        if (!$badgeNotPrinted || !$ticketNotPrinted) {
            return response()->json(['error' => 'Print statuses not configured'], 400);
        }

        $ticketNumber = (string) Str::uuid(); // ✅ uses imported Str

        $data = [
            'first_name'              => $validated['first_name'],
            'last_name'               => $validated['last_name'],
            'email'                   => $validated['email'],
            'phone'                   => $validated['phone'] ?? null,
            'address'                 => $validated['address'] ?? null,
            'registration_type'       => $validated['registration_type'],
            'server_mode'             => $serverMode->mode,
            'badge_printed_status_id' => $badgeNotPrinted->id,
            'ticket_printed_status_id'=> $ticketNotPrinted->id,
            'ticket_number'           => $ticketNumber,
            'confirmed'               => 0,
            'registered_by'           => Auth::id(), // ✅ uses imported Auth
        ];

        $qrCodePath    = 'qrcodes/'.$ticketNumber.'.png';
        $qrCodeContent = $ticketNumber;

        $options = new QROptions([
            'version'    => 5,
            'outputType' => QRCode::OUTPUT_IMAGE_PNG,
            'eccLevel'   => QRCode::ECC_H,
            'scale'      => 6,
            'imageBase64'=> false,
        ]);

        $fullPath = storage_path('app/public/'.$qrCodePath);
        if (!is_dir(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        (new QRCode($options))->render($qrCodeContent, $fullPath);
        $data['qr_code_path'] = $qrCodePath;

        $registration = Registration::create($data);

        return response()->json([
            'message'      => 'Registration successful',
            'registration' => $registration,
        ], 201);
    }

    public function show($ticketNumber)
    {
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();
        return response()->json([
            'message' => 'Registration retrieved successfully',
            'registration' => $registration,
        ]);
    }

    public function scan(Request $request)
    {
        // validate input
        $validated = $request->validate([
            'ticket_number' => 'required|string|exists:registrations,ticket_number',
        ]);

        // find the registration
        $registration = Registration::where('ticket_number', $validated['ticket_number'])->firstOrFail();

        // Get 'not_printed' status for badge and ticket
        $badgeNotPrinted = PrintStatus::where('type', 'badge')
                            ->where('name', 'not_printed')->where('active', 1)->first();
        $ticketNotPrinted = PrintStatus::where('type', 'ticket')
                            ->where('name', 'not_printed')->where('active', 1)->first();
        // conditional statements
        if (!$badgeNotPrinted || !$ticketNotPrinted) {
            return response()->json(['error' => 'Print statuses not configured'], 400);
        }

        // log the scan
        $scan = Scan::create([
            'registration_id'        => $registration->id,
            'scanned_by'             => Auth::id(),
            'scanned_time'           => now(),
            'badge_printed_status_id'=> $badgeNotPrinted->id,
            'ticket_printed_status_id'=> $ticketNotPrinted->id,
        ]);

        // Update registration (mark as confirmed if not already)
        if (!$registration->confirmed)  
        {
            $registration->update
            ([
                'confirmed' => 1,
                'confirmed_by' => Auth::id(),
                'confirmed_at' => now(),
            ]);
        }

        return response()->json
            ([
                'message' => 'QR code scanned successfully',
                'scan' => $scan,
                'registration' => $registration->fresh(), // return updated registration
            ]);
    }

    public function printBadge($ticketNumber)
    {
        // find the registration
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();

        // get 'printed' status for badge
        $badgePrinted = PrintStatus::where('type', 'badge')->where('name', 'printed')->where('active', 1)->first();
        if (!$badgePrinted)
        {
            return response()->json(['error' => 'Badge printed status not configured'], 400);
        }

        // update the registration
        $registration->update([
            'badge_printed_status_id' => $badgePrinted->id,
        ]);

        return response()->json([
            'message' => 'Badge marked as printed',
            'registration' => $registration->fresh(),
        ]);

    }

    public function printTicket($ticketNumber)
    {
        // find the registration
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();

        // get 'printed' status for ticket
        $ticketPrinted = PrintStatus::where('type', 'ticket')->where('name', 'printed')->where('active', 1)->first();
        if (!$ticketPrinted)
        {
            return response()->json(['error' => 'ticket printed status not configured'], 400);
        }

        // update the registration
        $registration->update([
            'ticket_printed_status_id' => $ticketPrinted->id,
        ]);

        return response()->json([
            'message' => 'ticket marked as printed',
            'registration' => $registration->fresh(),
        ]);
    }
}
