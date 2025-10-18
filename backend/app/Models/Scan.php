<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Scan extends Model
{
    use HasFactory;

    protected $fillable =[
        'registration_id', 'scanned_by', 'scanned_time', 'badge_printed_status_id',
        'ticket_printed_status_id', 'payment_status'
    ];

    protected $casts = [
        'payment_status' => 'string',
        'scanned_time' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',

    ];

    //relationships

    public function registration()
    {
        return $this->belongsTo(Registration::class);
    }

    public function scannedBy()
    {
        return $this->belongsTo(User::class, 'scanned_by');
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
