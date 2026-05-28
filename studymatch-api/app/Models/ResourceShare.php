<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceShare extends Model
{
    protected $fillable = ['resource_id', 'shared_with_user_id', 'shared_by_user_id'];

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function sharedWith(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_with_user_id');
    }
}
