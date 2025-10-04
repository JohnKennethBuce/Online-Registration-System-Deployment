<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'action', 'target_type', 'target_id', 
        'ip_address', 'description' 
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}