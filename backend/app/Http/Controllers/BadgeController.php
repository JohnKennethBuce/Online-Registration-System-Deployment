<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use Barryvdh\DomPDF\Facade\Pdf; // <-- Import the PDF facade

class BadgeController extends Controller
{
    /**
     * Fetch a registration and render their badge as a PDF.
     */
    public function show($ticketNumber)
    {
        $registration = Registration::where('ticket_number', $ticketNumber)->firstOrFail();

        // Pass the registration data to our new Blade view
        $pdf = Pdf::loadView('pdfs.badge', ['registration' => $registration]);

        // Set paper size based on your spec (9x6.5 cm) and stream to browser
        return $pdf->setPaper([0, 0, 184.25, 255.12], 'landscape') // 6.5cm x 9cm in points
                   ->stream('badge-' . $ticketNumber . '.pdf');
    }
}