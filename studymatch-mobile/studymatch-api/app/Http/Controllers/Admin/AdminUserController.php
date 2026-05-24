<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tutor;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['student', 'tutor'])
            ->where('role', '!=', 'admin');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'LIKE', "%{$request->search}%")
                  ->orWhere('email', 'LIKE', "%{$request->search}%");
            });
        }

        if ($request->filled('status')) {
            if ($request->status === 'suspended') {
                $query->whereNotNull('suspended_at');
            } else {
                $query->whereNull('suspended_at');
            }
        }

        $users = $query->latest()->paginate((int) $request->input('per_page', 20));

        return response()->json($users);
    }

    public function show(int $id)
    {
        $user = User::with(['student.weakSubjects.subject', 'tutor.strongSubjects.subject', 'tutor.reviews'])
            ->findOrFail($id);

        return response()->json(['user' => $user]);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role'  => 'sometimes|in:student,tutor,admin',
        ]);

        $user->update($request->only(['name', 'email', 'role']));

        return response()->json(['message' => 'User updated.', 'user' => $user->fresh()]);
    }

    public function destroy(int $id)
    {
        $user = User::findOrFail($id);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function suspend(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['suspended_at' => now()]);
        $user->tokens()->delete();

        return response()->json(['message' => 'User suspended.']);
    }

    public function unsuspend(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['suspended_at' => null]);

        return response()->json(['message' => 'User unsuspended.']);
    }

    public function pendingTutors()
    {
        $tutors = Tutor::with('user')
            ->where('verification_status', 'pending')
            ->latest()
            ->get();

        return response()->json(['tutors' => $tutors]);
    }

    public function approveTutor(Request $request, int $id)
    {
        /** @var \App\Models\User $admin */
        $admin = $request->user();
        $tutor = Tutor::findOrFail($id);
        $tutor->update([
            'verification_status' => 'approved',
            'verified_at'         => now(),
            'verified_by'         => $admin->id,
        ]);

        $tutor->user->update(['role' => 'tutor']);

        return response()->json(['message' => 'Tutor approved.', 'tutor' => $tutor->fresh()]);
    }

    public function rejectTutor(int $id)
    {
        $tutor = Tutor::findOrFail($id);
        $tutor->update(['verification_status' => 'rejected']);

        return response()->json(['message' => 'Tutor rejected.']);
    }
}
