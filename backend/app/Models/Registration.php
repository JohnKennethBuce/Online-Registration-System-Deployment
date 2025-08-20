<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Registration extends Model
{
    use HasFactory;

    protected $fillable =[
        'first_name', 'last_name', 'email', 'phone', 'address', 
        'registration_type', 'ticket_number', 'qr_code_path', 
        'server_mode',
    ];

    protected $guarded = [
        'badge_printed_status_id', 'ticket_printed_status_id',
        'confirmed', 'confirmed_by', 'registered_by'
    ];

    // Relationships
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
