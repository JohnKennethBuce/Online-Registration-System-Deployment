<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page { margin: 0; }
        body { font-family: sans-serif; margin: 0; }
        .badge {
            width: 9cm;
            height: 6.5cm;
            border: 1px solid #ccc;
            padding: 15px;
            box-sizing: border-box;
            position: relative;
        }
        .header { text-align: center; }
        .main-logo { max-width: 100px; max-height: 40px; margin-bottom: 5px; }
        .location { font-size: 10px; margin: 0; }
        .registrant-name {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 2px;
        }
        .company-name {
            font-size: 14px;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-bottom: 5px;
        }
        .event-day { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 5px; }
        .qr-code {
            position: absolute;
            top: 110px;
            right: 25px;
            width: 70px;
            height: 70px;
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
        <div class="header">
            <img src="{{ public_path('storage/logos/main_logo.png') }}" alt="Main Logo" class="main-logo">
            <p class="location">
                {{-- These will be configurable settings later --}}
                World Trade Center, Manila<br>
                October 24-26, 2025 | 10:00 am - 6:00 pm
            </p>
        </div>

        <p class="registrant-name">{{ $registration->first_name }} {{ $registration->last_name }}</p>
        <p class="company-name">{{ $registration->company_name ?? 'N/A' }}</p>
        <p class="event-day">DAY 1</p>

        <img src="{{ public_path('storage/' . $registration->qr_code_path) }}" alt="QR Code" class="qr-code">

        <div class="footer">
            <div class="footer-logos">
                <div class="logo-item">
                    <strong>Organized By:</strong><br>
                    <img src="{{ public_path('storage/logos/organizer_logo.png') }}" alt="Organizer">
                </div>
                <div class="logo-item">
                    <strong>Event Manager:</strong><br>
                    <img src="{{ public_path('storage/logos/manager_logo.png') }}" alt="Manager">
                </div>
                <div class="logo-item">
                    <strong>Registration:</strong><br>
                    <img src="{{ public_path('storage/logos/registration_logo.png') }}" alt="Registration">
                </div>
            </div>
        </div>
    </div>
</body>
</html>