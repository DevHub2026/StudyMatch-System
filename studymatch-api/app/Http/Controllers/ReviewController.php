<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\TutorRequest;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Submit a review
     */
    public function store(Request $request)
    {
        $request->validate([
            'tutor_request_id'     => 'nullable|exists:tutor_requests,id',
            'tutor_id'             => 'nullable|string', // accepts User UUID from mobile
            'rating'               => 'required|integer|min:1|max:5',
            'comment'              => 'nullable|string',
            'communication_rating' => 'nullable|integer|min:1|max:5',
            'knowledge_rating'     => 'nullable|integer|min:1|max:5',
            'punctuality_rating'   => 'nullable|integer|min:1|max:5',
            'is_anonymous'         => 'boolean',
        ]);

        $student = $request->user()->student;

        if (!$student) {
            return response()->json(['message' => 'Only students can submit reviews'], 403);
        }

        // Resolve tutorRequest: prefer explicit ID, fall back to user-ID lookup
        $tutorRequest = null;
        if ($request->filled('tutor_request_id')) {
            $tutorRequest = TutorRequest::find($request->tutor_request_id);
        }
        if (!$tutorRequest && $request->filled('tutor_id')) {
            $tutorUser = User::find($request->tutor_id);
            if ($tutorUser?->tutor) {
                $tutorRequest = TutorRequest::where('student_id', $student->id)
                    ->where('tutor_id', $tutorUser->tutor->id)
                    ->where('status', 'accepted')
                    ->latest()
                    ->first();
            }
        }

        if (!$tutorRequest) {
            return response()->json(['message' => 'No accepted tutor request found to review.'], 422);
        }

        if ($tutorRequest->student_id !== $student->id) {
            return response()->json(['message' => 'You can only review your own tutor requests.'], 403);
        }

        if ($tutorRequest->status !== 'accepted') {
            return response()->json(['message' => 'You can only review accepted tutor requests.'], 400);
        }

        if ($tutorRequest->review) {
            return response()->json(['message' => 'You have already reviewed this tutor request.'], 400);
        }

        $review = Review::create([
            'student_id'           => $student->id,
            'tutor_id'             => $tutorRequest->tutor_id,
            'tutor_request_id'     => $tutorRequest->id,
            'rating'               => $request->rating,
            'comment'              => $request->comment,
            'communication_rating' => $request->communication_rating,
            'knowledge_rating'     => $request->knowledge_rating,
            'punctuality_rating'   => $request->punctuality_rating,
            'is_anonymous'         => $request->is_anonymous ?? false,
        ]);

        // Update tutor's average rating
        $this->updateTutorRating($tutorRequest->tutor_id);

        return response()->json([
            'message' => 'Review submitted successfully',
            'review' => $review
        ], 201);
    }

    /**
     * Get my reviews (as student)
     */
    public function myReviews(Request $request)
    {
        $student = $request->user()->student;

        if (!$student) {
            return response()->json([
                'message' => 'Only students have reviews'
            ], 403);
        }

        $reviews = Review::with(['tutor.user', 'tutorRequest.subject'])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    /**
     * Get reviews I received (as tutor)
     */
    public function received(Request $request)
    {
        $tutor = $request->user()->tutor;

        if (!$tutor) {
            return response()->json([
                'message' => 'Only tutors receive reviews'
            ], 403);
        }

        $reviews = Review::with(['student.user', 'tutorRequest.subject'])
            ->where('tutor_id', $tutor->id)
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    /**
     * Get reviews for a specific tutor (public)
     */
    public function getTutorReviews($tutorId)
    {
        // Mobile passes the User UUID; resolve to the Tutor model ID if needed
        $resolvedTutorId = $tutorId;
        $byUserId = User::find($tutorId);
        if ($byUserId?->tutor) {
            $resolvedTutorId = $byUserId->tutor->id;
        }

        $reviews = Review::with(['student.user', 'tutorRequest.subject'])
            ->where('tutor_id', $resolvedTutorId)
            ->latest()
            ->limit(10)
            ->get();

        return response()->json($reviews);
    }

    /**
     * Update tutor's average rating
     */
    private function updateTutorRating($tutorId)
    {
        $tutor = Tutor::findOrFail($tutorId);
        
        $averageRating = Review::where('tutor_id', $tutorId)->avg('rating');
        $totalSessions = Review::where('tutor_id', $tutorId)->count();

        $tutor->update([
            'average_rating' => round($averageRating, 2),
            'total_sessions' => $totalSessions
        ]);
    }
}