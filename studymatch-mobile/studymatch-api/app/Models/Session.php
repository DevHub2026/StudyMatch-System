<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    protected $table = 'tutor_sessions';

    protected $fillable = [
        'tutor_request_id', 'tutor_id', 'student_id', 'subject_id',
        'scheduled_at', 'duration_minutes', 'status',
        'notes', 'session_link', 'cancelled_at', 'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function tutorRequest()
    {
        return $this->belongsTo(TutorRequest::class);
    }

    public function tutor()
    {
        return $this->belongsTo(Tutor::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>', now())->where('status', 'scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
