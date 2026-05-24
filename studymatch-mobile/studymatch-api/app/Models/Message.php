<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id', 'sender_id', 'message_type', 'content',
        'file_path', 'file_name', 'file_size', 'file_mime',
        'is_read', 'read_at',
    ];

    protected $casts = [
        'is_read'   => 'boolean',
        'read_at'   => 'datetime',
        'file_size' => 'integer',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
