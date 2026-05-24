<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\TutorRequest;
use App\Models\User;
use Illuminate\Http\Request;

class TutorRequestController extends Controller
{
    /**
     * GET /tutor-requests | GET /match-requests
     * Returns requests sent (student) and received (tutor).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $sentRequests     = [];
        $receivedRequests = [];

        if ($user->student) {
            $sentRequests = TutorRequest::with(['tutor.user', 'subject'])
                ->where('student_id', $user->student->id)
                ->latest()
                ->get();
        }

        if ($user->tutor) {
            $receivedRequests = TutorRequest::with(['student.user', 'subject'])
                ->where('tutor_id', $user->tutor->id)
                ->latest()
                ->get();
        }

        return response()->json([
            'sent'     => $sentRequests,
            'received' => $receivedRequests,
        ]);
    }

    /**
     * POST /tutor-requests/send
     * Expects: tutor_id (Tutor model ID), subject_id, message
     */
    public function send(Request $request)
    {
        $request->validate([
            'tutor_id'   => 'required|exists:tutors,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'message'    => 'nullable|string|max:1000',
        ]);

        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Only students can send tutor requests.'], 403);
        }

        $existing = TutorRequest::where('student_id', $student->id)
            ->where('tutor_id', $request->tutor_id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending request to this tutor.'], 400);
        }

        $tutorRequest = TutorRequest::create([
            'student_id' => $student->id,
            'tutor_id'   => $request->tutor_id,
            'subject_id' => $request->subject_id,
            'message'    => $request->message,
            'status'     => 'pending',
        ]);

        return response()->json([
            'message' => 'Tutor request sent successfully.',
            'request' => $tutorRequest->load(['tutor.user', 'subject']),
        ], 201);
    }

    /**
     * POST /match-requests/send
     * Frontend alias: accepts receiver_user_id (User ID of the tutor) instead of tutor_id.
     */
    public function sendByUserId(Request $request)
    {
        $request->validate([
            'receiver_user_id' => 'required|exists:users,id',
            'subject_id'       => 'nullable|exists:subjects,id',
            'message'          => 'nullable|string|max:1000',
        ]);

        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Only students can send tutor requests.'], 403);
        }

        $receiverUser = User::findOrFail($request->receiver_user_id);
        $tutor        = $receiverUser->tutor;

        if (!$tutor) {
            return response()->json(['message' => 'The specified user is not a tutor.'], 422);
        }

        $existing = TutorRequest::where('student_id', $student->id)
            ->where('tutor_id', $tutor->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending request to this tutor.'], 400);
        }

        $tutorRequest = TutorRequest::create([
            'student_id' => $student->id,
            'tutor_id'   => $tutor->id,
            'subject_id' => $request->subject_id,
            'message'    => $request->message,
            'status'     => 'pending',
        ]);

        return response()->json([
            'message' => 'Tutor request sent successfully.',
            'request' => $tutorRequest->load(['tutor.user', 'subject']),
        ], 201);
    }

    /**
     * POST /tutor-requests/{id}/accept | POST /match-requests/{id}/accept
     */
    public function accept(Request $request, $id)
    {
        $tutorRequest = TutorRequest::findOrFail($id);
        $tutor        = $request->user()->tutor;

        if (!$tutor || $tutorRequest->tutor_id !== $tutor->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $tutorRequest->update(['status' => 'accepted', 'accepted_at' => now()]);

        return response()->json(['message' => 'Request accepted.', 'request' => $tutorRequest]);
    }

    /**
     * POST /tutor-requests/{id}/decline | POST /match-requests/{id}/decline
     */
    public function decline(Request $request, $id)
    {
        $tutorRequest = TutorRequest::findOrFail($id);
        $tutor        = $request->user()->tutor;

        if (!$tutor || $tutorRequest->tutor_id !== $tutor->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $tutorRequest->update(['status' => 'declined', 'declined_at' => now()]);

        return response()->json(['message' => 'Request declined.', 'request' => $tutorRequest]);
    }

    /**
     * POST /tutor-requests/{id}/cancel | DELETE /match-requests/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        $tutorRequest = TutorRequest::findOrFail($id);
        $student      = $request->user()->student;

        if (!$student || $tutorRequest->student_id !== $student->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($tutorRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 400);
        }

        $tutorRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Request cancelled.', 'request' => $tutorRequest]);
    }
}
