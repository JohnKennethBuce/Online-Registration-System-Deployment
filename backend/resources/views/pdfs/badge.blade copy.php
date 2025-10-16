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
        @page {
            /* This is the key: set the exact size and orientation. */
            size: 90mm 65mm;
            margin: 0;
        }
        body { font-family: sans-serif; margin: 0; padding: 0; }
        .badge {
            width: 100%;
            height: 100%;
            padding: 15px;
            box-sizing: border-box;
            position: relative;
            text-align: center;
        }
        .header-table { width: 100%; border-spacing: 0; margin-bottom: 10px; }
        .header-logo-cell { width: 90px; vertical-align: middle; }
        .header-text-cell { vertical-align: middle; text-align: left; }
        .main-logo { max-width: 80px; max-height: 40px; }
        .location-text { font-size: 10px; margin: 0; line-height: 1.2; }
        .registrant-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            white-space: nowrap;
        }
        .company-name {
            font-size: 14px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-top: 2px;
            margin-bottom: 5px;
            min-height: 16px;
        }
        .event-day { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .main-content {
            position: absolute;
            top: 65px; /* Position content below header */
            left: 15px;
            width: calc(100% - 110px); /* Leave space for QR code */
            text-align: center;
        }
        .qr-code {
            position: absolute;
            top: 110px;
            right: 15px;
            width: 70px;
            height: 70px;
        }
        .footer {
            position: absolute;
            bottom: 10px;
            width: calc(100% - 30px);
            left: 15px;
            font-size: 8px;
        }
        .footer-table { width: 100%; border-spacing: 0; }
        .footer-item { text-align: left; vertical-align: bottom; }
        .footer-item img { max-height: 15px; max-width: 60px; }
    </style>
</head>
<body>
    <div class="badge">
        <table class="header-table">
            <tr>
                <td class="header-logo-cell">
                    @php
                        $mainLogo = $settings['main_logo_path'] ?? null;
                        $mainLogoUrl = $mainLogo ? asset('storage/' . ltrim(str_replace('\\', '/', $mainLogo), '/')) : null;
                    @endphp
                    @if($mainLogoUrl)
                        <img src="{{ $mainLogoUrl }}" alt="Logo" class="main-logo">
                    @endif
                </td>
                <td class="header-text-cell">
                    <p class="location-text">
                        {!! nl2br(e($settings['event_location'] ?? 'Event Location')) !!}<br>
                        {{ $settings['event_datetime'] ?? 'Event Date & Time' }}
                    </p>
                </td>
            </tr>
        </table>

        <div class="main-content">
            <p class="registrant-name">{{ $registration->first_name }} {{ $registration->last_name }}</p>
            <p class="company-name">{{ $registration->company_name ?? 'N/A' }}</p>
            <p class="event-day">{{ $settings['event_name'] ?? 'EVENT DAY' }}</p>
        </div>

        @if($showQr && $registration->qr_code_path)
            @php
                $qrPath = asset('storage/' . ltrim(str_replace('\\', '/', $registration->qr_code_path), '/'));
            @endphp
            <img src="{{ $qrPath }}" alt="QR Code" class="qr-code">
        @endif
        
        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-item">
                        <strong>Organized By:</strong><br>
                        @php
                            $orgLogo = $settings['organizer_logo_path'] ?? null;
                            $orgLogoUrl = $orgLogo ? asset('storage/' . ltrim(str_replace('\\', '/', $orgLogo), '/')) : null;
                        @endphp
                        @if($orgLogoUrl)
                            <img src="{{ $orgLogoUrl }}" alt="Organizer">
                        @endif
                    </td>
                    <td class="footer-item">
                        <strong>Event Manager:</strong><br>
                        @php
                            $mgrLogo = $settings['manager_logo_path'] ?? null;
                            $mgrLogoUrl = $mgrLogo ? asset('storage/' . ltrim(str_replace('\\', '/', $mgrLogo), '/')) : null;
                        @endphp
                        @if($mgrLogoUrl)
                            <img src="{{ $mgrLogoUrl }}" alt="Manager">
                        @endif
                    </td>
                    <td class="footer-item">
                        <strong>Registration:</strong><br>
                        @php
                            $regLogo = $settings['registration_logo_path'] ?? null;
                            $regLogoUrl = $regLogo ? asset('storage/' . ltrim(str_replace('\\', '/', $regLogo), '/')) : null;
                        @endphp
                        @if($regLogoUrl)
                            <img src="{{ $regLogoUrl }}" alt="Registration">
                        @endif
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>