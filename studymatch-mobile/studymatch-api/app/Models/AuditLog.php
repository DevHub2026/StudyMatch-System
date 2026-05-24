<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id', 'action', 'module', 'description', 'ip_address', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public static function record(string $action, string $module, string $description = '', array $metadata = []): void
    {
        static::create([
            'admin_id'    => auth()->user()?->id,
            'action'      => $action,
            'module'      => $module,
            'description' => $description,
            'ip_address'  => request()->ip(),
            'metadata'    => $metadata ?: null,
        ]);
    }
}
