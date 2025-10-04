<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'permissions', 'description',
    ];

    protected $casts = [
        'permissions' => 'array',  // JSON to array
    ];

    // Relationship
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
