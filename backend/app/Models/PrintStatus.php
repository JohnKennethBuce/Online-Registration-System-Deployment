<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintStatus extends Model
{
    use HasFactory;

    protected $fillable =[
        'type', 'name', 'description'
    ];

    // relationships    
    
    public function registrationsBadge()
    {
        return $this->hasMany(Registration::class, 'badge_printed_status_id');
    }

    public function registrationsTicket()
    {
        return $this->hasMany(Registration::class, 'ticket_printed_status_id');
    }

    public function scansBadge()
    {
        return $this->hasMany(Scan::class, 'badge_printed_status_id');
    }

    public function scansTicket()
    {
        return $this->hasMany(Scan::class, 'ticket_printed_status_id');
    }

}
