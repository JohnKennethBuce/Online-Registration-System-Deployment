<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Badge - {{ $registration->ticket_number ?? 'Preview' }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />

    <script>
        // Auto-print when ?print=true
        const params = new URLSearchParams(window.location.search);
        if (params.has('print')) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }, 300);
            });
        }
    </script>

    <style>
        /* ✅ Paper size tuned for Koohii 1125z - 90x65mm (borderless) */
        @page {
            size: 90mm 65mm;
            margin: 0;
        }

        html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #1b1b18;
            font-family: "Instrument Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            -webkit-print-color-adjust: exact;
        }

        .badge {
            width: 100%;
            height: 100%;
            padding: 12px 14px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
        }

        /* Header section */
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 4px;
        }

        .main-logo {
            max-width: 70px;
            max-height: 35px;
            object-fit: contain;
        }

        .event-info {
            text-align: left;
            font-size: 9px;
            line-height: 1.3;
        }

        /* Main content */
        .main-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .name {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 3px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }

        .company {
            font-size: 13px;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            margin: 0 0 5px 0;
            min-height: 15px;
            width: 100%;
            text-align: center;
        }

        .event-name {
            font-size: 14px;
            font-weight: 700;
            margin: 2px 0 5px 0;
        }

        .qr {
            width: 70px;
            height: 70px;
            object-fit: contain;
        }

        /* Footer */
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
            font-size: 7px;
            line-height: 1.2;
        }

        .footer-cell {
            text-align: left;
            width: 33%;
        }

        .footer-cell img {
            max-height: 14px;
            max-width: 55px;
            object-fit: contain;
        }

        @media print {
            html, body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>
@php
use Illuminate\Support\Facades\Storage;

$normalizePath = function ($path) {
    if (!$path) return null;
    if (preg_match('#^https?://#i', $path)) return $path;

    $clean = ltrim(str_replace('\\', '/', $path), '/');
    $clean = preg_replace('#^storage/#i', '', $clean);

    if (file_exists(storage_path("app/public/{$clean}"))) {
        return asset("storage/{$clean}");
    }
    if (file_exists(public_path("storage/{$clean}"))) {
        return asset("storage/{$clean}");
    }
    return asset('storage/logos/default_logo.png');
};

$mainLogo = $normalizePath($settings['main_logo_path'] ?? null);
$orgLogo  = $normalizePath($settings['organizer_logo_path'] ?? null);
$mgrLogo  = $normalizePath($settings['manager_logo_path'] ?? null);
$regLogo  = $normalizePath($settings['registration_logo_path'] ?? null);
$qrUrl    = $registration->qr_code_path ? $normalizePath($registration->qr_code_path) : null;

$eventName     = $settings['event_name'] ?? 'EVENT NAME';
$eventLocation = $settings['event_location'] ?? 'Event Location';
$eventDateTime = $settings['event_datetime'] ?? 'Event Date & Time';
$first         = $registration->first_name ?? '';
$last          = $registration->last_name ?? '';
$company       = $registration->company_name ?? 'N/A';
$showQr        = !empty($registration->qr_code_path);
@endphp

<div class="badge">
    <!-- HEADER -->
    <div class="header">
        @if ($mainLogo)
            <img src="{{ $mainLogo }}" alt="Main Logo" class="main-logo">
        @endif
        <div class="event-info">
            {!! nl2br(e($eventLocation)) !!}<br>
            {{ $eventDateTime }}
        </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="main-content">
        <div class="name" title="{{ $first }} {{ $last }}">{{ $first }} {{ $last }}</div>
        <div class="company" title="{{ $company }}">{{ $company ?: 'N/A' }}</div>
        <div class="event-name">{{ $eventName }}</div>
        @if ($showQr && $qrUrl)
            <img src="{{ $qrUrl }}" alt="QR Code" class="qr">
        @endif
    </div>

    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-cell">
            <strong>Organized By:</strong><br>
            @if ($orgLogo)
                <img src="{{ $orgLogo }}" alt="Organizer Logo">
            @endif
        </div>
        <div class="footer-cell">
            <strong>Event Manager:</strong><br>
            @if ($mgrLogo)
                <img src="{{ $mgrLogo }}" alt="Manager Logo">
            @endif
        </div>
        <div class="footer-cell">
            <strong>Registration:</strong><br>
            @if ($regLogo)
                <img src="{{ $regLogo }}" alt="Registration Logo">
            @endif
        </div>
    </div>
</div>
</body>
</html>
