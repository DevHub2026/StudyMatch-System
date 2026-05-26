<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\MobileUserFormatter;
use Illuminate\Http\Request;

class TutorController extends Controller
{
    use MobileUserFormatter;

    /**
     * GET /tutors | GET /partners
     * Supports subject-based matching via my_strengths / my_weaknesses params.
     */
    public function index(Request $request)
    {
        $targetRole = $request->input('target_role', 'tutor');
        $excludeId  = $request->input('exclude_id');
        $search     = $request->input('search');
        $subject    = $request->input('subject');

        $myStrengths  = $this->parseJsonArray($request->input('my_strengths'));
        $myWeaknesses = $this->parseJsonArray($request->input('my_weaknesses'));

        $query = User::with([
            'student.weakSubjects.subject',
            'tutor.strongSubjects.subject',
            'tutor.availability',
        ])->where('role', $targetRole);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($search) {
            $query->where('name', 'LIKE', "%{$search}%");
        }

        // Subject-based matching: tutor strengths ↔ student weaknesses
        if ($targetRole === 'tutor' && !empty($myWeaknesses)) {
            $query->whereHas('tutor.strongSubjects.subject', function ($q) use ($myWeaknesses) {
                $q->whereIn('name', $myWeaknesses);
            });
        } elseif ($targetRole === 'student' && !empty($myStrengths)) {
            $query->whereHas('student.weakSubjects.subject', function ($q) use ($myStrengths) {
                $q->whereIn('name', $myStrengths);
            });
        }

        // Optional single-subject filter
        if ($subject) {
            if ($targetRole === 'tutor') {
                $query->whereHas('tutor.strongSubjects.subject', function ($q) use ($subject) {
                    $q->where('name', $subject);
                });
            } else {
                $query->whereHas('student.weakSubjects.subject', function ($q) use ($subject) {
                    $q->where('name', $subject);
                });
            }
        }

        $users = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $users->map(fn (User $u) => $this->formatMobileUser($u))->values()->all(),
        ]);
    }

    /**
     * GET /tutors/{id} | GET /partners/{id}
     */
    public function show($id)
    {
        $user = User::with([
            'student.weakSubjects.subject',
            'tutor.strongSubjects.subject',
            'tutor.availability',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatMobileUser($user),
        ]);
    }

    /**
     * GET /tutors/{id}/availability
     */
    public function getAvailability($id)
    {
        $user  = User::findOrFail($id);
        $tutor = $user->tutor;

        if (!$tutor) {
            return response()->json(['availability' => []]);
        }

        return response()->json([
            'availability' => $tutor->availability()->where('is_active', true)->get(),
        ]);
    }

    /**
     * GET /tutors/search
     */
    public function search(Request $request)
    {
        $search = $request->input('q', '');

        $users = User::with([
            'student.weakSubjects.subject',
            'tutor.strongSubjects.subject',
            'tutor.availability',
        ])->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhereHas('tutor.strongSubjects.subject', function ($sq) use ($search) {
                  $sq->where('name', 'LIKE', "%{$search}%");
              })
              ->orWhereHas('student.weakSubjects.subject', function ($sq) use ($search) {
                  $sq->where('name', 'LIKE', "%{$search}%");
              });
        })->limit(10)->get();

        return response()->json([
            'success' => true,
            'data'    => $users->map(fn (User $u) => $this->formatMobileUser($u))->values()->all(),
        ]);
    }

    public function adminPending(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $tutors = \App\Models\Tutor::with('user')
            ->where('verification_status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($t) => [
                'id'             => $t->id,
                'specialization' => $t->specialization,
                'tutor_type'     => $t->tutor_type,
                'credentials'    => $t->credentials,
                'created_at'     => $t->created_at,
                'user'           => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name, 'email' => $t->user->email] : null,
            ]);

        return response()->json(['tutors' => $tutors]);
    }

    public function adminApprove(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $tutor = \App\Models\Tutor::findOrFail($id);
        $tutor->update([
            'verification_status' => 'approved',
            'verified_at'         => now(),
            'verified_by'         => $request->user()->id,
        ]);

        return response()->json(['message' => 'Tutor approved.']);
    }

    public function adminReject(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $tutor = \App\Models\Tutor::findOrFail($id);
        $tutor->update(['verification_status' => 'rejected']);

        return response()->json(['message' => 'Tutor rejected.']);
    }

    private function parseJsonArray(?string $val): array
    {
        if (!$val) return [];
        try {
            $decoded = json_decode($val, true);
            return is_array($decoded) ? array_filter($decoded) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }
}
