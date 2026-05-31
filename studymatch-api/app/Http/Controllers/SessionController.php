<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Session;
use App\Models\User;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Session::with(['tutor.user', 'student.user', 'subject']);

        if ($user->student) {
            $query->where('student_id', $user->student->id);
        } elseif ($user->tutor) {
            $query->where('tutor_id', $user->tutor->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sessions = $query->latest('scheduled_at')->get();

        $data = $sessions->map(fn ($s) => [
            'id'              => (string) $s->id,
            // camelCase fields (mobile compat)
            'tutorUserId'     => (string) ($s->tutor?->user?->id ?? ''),
            'tutorName'       => $s->tutor?->user?->name ?? 'Tutor',
            'studentUserId'   => (string) ($s->student?->user?->id ?? ''),
            'studentName'     => $s->student?->user?->name ?? 'Student',
            'scheduledAt'     => $s->scheduled_at,
            'durationMinutes' => $s->duration_minutes ?? 60,
            'createdAt'       => $s->created_at,
            // snake_case fields (web compat)
            'scheduled_at'    => $s->scheduled_at,
            'duration_minutes'=> $s->duration_minutes ?? 60,
            'session_type'    => $s->session_type ?? 'online',
            'session_link'    => $s->session_link,
            'subject_id'      => $s->subject_id,
            'tutor_id'        => $s->tutor_id,
            'student_id'      => $s->student_id,
            'status'          => $s->status,
            'notes'           => $s->notes,
            // nested objects for web components
            'tutor'   => $s->tutor ? [
                'id'   => $s->tutor->id,
                'user' => $s->tutor->user
                    ? ['id' => $s->tutor->user->id, 'name' => $s->tutor->user->name]
                    : null,
            ] : null,
            'student' => $s->student ? [
                'id'   => $s->student->id,
                'user' => $s->student->user
                    ? ['id' => $s->student->user->id, 'name' => $s->student->user->name]
                    : null,
            ] : null,
            'subject' => $s->subject
                ? ['id' => $s->subject->id, 'name' => $s->subject->name]
                : null,
        ]);

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function show(Request $request, int $id)
    {
        $session = Session::with(['tutor.user', 'student.user', 'subject', 'tutorRequest'])->findOrFail($id);
        $this->authorizeSession($request->user(), $session);

        return response()->json(['session' => $session]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tutor_request_id' => 'nullable|exists:tutor_requests,id',
            'tutor_id'         => 'sometimes|exists:tutors,id',
            'tutor_user_id'    => 'sometimes|exists:users,id',
            'student_id'       => 'sometimes|exists:students,id',
            'student_user_id'  => 'sometimes|exists:users,id',
            'subject_id'       => 'nullable|exists:subjects,id',
            'scheduled_at'     => 'required|date',
            'duration_minutes' => 'sometimes|integer|min:30|max:480',
            'session_type'     => 'sometimes|in:online,in_person',
            'notes'            => 'nullable|string|max:1000',
            'session_link'     => 'nullable|url',
        ]);

        $currentUser = $request->user();
        $tutorId     = null;
        $student     = null;

        if ($currentUser->student) {
            // Student booking a session — they are the student
            $student = $currentUser->student;

            // Resolve tutor from tutor_user_id (mobile) or tutor_id (direct)
            $tutorId = $request->tutor_id;
            if (!$tutorId && $request->filled('tutor_user_id')) {
                $tutorUser = User::findOrFail($request->tutor_user_id);
                if (!$tutorUser->tutor) {
                    return response()->json(['message' => 'This user is not a registered tutor.'], 422);
                }
                $tutorId = $tutorUser->tutor->id;
            }
            if (!$tutorId) {
                return response()->json(['message' => 'tutor_id or tutor_user_id is required.'], 422);
            }
        } elseif ($currentUser->tutor) {
            // Tutor requesting a session — they are the tutor, student is provided
            $tutorId = $currentUser->tutor->id;

            if ($request->filled('student_id')) {
                $student = \App\Models\Student::find($request->student_id);
            } elseif ($request->filled('student_user_id')) {
                $studentUser = User::find($request->student_user_id);
                $student     = $studentUser?->student;
            }
            if (!$student) {
                return response()->json(['message' => 'student_id or student_user_id is required.'], 422);
            }
        } else {
            return response()->json(['message' => 'Only students or tutors can book sessions.'], 403);
        }

        $session = Session::create([
            'tutor_request_id' => $request->tutor_request_id,
            'tutor_id'         => $tutorId,
            'student_id'       => $student->id,
            'subject_id'       => $request->subject_id,
            'scheduled_at'     => $request->scheduled_at,
            'duration_minutes' => $request->duration_minutes ?? 60,
            'session_type'     => $request->session_type ?? 'online',
            'notes'            => $request->notes,
            'session_link'     => $request->session_link,
            'status'           => 'pending',
        ]);

        $session->load(['tutor.user', 'student.user', 'subject']);
        $date        = $session->scheduled_at
            ? \Carbon\Carbon::parse($session->scheduled_at)->format('M j, g:i A')
            : 'upcoming';
        $subjectName = $session->subject?->name ?? 'a subject';

        // Notify the other party about the new booking
        if ($currentUser->student) {
            // Student booked → notify tutor
            $tutorUser = $session->tutor?->user;
            if ($tutorUser) {
                Notification::send(
                    $tutorUser->id, 'session',
                    'New session request',
                    "{$currentUser->name} booked a session for {$subjectName} on {$date}.",
                    ['session_id' => $session->id]
                );
            }
        } else {
            // Tutor booked → notify student
            $studentUser = $session->student?->user;
            if ($studentUser) {
                Notification::send(
                    $studentUser->id, 'session',
                    'Session scheduled',
                    "{$currentUser->name} scheduled a {$subjectName} session on {$date}.",
                    ['session_id' => $session->id]
                );
            }
        }

        return response()->json(['message' => 'Session booked.', 'session' => $session], 201);
    }

    public function update(Request $request, int $id)
    {
        $session = Session::findOrFail($id);
        $this->authorizeSession($request->user(), $session);

        $request->validate([
            'scheduled_at'     => 'sometimes|date|after:now',
            'duration_minutes' => 'sometimes|integer|min:30|max:480',
            'session_type'     => 'sometimes|in:online,in_person',
            'notes'            => 'nullable|string|max:1000',
            'session_link'     => 'nullable|url',
            'status'           => 'sometimes|in:scheduled,completed,cancelled,rescheduled',
        ]);

        $data = $request->only(['scheduled_at', 'duration_minutes', 'session_type', 'notes', 'session_link', 'status']);

        if (($data['status'] ?? null) === 'completed') {
            $data['completed_at'] = now();
        }

        $session->update($data);

        return response()->json(['message' => 'Session updated.', 'session' => $session->fresh()]);
    }

    public function confirm(Request $request, int $id)
    {
        $session = Session::findOrFail($id);
        $tutor   = $request->user()->tutor;

        if (!$tutor || $session->tutor_id !== $tutor->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if ($session->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Session is not pending confirmation.'], 422);
        }

        $session->update(['status' => 'scheduled']);
        $session->load(['tutor.user', 'student.user']);

        // Notify student their session is confirmed
        $studentUser = $session->student?->user;
        $tutorName   = $session->tutor?->user?->name ?? 'Your tutor';
        $date        = $session->scheduled_at
            ? \Carbon\Carbon::parse($session->scheduled_at)->format('M j, g:i A')
            : 'the scheduled time';
        if ($studentUser) {
            Notification::send(
                $studentUser->id, 'session',
                'Session confirmed',
                "{$tutorName} confirmed your session on {$date}.",
                ['session_id' => $session->id]
            );
        }

        return response()->json(['success' => true, 'message' => 'Session confirmed.']);
    }

    public function cancel(Request $request, int $id)
    {
        $session = Session::findOrFail($id);
        $this->authorizeSession($request->user(), $session);

        $session->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        $session->load(['tutor.user', 'student.user']);

        // Notify the other party of the cancellation
        $canceller    = $request->user();
        $tutorUser    = $session->tutor?->user;
        $studentUser  = $session->student?->user;
        $cancellerName = $canceller->name;
        $date          = $session->scheduled_at
            ? \Carbon\Carbon::parse($session->scheduled_at)->format('M j, g:i A')
            : 'the scheduled time';

        if ($canceller->student && $tutorUser) {
            Notification::send(
                $tutorUser->id, 'session',
                'Session cancelled',
                "{$cancellerName} cancelled the session scheduled for {$date}.",
                ['session_id' => $session->id]
            );
        } elseif ($canceller->tutor && $studentUser) {
            Notification::send(
                $studentUser->id, 'session',
                'Session cancelled',
                "{$cancellerName} cancelled the session scheduled for {$date}.",
                ['session_id' => $session->id]
            );
        }

        return response()->json(['message' => 'Session cancelled.']);
    }

    private function authorizeSession(\App\Models\User $user, Session $session): void
    {
        $isOwner = ($user->student && $session->student_id === $user->student->id)
                || ($user->tutor   && $session->tutor_id   === $user->tutor->id)
                || $user->role === 'admin';

        abort_unless($isOwner, 403, 'Unauthorized.');
    }
}
