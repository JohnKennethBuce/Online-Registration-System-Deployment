<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServerMode extends Model
{
    use HasFactory;

    protected $fillable = ['mode', 'activated_by'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // relationship
    public function activatedBy()
    {
        return $this->belongsTo(User::class, 'activated_by');
    }
}