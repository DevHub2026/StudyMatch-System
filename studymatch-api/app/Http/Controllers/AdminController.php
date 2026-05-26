<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    private function requireAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Forbidden.');
        }
    }

    public function stats(Request $request)
    {
        $this->requireAdmin($request);

        $totalUsers    = User::whereIn('role', ['student', 'tutor'])->count();
        $totalTutors   = User::where('role', 'tutor')->count();
        $pendingTutors = \App\Models\Tutor::where('verification_status', 'pending')->count();
        $openComplaints = Complaint::where('status', 'open')->count();

        return response()->json([
            'users' => [
                'total'                  => $totalUsers,
                'tutors'                 => $totalTutors,
                'pending_tutor_approval' => $pendingTutors,
            ],
            'support' => [
                'open_complaints' => $openComplaints,
            ],
        ]);
    }

    public function users(Request $request)
    {
        $this->requireAdmin($request);

        $query = User::with(['tutor'])->whereIn('role', ['student', 'tutor', 'admin']);

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->latest()->get()->map(fn ($u) => [
            'id'           => $u->id,
            'name'         => $u->name,
            'email'        => $u->email,
            'role'         => $u->role,
            'suspended_at' => $u->suspended_at,
            'created_at'   => $u->created_at,
            'tutor'        => $u->tutor ? [
                'specialization'     => $u->tutor->specialization,
                'verification_status'=> $u->tutor->verification_status,
            ] : null,
        ]);

        return response()->json(['data' => $users]);
    }

    public function suspendUser(Request $request, $id)
    {
        $this->requireAdmin($request);

        $user = User::findOrFail($id);
        $user->update(['suspended_at' => now()]);

        return response()->json(['message' => 'User suspended.']);
    }

    public function unsuspendUser(Request $request, $id)
    {
        $this->requireAdmin($request);

        $user = User::findOrFail($id);
        $user->update(['suspended_at' => null]);

        return response()->json(['message' => 'User unsuspended.']);
    }
}
