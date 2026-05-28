<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Session;
use App\Models\StudentWeakSubject;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    /**
     * Get all subjects
     */
    public function index()
    {
        $subjects = Subject::all();
        return response()->json($subjects);
    }

    /**
     * Study overview: subjects, per-subject progress, sessions, streak, inactive alerts.
     */
    public function studyOverview(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Only students can access study overview'], 403);
        }

        $weakSubjects = StudentWeakSubject::with('subject')
            ->where('student_id', $student->id)
            ->get();

        $sessions = Session::with(['subject', 'tutor.user'])
            ->where('student_id', $student->id)
            ->orderByDesc('scheduled_at')
            ->get();

        $now = Carbon::now();
        $inactiveDays = 14;
        $goalSessionsPerSubject = 5;

        $subjectRows = [];
        $totalCompleted = 0;
        $totalUpcoming = 0;
        $totalOngoing = 0;

        foreach ($weakSubjects as $ws) {
            $subjectId = $ws->subject_id;
            $subjectSessions = $sessions->where('subject_id', $subjectId);

            $completed = $subjectSessions->where('status', 'completed');
            $upcoming = $subjectSessions->filter(function ($s) use ($now) {
                if (in_array($s->status, ['completed', 'cancelled'], true)) {
                    return false;
                }
                if (!$s->scheduled_at) {
                    return in_array($s->status, ['pending', 'scheduled', 'ongoing'], true);
                }
                return Carbon::parse($s->scheduled_at)->gte($now);
            });
            $ongoing = $subjectSessions->filter(function ($s) use ($now) {
                if ($s->status === 'ongoing') {
                    return true;
                }
                if ($s->status !== 'scheduled' || !$s->scheduled_at) {
                    return false;
                }
                $start = Carbon::parse($s->scheduled_at);
                $end = $start->copy()->addMinutes($s->duration_minutes ?? 60);
                return $now->between($start, $end);
            });

            $completedCount = $completed->count();
            $upcomingCount = $upcoming->count();
            $ongoingCount = $ongoing->count();

            $totalCompleted += $completedCount;
            $totalUpcoming += $upcomingCount;
            $totalOngoing += $ongoingCount;

            $progressPercent = min(100, (int) round(($completedCount / $goalSessionsPerSubject) * 100));
            if ($ongoingCount > 0 && $progressPercent < 100) {
                $progressPercent = min(100, $progressPercent + 5);
            }

            $lastSessionAt = $subjectSessions
                ->filter(fn ($s) => $s->scheduled_at)
                ->sortByDesc('scheduled_at')
                ->first()?->scheduled_at;

            $lastActivity = $lastSessionAt ? Carbon::parse($lastSessionAt) : null;
            $daysSinceActivity = $lastActivity ? $lastActivity->diffInDays($now) : null;

            $isInactive = $upcomingCount === 0 && $ongoingCount === 0
                && ($lastActivity === null || $lastActivity->lt($now->copy()->subDays($inactiveDays)));

            $nextSession = $upcoming->sortBy('scheduled_at')->first();

            $subjectRows[] = [
                'id' => $ws->id,
                'subject_id' => $subjectId,
                'name' => $ws->subject?->name ?? 'Unknown',
                'code' => $ws->subject?->code ?? '',
                'category' => $ws->subject?->code ? $this->subjectCategoryLabel($ws->subject->code) : 'General',
                'difficulty_level' => $ws->difficulty_level,
                'progress_percent' => $progressPercent,
                'completed_sessions' => $completedCount,
                'upcoming_sessions' => $upcomingCount,
                'ongoing_sessions' => $ongoingCount,
                'last_session_at' => $lastSessionAt,
                'days_since_activity' => $daysSinceActivity,
                'is_inactive' => $isInactive,
                'next_session' => $nextSession ? [
                    'id' => $nextSession->id,
                    'scheduled_at' => $nextSession->scheduled_at,
                    'status' => $nextSession->status,
                    'tutor_name' => $nextSession->tutor?->user?->name,
                    'session_type' => $nextSession->session_type,
                ] : null,
            ];
        }

        $inactiveAlerts = collect($subjectRows)
            ->filter(fn ($r) => $r['is_inactive'])
            ->map(fn ($r) => [
                'subject_id' => $r['subject_id'],
                'subject_name' => $r['name'],
                'message' => $r['last_session_at']
                    ? "No recent activity in {$r['name']} for {$r['days_since_activity']} days. Schedule a session to stay on track."
                    : "You haven't scheduled any sessions for {$r['name']} yet. Book a tutor to get started.",
                'severity' => $r['last_session_at'] ? 'warning' : 'info',
            ])
            ->values();

        $overallProgress = count($subjectRows) > 0
            ? (int) round(collect($subjectRows)->avg('progress_percent'))
            : 0;

        $streak = $this->computeStudyStreak($sessions);

        $upcomingAll = $sessions->filter(function ($s) use ($now) {
            if (in_array($s->status, ['completed', 'cancelled'], true)) {
                return false;
            }
            if (!$s->scheduled_at) {
                return in_array($s->status, ['pending', 'scheduled'], true);
            }
            return Carbon::parse($s->scheduled_at)->gte($now);
        })->sortBy('scheduled_at')->take(8)->values()->map(fn ($s) => [
            'id' => $s->id,
            'subject_id' => $s->subject_id,
            'subject_name' => $s->subject?->name,
            'scheduled_at' => $s->scheduled_at,
            'status' => $s->status,
            'tutor_name' => $s->tutor?->user?->name,
            'duration_minutes' => $s->duration_minutes,
        ]);

        $notStartedCount = collect($subjectRows)->filter(fn ($r) => $r['progress_percent'] === 0)->count();
        $inProgressCount = collect($subjectRows)->filter(fn ($r) => $r['progress_percent'] > 0 && $r['progress_percent'] < 100)->count();
        $completedSubjectsCount = collect($subjectRows)->filter(fn ($r) => $r['progress_percent'] >= 100)->count();

        return response()->json([
            'subjects' => $subjectRows,
            'analytics' => [
                'total_subjects' => count($subjectRows),
                'overall_progress_percent' => $overallProgress,
                'total_completed_sessions' => $totalCompleted,
                'total_upcoming_sessions' => $totalUpcoming,
                'total_ongoing_sessions' => $totalOngoing,
                'subjects_not_started' => $notStartedCount,
                'subjects_in_progress' => $inProgressCount,
                'subjects_completed' => $completedSubjectsCount,
            ],
            'streak' => $streak,
            'inactive_alerts' => $inactiveAlerts,
            'upcoming_sessions' => $upcomingAll,
            'generated_at' => $now->toIso8601String(),
        ]);
    }

    private function subjectCategoryLabel(string $code): string
    {
        $prefix = strtoupper(substr($code, 0, 4));
        return match (true) {
            str_contains($prefix, 'MATH'), str_contains($prefix, 'CALC'), str_contains($prefix, 'ALG'), str_contains($prefix, 'STAT') => 'Mathematics',
            str_contains($prefix, 'PHYS'), str_contains($prefix, 'CHEM'), str_contains($prefix, 'BIO') => 'Science',
            str_contains($prefix, 'CS'), str_contains($prefix, 'PROG') => 'Technology',
            str_contains($prefix, 'ENG') => 'Language',
            default => 'Academic',
        };
    }

    private function computeStudyStreak($sessions): array
    {
        $completedDays = $sessions
            ->where('status', 'completed')
            ->map(function ($s) {
                $dt = $s->completed_at ?? $s->scheduled_at;
                return $dt ? Carbon::parse($dt)->toDateString() : null;
            })
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $streak = 0;
        $cursor = Carbon::today();

        if (in_array($cursor->toDateString(), $completedDays, true)) {
            while (in_array($cursor->toDateString(), $completedDays, true)) {
                $streak++;
                $cursor->subDay();
            }
        } else {
            $cursor->subDay();
            while (in_array($cursor->toDateString(), $completedDays, true)) {
                $streak++;
                $cursor->subDay();
            }
        }

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $weekDays = [];
        for ($i = 0; $i < 7; $i++) {
            $day = $weekStart->copy()->addDays($i);
            $weekDays[] = [
                'label' => $day->format('D'),
                'date' => $day->toDateString(),
                'active' => in_array($day->toDateString(), $completedDays, true),
            ];
        }

        return [
            'current_days' => $streak,
            'week_days' => $weekDays,
        ];
    }

    /**
     * Get my weak subjects
     */
    public function getWeakSubjects(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Only students can have weak subjects'
            ], 403);
        }

        $weakSubjects = StudentWeakSubject::with('subject')
            ->where('student_id', $student->id)
            ->get();

        return response()->json($weakSubjects);
    }

    /**
     * Add a weak subject
     */
    public function addWeakSubject(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'difficulty_level' => 'required|in:moderate,difficult,very_difficult',
            'current_grade' => 'nullable|numeric|min:1.0|max:5.0',
            'notes' => 'nullable|string'
        ]);

        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Only students can add weak subjects'
            ], 403);
        }

        // Check if already exists
        $existing = StudentWeakSubject::where('student_id', $student->id)
            ->where('subject_id', $request->subject_id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This subject is already in your weak subjects list'
            ], 400);
        }

        $weakSubject = StudentWeakSubject::create([
            'student_id' => $student->id,
            'subject_id' => $request->subject_id,
            'difficulty_level' => $request->difficulty_level,
            'current_grade' => $request->current_grade,
            'notes' => $request->notes,
            'needs_help' => true
        ]);

        return response()->json([
            'message' => 'Weak subject added successfully',
            'weak_subject' => $weakSubject->load('subject')
        ], 201);
    }

    /**
     * Remove a weak subject
     */
    public function removeWeakSubject($id)
    {
        $weakSubject = StudentWeakSubject::findOrFail($id);

        // Verify ownership
        if ($weakSubject->student_id !== auth()->user()->student->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $weakSubject->delete();

        return response()->json([
            'message' => 'Weak subject removed successfully'
        ]);
    }

    /**
     * Update weak subject
     */
    public function updateWeakSubject(Request $request, $id)
    {
        $request->validate([
            'difficulty_level' => 'sometimes|in:moderate,difficult,very_difficult',
            'current_grade' => 'nullable|numeric|min:1.0|max:5.0',
            'notes' => 'nullable|string',
            'needs_help' => 'sometimes|boolean'
        ]);

        $weakSubject = StudentWeakSubject::findOrFail($id);

        // Verify ownership
        if ($weakSubject->student_id !== auth()->user()->student->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $weakSubject->update($request->all());

        return response()->json([
            'message' => 'Weak subject updated successfully',
            'weak_subject' => $weakSubject->load('subject')
        ]);
    }
}