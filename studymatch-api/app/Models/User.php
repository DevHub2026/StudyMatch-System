<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'suspended_at',
        'username',
        'profile_completed',
        'avatar',
        'bio',
        'phone',
        'date_of_birth',
        'gender',
        'learning_styles',
        'study_styles',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at'  => 'datetime',
        'suspended_at'       => 'datetime',
        'date_of_birth'      => 'date',
        'profile_completed'  => 'boolean',
        'learning_styles'    => 'array',
        'study_styles'       => 'array',
        'password'           => 'hashed',
    ];

    // Relationships
    public function student()
    {
        return $this->hasOne(Student::class);
    }

    public function tutor()
    {
        return $this->hasOne(Tutor::class);
    }

    public function notifications()
    {
        return $this->hasMany(\App\Models\Notification::class);
    }

    // Helper methods
    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isTutor(): bool
    {
        return $this->role === 'tutor';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isSuspended(): bool
    {
        return $this->suspended_at !== null;
    }
}