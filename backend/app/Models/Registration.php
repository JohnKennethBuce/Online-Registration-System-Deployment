<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'address', 'company_name',
        'registration_type', 'server_mode', 'qr_code_path',
        'ticket_number', 'confirmed_at', 'email_hash',
    ];

    protected $guarded = [
        'badge_printed_status_id', 'ticket_printed_status_id',
        'confirmed', 'confirmed_by', 'registered_by',
    ];

    protected $casts = [
        'confirmed'    => 'boolean',
        'confirmed_at' => 'datetime',
        'created_at'   => 'datetime',  
        'updated_at'   => 'datetime',  
    ];

    // Always append a web-safe QR URL to JSON
    protected $appends = ['qr_url'];

    // Accessor: returns a full HTTP URL to the QR image or null if not available
    public function getQrUrlAttribute(): ?string
    {
        if (!$this->qr_code_path) {
            return null;
        }

        // Normalize Windows slashes, generate '/storage/...' and convert to absolute URL
        $path = str_replace('\\', '/', $this->qr_code_path);
        $webPath = Storage::url($path); // e.g. '/storage/qr_codes/abc.png'
        return url($webPath);           // e.g. 'http://127.0.0.1:8000/storage/qr_codes/abc.png'
    }

    // Add these methods inside the Registration model class
    public function setCompanyNameAttribute($value)
    {
        $this->attributes['company_name'] = $value ? Crypt::encryptString($value) : null;
    }
    public function getCompanyNameAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    /* ---------------------------
     |  Encrypt / Decrypt Fields
     |----------------------------*/
    public function setFirstNameAttribute($value)
    {
        $this->attributes['first_name'] = Crypt::encryptString($value);
    }
    public function getFirstNameAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setLastNameAttribute($value)
    {
        $this->attributes['last_name'] = Crypt::encryptString($value);
    }
    public function getLastNameAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setEmailAttribute($value)
    {
        $this->attributes['email'] = Crypt::encryptString($value);
    }
    public function getEmailAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setPhoneAttribute($value)
    {
        $this->attributes['phone'] = $value ? Crypt::encryptString($value) : null;
    }
    public function getPhoneAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setAddressAttribute($value)
    {
        $this->attributes['address'] = $value ? Crypt::encryptString($value) : null;
    }
    public function getAddressAttribute($value)
    {
        return $value ? Crypt::decryptString($value) : null;
    }

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