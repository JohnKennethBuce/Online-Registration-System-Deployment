<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <script>
        // If the 'print' URL parameter is present, open the browser's print dialog on load
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('print')) {
            window.onload = () => window.print();
        }
    </script>
    <style>
        @page { margin: 0; }
        body { font-family: sans-serif; margin: 0; padding: 0; }
        .badge {
            width: 9cm;
            height: 6.5cm;
            padding: 15px;
            box-sizing: border-box;
            position: relative;
            text-align: center;
        }
        .main-logo { max-width: 80px; max-height: 40px; margin-bottom: 5px; }
        .location { font-size: 10px; margin: 0; line-height: 1.2; }
        .registrant-name {
            font-size: 24px;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 2px;
            white-space: nowrap;
        }
        .company-name {
            font-size: 14px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-bottom: 5px;
            min-height: 16px; /* Ensures the line is drawn even if company is blank */
        }
        .event-day { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .qr-code {
            width: 70px;
            height: 70px;
            margin: 0 auto; /* Center the QR code if it's the main element */
        }
        .footer {
            position: absolute;
            bottom: 10px;
            width: 100%;
            left: 0;
            padding: 0 15px;
            box-sizing: border-box;
        }
        .footer-logos { display: inline-block; width: 100%; font-size: 8px; }
        .footer-logos .logo-item {
            display: inline-block;
            vertical-align: middle;
            margin-right: 20px;
        }
        .footer-logos img { max-height: 15px; max-width: 60px; }
    </style>
</head>
<body>
    <div class="badge">
        <img src="{{ public_path('storage/' . ($settings['main_logo_path'] ?? '')) }}" alt="Logo" class="main-logo">
        <p class="location">
            {!! nl2br(e($settings['event_location'] ?? 'Event Location')) !!}<br>
            {{ $settings['event_datetime'] ?? 'Event Date & Time' }}
        </p>

        <p class="registrant-name">{{ $registration->first_name }} {{ $registration->last_name }}</p>
        <p class="company-name">{{ $registration->company_name ?? 'N/A' }}</p>
        <p class="event-day">{{ $settings['event_name'] ?? 'EVENT DAY' }}</p>

        {{-- This section will only display if the $showQr variable is true --}}
        @if($showQr && $registration->qr_code_path)
            <img src="{{ storage_path('app/public/' . $registration->qr_code_path) }}" alt="QR Code" class="qr-code">
        @endif
        
        <div class="footer">
            <div class="footer-logos">
                <div class="logo-item">
                    <strong>Organized By:</strong><br>
                    <img src="{{ public_path('storage/' . ($settings['organizer_logo_path'] ?? '')) }}" alt="Organizer">
                </div>
                <div class="logo-item">
                    <strong>Event Manager:</strong><br>
                    <img src="{{ public_path('storage/' . ($settings['manager_logo_path'] ?? '')) }}" alt="Manager">
                </div>
                <div class="logo-item">
                    <strong>Registration:</strong><br>
                    <img src="{{ public_path('storage/' . ($settings['registration_logo_path'] ?? '')) }}" alt="Registration">
                </div>
            </div>
        </div>
    </div>
</body>
</html>