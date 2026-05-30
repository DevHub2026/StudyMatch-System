<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['student', 'tutor']);

        $requestedRole = $request->input('role');

        // Only hide admin accounts from the general list unless an admin role is explicitly requested
        if (!$requestedRole || !in_array($requestedRole, ['admin', 'super_admin'])) {
            $query->whereNotIn('role', ['admin', 'super_admin']);
        }

        if ($requestedRole) {
            $query->where('role', $requestedRole);
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

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:student,tutor,admin,super_admin',
        ]);

        $user = User::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'password'          => Hash::make($request->password),
            'role'              => $request->role,
            'profile_completed' => in_array($request->role, ['admin', 'super_admin']) ? 1 : 0,
            'email_verified_at' => now(),
        ]);

        if ($request->role === 'tutor') {
            Tutor::create(['user_id' => $user->id, 'verification_status' => 'approved', 'verified_at' => now()]);
        } elseif ($request->role === 'student') {
            Student::create(['user_id' => $user->id]);
        }

        AuditLog::record('create', 'users', "Admin created user {$user->name} ({$user->email}) with role {$request->role}", ['user_id' => $user->id, 'role' => $request->role]);

        return response()->json(['message' => 'User created successfully.', 'user' => $user->fresh()], 201);
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
            'role'  => 'sometimes|in:student,tutor,admin,super_admin',
        ]);

        $user->update($request->only(['name', 'email', 'role']));

        AuditLog::record('update', 'users', "Admin updated user {$user->name} ({$user->email})", ['user_id' => $id]);

        return response()->json(['message' => 'User updated.', 'user' => $user->fresh()]);
    }

    public function destroy(int $id)
    {
        $user = User::findOrFail($id);
        AuditLog::record('delete', 'users', "Admin deleted user {$user->name} ({$user->email})", ['user_id' => $id]);

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }

    public function suspend(int $id)
    {
        $user = User::findOrFail($id);

        if (in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['message' => 'Admin accounts cannot be suspended.'], 403);
        }

        $user->update(['suspended_at' => now()]);
        $user->tokens()->delete();

        AuditLog::record('suspend', 'users', "Admin suspended user {$user->name} ({$user->email})", ['user_id' => $id]);

        return response()->json(['message' => 'User suspended.']);
    }

    public function unsuspend(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['suspended_at' => null]);

        AuditLog::record('update', 'users', "Admin unsuspended user {$user->name} ({$user->email})", ['user_id' => $id]);

        return response()->json(['message' => 'User unsuspended.']);
    }

    // POST /admin/users/{id}/verify-email — admin override: mark email as verified
    public function verifyEmail(int $id)
    {
        $user = User::findOrFail($id);

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified.']);
        }

        $user->update(['email_verified_at' => now()]);

        AuditLog::record('update', 'users', "Admin manually verified email for {$user->name} ({$user->email})", ['user_id' => $id]);

        return response()->json(['message' => 'Email verified successfully.', 'user' => $user->fresh()]);
    }

    public function pendingTutors()
    {
        $tutors = Tutor::with(['user', 'strongSubjects.subject'])
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

        AuditLog::record('update', 'users', "Admin approved tutor {$tutor->user->name}", ['tutor_id' => $id, 'user_id' => $tutor->user_id]);

        return response()->json(['message' => 'Tutor approved.', 'tutor' => $tutor->fresh()]);
    }

    public function rejectTutor(int $id)
    {
        $tutor = Tutor::findOrFail($id);
        $tutor->update(['verification_status' => 'rejected']);

        AuditLog::record('update', 'users', "Admin rejected tutor #{$id}", ['tutor_id' => $id]);

        return response()->json(['message' => 'Tutor rejected.']);
    }
}
