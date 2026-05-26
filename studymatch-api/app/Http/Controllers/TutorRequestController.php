<?php

namespace App\Http\Controllers;

use App\Models\TutorRequest;
use App\Models\User;
use App\Traits\MobileUserFormatter;
use Illuminate\Http\Request;

class TutorRequestController extends Controller
{
    use MobileUserFormatter;

    /**
     * GET /tutor-requests | GET /match-requests
     * Returns all accepted matches for the current user as RealUser objects.
     */
    public function index(Request $request)
    {
        $user    = $request->user();
        $matches = [];

        if ($user->student) {
            $requests = TutorRequest::where('student_id', $user->student->id)
                ->where('status', 'accepted')
                ->latest()
                ->get();

            foreach ($requests as $req) {
                $tutor = \App\Models\Tutor::find($req->tutor_id);
                if (!$tutor) continue;
                $otherUser = User::with([
                    'student.weakSubjects.subject',
                    'tutor.strongSubjects.subject',
                    'tutor.availability',
                ])->find($tutor->user_id);
                if ($otherUser) {
                    $matches[] = $this->formatMobileUser($otherUser);
                }
            }
        }

        if ($user->tutor) {
            $requests = TutorRequest::where('tutor_id', $user->tutor->id)
                ->where('status', 'accepted')
                ->latest()
                ->get();

            foreach ($requests as $req) {
                $student = \App\Models\Student::find($req->student_id);
                if (!$student) continue;
                $otherUser = User::with([
                    'student.weakSubjects.subject',
                    'tutor.strongSubjects.subject',
                    'tutor.availability',
                ])->find($student->user_id);
                if ($otherUser) {
                    $matches[] = $this->formatMobileUser($otherUser);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $matches,
        ]);
    }

    /**
     * POST /tutor-requests/send
     * Original endpoint: accepts tutor_id (Tutor model ID).
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
            ->first();

        if ($existing) {
            if ($existing->status === 'accepted') {
                return response()->json(['success' => true, 'message' => 'Already matched.']);
            }
            $existing->update(['status' => 'accepted', 'accepted_at' => now()]);
            return response()->json(['success' => true, 'message' => 'Match accepted.']);
        }

        TutorRequest::create([
            'student_id'  => $student->id,
            'tutor_id'    => $request->tutor_id,
            'subject_id'  => $request->subject_id,
            'message'     => $request->message,
            'status'      => 'accepted',
            'accepted_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Match created successfully.'], 201);
    }

    /**
     * GET /match-requests/pending
     * Returns pending (not-yet-mutual) match requests initiated by the current user.
     */
    public function pending(Request $request)
    {
        $user    = $request->user();
        $pending = [];

        if ($user->student) {
            $requests = TutorRequest::where('student_id', $user->student->id)
                ->where('status', 'pending')
                ->latest()
                ->get();

            foreach ($requests as $req) {
                $tutor = \App\Models\Tutor::find($req->tutor_id);
                if (!$tutor) continue;
                $otherUser = User::with([
                    'student.weakSubjects.subject',
                    'tutor.strongSubjects.subject',
                    'tutor.availability',
                ])->find($tutor->user_id);
                if ($otherUser) {
                    $pending[] = $this->formatMobileUser($otherUser);
                }
            }
        }

        if ($user->tutor) {
            $requests = TutorRequest::where('tutor_id', $user->tutor->id)
                ->where('status', 'pending')
                ->latest()
                ->get();

            foreach ($requests as $req) {
                $student = \App\Models\Student::find($req->student_id);
                if (!$student) continue;
                $otherUser = User::with([
                    'student.weakSubjects.subject',
                    'tutor.strongSubjects.subject',
                    'tutor.availability',
                ])->find($student->user_id);
                if ($otherUser) {
                    $pending[] = $this->formatMobileUser($otherUser);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data'    => $pending,
        ]);
    }

    /**
     * POST /match-requests/send
     * Accepts receiver_user_id (User ID). Works for both students matching tutors
     * and tutors matching students. First like creates a pending request; the
     * second like (mutual) upgrades it to accepted.
     */
    public function sendByUserId(Request $request)
    {
        $request->validate([
            'receiver_user_id' => 'required|exists:users,id',
            'subject_id'       => 'nullable|exists:subjects,id',
            'message'          => 'nullable|string|max:1000',
        ]);

        $currentUser  = $request->user();
        $receiverUser = User::findOrFail($request->receiver_user_id);

        // Determine student/tutor IDs regardless of who initiates
        if ($currentUser->student && $receiverUser->tutor) {
            $studentId = $currentUser->student->id;
            $tutorId   = $receiverUser->tutor->id;
        } elseif ($currentUser->tutor && $receiverUser->student) {
            $studentId = $receiverUser->student->id;
            $tutorId   = $currentUser->tutor->id;
        } else {
            return response()->json([
                'success' => false,
                'message' => 'A match requires one student and one tutor.',
            ], 422);
        }

        $existing = TutorRequest::where('student_id', $studentId)
            ->where('tutor_id', $tutorId)
            ->first();

        if ($existing) {
            if ($existing->status === 'accepted') {
                return response()->json(['success' => true, 'status' => 'accepted', 'message' => 'Already matched.']);
            }
            // Mutual like — upgrade to accepted
            $existing->update(['status' => 'accepted', 'accepted_at' => now()]);
            return response()->json(['success' => true, 'status' => 'accepted', 'message' => 'It\'s a match!']);
        }

        TutorRequest::create([
            'student_id' => $studentId,
            'tutor_id'   => $tutorId,
            'subject_id' => $request->subject_id,
            'message'    => $request->message,
            'status'     => 'pending',
        ]);

        return response()->json(['success' => true, 'status' => 'pending', 'message' => 'Match request sent.'], 201);
    }

    /**
     * GET /match-requests/incoming
     * Returns all tutor_requests directed at the current tutor (all statuses),
     * with raw request data for the web Find Students page.
     */
    public function incoming(Request $request)
    {
        $tutor = $request->user()->tutor;

        if (!$tutor) {
            return response()->json(['success' => false, 'message' => 'Only tutors can view incoming requests.'], 403);
        }

        $requests = TutorRequest::with(['student.user', 'subject'])
            ->where('tutor_id', $tutor->id)
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * POST /tutor-requests/{id}/accept | POST /match-requests/{id}/accept
     */
    public function accept(Request $request, $id)
    {
        $tutorRequest = TutorRequest::find($id);

        if (!$tutorRequest) {
            $currentUser = $request->user();
            $otherUser = User::find($id);
            if ($otherUser) {
                if ($currentUser->student && $otherUser->tutor) {
                    $tutorRequest = TutorRequest::where('student_id', $currentUser->student->id)
                        ->where('tutor_id', $otherUser->tutor->id)
                        ->first();
                } elseif ($currentUser->tutor && $otherUser->student) {
                    $tutorRequest = TutorRequest::where('student_id', $otherUser->student->id)
                        ->where('tutor_id', $currentUser->tutor->id)
                        ->first();
                }
            }
        }

        if (!$tutorRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

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
        $tutorRequest = TutorRequest::find($id);

        if (!$tutorRequest) {
            $currentUser = $request->user();
            $otherUser = User::find($id);
            if ($otherUser) {
                if ($currentUser->student && $otherUser->tutor) {
                    $tutorRequest = TutorRequest::where('student_id', $currentUser->student->id)
                        ->where('tutor_id', $otherUser->tutor->id)
                        ->first();
                } elseif ($currentUser->tutor && $otherUser->student) {
                    $tutorRequest = TutorRequest::where('student_id', $otherUser->student->id)
                        ->where('tutor_id', $currentUser->tutor->id)
                        ->first();
                }
            }
        }

        if (!$tutorRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

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
        $tutorRequest = TutorRequest::find($id);

        if (!$tutorRequest) {
            $currentUser = $request->user();
            $otherUser = User::find($id);
            if ($otherUser) {
                if ($currentUser->student && $otherUser->tutor) {
                    $tutorRequest = TutorRequest::where('student_id', $currentUser->student->id)
                        ->where('tutor_id', $otherUser->tutor->id)
                        ->first();
                } elseif ($currentUser->tutor && $otherUser->student) {
                    $tutorRequest = TutorRequest::where('student_id', $otherUser->student->id)
                        ->where('tutor_id', $currentUser->tutor->id)
                        ->first();
                }
            }
        }

        if (!$tutorRequest) {
            return response()->json(['message' => 'Request not found.'], 404);
        }

        $currentUser  = $request->user();

        $isStudent = $currentUser->student && $tutorRequest->student_id === $currentUser->student->id;
        $isTutor   = $currentUser->tutor   && $tutorRequest->tutor_id   === $currentUser->tutor->id;

        if (!$isStudent && !$isTutor) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $tutorRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Match removed.', 'request' => $tutorRequest]);
    }
}
