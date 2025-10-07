<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Models\Setting;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class BadgeController extends Controller
{
    /**
     * Fetch a registration and render their badge as a PDF.
     */
    public function show($ticketNumber, Request $request)
    {
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();
        
        // Fetch all settings from the database
        $settings = Setting::pluck('value', 'key');

        // Check for a URL parameter to decide if the QR code should be shown
        $showQr = $request->query('show_qr', 'true') === 'true';

        $data = [
            'registration' => $registration,
            'settings'     => $settings,
            'showQr'       => $showQr,
        ];

        $pdf = Pdf::loadView('pdfs.badge', $data);

        // Set paper size based on your spec (9x6.5 cm) and stream to browser
        return $pdf->setPaper([0, 0, 184.25, 255.12], 'landscape')
                   ->stream('badge-' . $ticketNumber . '.pdf');
    }
}