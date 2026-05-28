<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'uploader_id', 'subject_id', 'folder_id', 'title', 'description',
        'file_path', 'file_name', 'file_size', 'file_type', 'download_count',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(ResourceFolder::class, 'folder_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(ResourceShare::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(ResourceFavorite::class);
    }

    public function downloadLogs(): HasMany
    {
        return $this->hasMany(ResourceDownloadLog::class);
    }
}
