<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\TutorRequest;
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

        $sessions = $query->latest('scheduled_at')->paginate(20);

        return response()->json($sessions);
    }

    public function show(Request $request, $id)
    {
        $session = Session::with(['tutor.user', 'student.user', 'subject', 'tutorRequest'])->findOrFail($id);
        $this->authorizeSession($request->user(), $session);

        return response()->json(['session' => $session]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tutor_request_id' => 'nullable|exists:tutor_requests,id',
            'tutor_id'         => 'required|exists:tutors,id',
            'subject_id'       => 'nullable|exists:subjects,id',
            'scheduled_at'     => 'required|date|after:now',
            'duration_minutes' => 'sometimes|integer|min:30|max:480',
            'notes'            => 'nullable|string|max:1000',
            'session_link'     => 'nullable|url',
        ]);

        $student = $request->user()->student;
        if (!$student) {
            return response()->json(['message' => 'Only students can book sessions.'], 403);
        }

        $session = Session::create([
            'tutor_request_id' => $request->tutor_request_id,
            'tutor_id'         => $request->tutor_id,
            'student_id'       => $student->id,
            'subject_id'       => $request->subject_id,
            'scheduled_at'     => $request->scheduled_at,
            'duration_minutes' => $request->duration_minutes ?? 60,
            'notes'            => $request->notes,
            'session_link'     => $request->session_link,
            'status'           => 'scheduled',
        ]);

        return response()->json(['message' => 'Session booked.', 'session' => $session->load(['tutor.user', 'subject'])], 201);
    }

    public function update(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        $this->authorizeSession($request->user(), $session);

        $request->validate([
            'scheduled_at'     => 'sometimes|date|after:now',
            'duration_minutes' => 'sometimes|integer|min:30|max:480',
            'notes'            => 'nullable|string|max:1000',
            'session_link'     => 'nullable|url',
            'status'           => 'sometimes|in:completed,cancelled',
        ]);

        $data = $request->only(['scheduled_at', 'duration_minutes', 'notes', 'session_link', 'status']);

        if (($data['status'] ?? null) === 'completed') {
            $data['completed_at'] = now();
        }

        $session->update($data);

        return response()->json(['message' => 'Session updated.', 'session' => $session->fresh()]);
    }

    public function cancel(Request $request, $id)
    {
        $session = Session::findOrFail($id);
        $this->authorizeSession($request->user(), $session);

        $session->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return response()->json(['message' => 'Session cancelled.']);
    }

    private function authorizeSession($user, Session $session): void
    {
        $isOwner = ($user->student && $session->student_id === $user->student->id)
                || ($user->tutor   && $session->tutor_id   === $user->tutor->id)
                || $user->role === 'admin';

        abort_unless($isOwner, 403, 'Unauthorized.');
    }
}
