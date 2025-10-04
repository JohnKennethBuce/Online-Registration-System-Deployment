<?php

namespace App\Jobs;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

class GenerateQrCode implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public Registration $registration)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $ticketNumber = $this->registration->ticket_number;
            $qrCodePath = 'qrcodes/' . $ticketNumber . '.png';
            
            // Note: route() may not work in a CLI job without setting the root URL.
            // A more robust way is to build the URL from the config.
            $qrContent = config('app.url') . '/api/registrations/' . $ticketNumber;

            $options = new QROptions([
                'outputType'  => QRCode::OUTPUT_IMAGE_PNG,
                'eccLevel'    => QRCode::ECC_H,
                'scale'       => 6,
                'imageBase64' => false,
            ]);
            
            if (!Storage::disk('public')->exists('qrcodes')) {
                Storage::disk('public')->makeDirectory('qrcodes');
            }
            
            (new QRCode($options))->render($qrContent, Storage::disk('public')->path($qrCodePath));
            
            // Update registration with QR path
            $this->registration->update([
                'qr_code_path' => $qrCodePath,
            ]);

            Log::info('QR Code generated successfully for ticket: ' . $ticketNumber);

            // You can also dispatch an email sending job from here
            // SendRegistrationEmail::dispatch($this->registration);

        } catch (\Exception $e) {
            Log::error('Failed to generate QR code for ticket: ' . $this->registration->ticket_number, [
                'error' => $e->getMessage()
            ]);
        }
    }
}