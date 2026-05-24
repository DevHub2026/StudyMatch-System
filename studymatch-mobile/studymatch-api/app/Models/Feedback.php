<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedback';

    protected $fillable = [
        'user_id', 'category', 'message', 'rating', 'status', 'admin_notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
