<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class Registration extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        // ✅ Encrypted PII
        'first_name',
        'last_name',
        'email',
        'email_hash',
        'phone',
        'address',
        'company_name',
        
        // ✅ Demographics (NOT encrypted - for analytics)
        'age_range',
        'gender',
        'gender_other',
        
        // ✅ Professional Info (NOT encrypted)
        'designation',
        
        // ✅ Survey Data (NOT encrypted - for analytics)
        'industry_sector',
        'industry_sector_other',
        'reason_for_attending',
        'reason_for_attending_other',
        'specific_areas_of_interest',
        'specific_areas_of_interest_other',
        'how_did_you_learn_about',
        'how_did_you_learn_about_other',
        
        // ✅ System Fields
        'registration_type',
        'ticket_number',
        'qr_code_path',
        'server_mode',
        'confirmed',
        'confirmed_by',
        'confirmed_at',
        'registered_by',
        'badge_printed_status_id',
        'ticket_printed_status_id',
        'payment_status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'confirmed'    => 'boolean',
        'confirmed_at' => 'datetime',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['qr_url', 'badge_status_display'];

    /**
     * Get badge status display attributes
     */
    public function getBadgeStatusDisplayAttribute(): array
    {
        $statusName = $this->badgeStatus->name ?? 'not_printed';

        switch ($statusName) {
            case 'printed':
                return ['text' => 'PRINTED', 'color' => '#28a745'];
            case 'reprinted':
                return ['text' => 'RE-PRINTED', 'color' => '#fd7e14'];
            case 'not_printed':
            default:
                return ['text' => 'NOT PRINTED', 'color' => '#6c757d'];
        }
    }

    /**
     * Get QR code URL
     */
    public function getQrUrlAttribute(): ?string
    {
        if (!$this->qr_code_path) {
            return null;
        }
        $relative = ltrim(str_replace('\\', '/', $this->qr_code_path), '/');
        return asset('storage/' . $relative);
    }

    /* ========================================================================
     | ENCRYPTION - Only for True PII (Personal Identifiable Information)
     | ======================================================================== */

    // ✅ First Name - ENCRYPTED
    public function setFirstNameAttribute($value)
    {
        $this->attributes['first_name'] = Crypt::encryptString($value);
    }

    public function getFirstNameAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // ✅ Last Name - ENCRYPTED
    public function setLastNameAttribute($value)
    {
        $this->attributes['last_name'] = Crypt::encryptString($value);
    }

    public function getLastNameAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // ✅ Email - ENCRYPTED
    public function setEmailAttribute($value)
    {
        $this->attributes['email'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getEmailAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // ✅ Phone - ENCRYPTED
    public function setPhoneAttribute($value)
    {
        $this->attributes['phone'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getPhoneAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // ✅ Address - ENCRYPTED
    public function setAddressAttribute($value)
    {
        $this->attributes['address'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getAddressAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    // ✅ Company Name - ENCRYPTED
    public function setCompanyNameAttribute($value)
    {
        $this->attributes['company_name'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getCompanyNameAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    /* ========================================================================
     | NO ENCRYPTION - Survey/Demographics (for analytics and groupBy queries)
     | ========================================================================
     | The following fields are stored as PLAIN TEXT:
     | - age_range (enum)
     | - gender (enum)
     | - gender_other (string)
     | - designation (string)
     | - industry_sector (string)
     | - industry_sector_other (string)
     | - reason_for_attending (text)
     | - reason_for_attending_other (text)
     | - specific_areas_of_interest (string)
     | - specific_areas_of_interest_other (text)
     | - how_did_you_learn_about (string)
     | - how_did_you_learn_about_other (text)
     | 
     | ✅ These fields are NOT sensitive PII and need to be queryable for reports
     | ======================================================================== */

    /* ========================================================================
     | Relationships
     | ======================================================================== */

    /**
     * User who confirmed this registration
     */
    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /**
     * User who registered this attendee
     */
    public function registeredBy()
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    /**
     * QR code scans for this registration
     */
    public function scans()
    {
        return $this->hasMany(Scan::class);
    }

    /**
     * Badge print status
     */
    public function badgeStatus()
    {
        return $this->belongsTo(PrintStatus::class, 'badge_printed_status_id');
    }

    /**
     * Ticket print status
     */
    public function ticketStatus()
    {
        return $this->belongsTo(PrintStatus::class, 'ticket_printed_status_id');
    }

    /* ========================================================================
     | Model Events
     | ======================================================================== */

    protected static function boot()
    {
        parent::boot();

        // Auto-generate ticket number on creation
        static::creating(function ($registration) {
            if (empty($registration->ticket_number)) {
                $registration->ticket_number = 'TICKET-' . strtoupper(Str::random(12));
            }
        });
    }
}