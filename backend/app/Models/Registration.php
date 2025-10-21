<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class Registration extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        // Existing fields
        'first_name', 'last_name', 'email', 'phone', 'address', 'company_name',
        'registration_type', 'server_mode', 'qr_code_path',
        'ticket_number', 'confirmed_at', 'email_hash',

        // New fields from your updated migration
        'age_range',
        'gender',
        'gender_other',
        'designation',
        'industry_sector',
        'industry_sector_other',
        'reason_for_attending',
        'reason_for_attending_other',
        'specific_areas_of_interest',
        'specific_areas_of_interest_other',
        'how_did_you_learn_about',
        'how_did_you_learn_about_other',

        // System-managed fields
        'confirmed', 'confirmed_by', 'registered_by',
        'badge_printed_status_id', 'ticket_printed_status_id', 'payment_status',
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

    public function getQrUrlAttribute(): ?string
    {
        if (!$this->qr_code_path) {
            return null;
        }
        $relative = ltrim(str_replace('\\', '/', $this->qr_code_path), '/');
        return asset('storage/' . $relative);
    }

    /* ---------------------------
     |  Encrypt / Decrypt Fields
     |----------------------------*/

    // --- Existing encrypted fields ---
    public function setFirstNameAttribute($value) { $this->attributes['first_name'] = Crypt::encryptString($value); }
    public function getFirstNameAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setLastNameAttribute($value) { $this->attributes['last_name'] = Crypt::encryptString($value); }
    public function getLastNameAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setEmailAttribute($value) { $this->attributes['email'] = $value ? Crypt::encryptString($value) : null; }
    public function getEmailAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setPhoneAttribute($value) { $this->attributes['phone'] = $value ? Crypt::encryptString($value) : null; }
    public function getPhoneAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setAddressAttribute($value) { $this->attributes['address'] = $value ? Crypt::encryptString($value) : null; }
    public function getAddressAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setCompanyNameAttribute($value) { $this->attributes['company_name'] = $value ? Crypt::encryptString($value) : null; }
    public function getCompanyNameAttribute($value) { return $value ? Crypt::decryptString($value) : null; }


    // --- NEW Encrypted Fields ---
    public function setGenderOtherAttribute($value) { $this->attributes['gender_other'] = $value ? Crypt::encryptString($value) : null; }
    public function getGenderOtherAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setDesignationAttribute($value) { $this->attributes['designation'] = $value ? Crypt::encryptString($value) : null; }
    public function getDesignationAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setIndustrySectorAttribute($value) { $this->attributes['industry_sector'] = $value ? Crypt::encryptString($value) : null; }
    public function getIndustrySectorAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setIndustrySectorOtherAttribute($value) { $this->attributes['industry_sector_other'] = $value ? Crypt::encryptString($value) : null; }
    public function getIndustrySectorOtherAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setReasonForAttendingAttribute($value) { $this->attributes['reason_for_attending'] = $value ? Crypt::encryptString($value) : null; }
    public function getReasonForAttendingAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setReasonForAttendingOtherAttribute($value) { $this->attributes['reason_for_attending_other'] = $value ? Crypt::encryptString($value) : null; }
    public function getReasonForAttendingOtherAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setSpecificAreasOfInterestAttribute($value) { $this->attributes['specific_areas_of_interest'] = $value ? Crypt::encryptString($value) : null; }
    public function getSpecificAreasOfInterestAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setSpecificAreasOfInterestOtherAttribute($value) { $this->attributes['specific_areas_of_interest_other'] = $value ? Crypt::encryptString($value) : null; }
    public function getSpecificAreasOfInterestOtherAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setHowDidYouLearnAboutAttribute($value) { $this->attributes['how_did_you_learn_about'] = $value ? Crypt::encryptString($value) : null; }
    public function getHowDidYouLearnAboutAttribute($value) { return $value ? Crypt::decryptString($value) : null; }

    public function setHowDidYouLearnAboutOtherAttribute($value) { $this->attributes['how_did_you_learn_about_other'] = $value ? Crypt::encryptString($value) : null; }
    public function getHowDidYouLearnAboutOtherAttribute($value) { return $value ? Crypt::decryptString($value) : null; }


    /* ---------------------------
     |  Relationships
     |----------------------------*/
    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function registeredBy()
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function scans()
    {
        return $this->hasMany(Scan::class);
    }

    public function badgeStatus()
    {
        return $this->belongsTo(PrintStatus::class, 'badge_printed_status_id');
    }

    public function ticketStatus()
    {
        return $this->belongsTo(PrintStatus::class, 'ticket_printed_status_id');
    }
}