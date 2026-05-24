<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'uploader_id', 'subject_id', 'title', 'description',
        'file_path', 'file_name', 'file_size', 'file_type', 'download_count',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
