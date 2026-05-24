<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use Illuminate\Http\Request;

class AdminSessionController extends Controller
{
    public function index(Request $request)
    {
        $query = Session::with(['tutor.user', 'student.user', 'subject']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->whereHas('tutor.user', fn($q) => $q->where('name', 'LIKE', "%{$request->search}%"))
                  ->orWhereHas('student.user', fn($q) => $q->where('name', 'LIKE', "%{$request->search}%"));
        }

        if ($request->filled('from')) {
            $query->whereDate('scheduled_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('scheduled_at', '<=', $request->to);
        }

        $sessions = $query->latest('scheduled_at')->paginate((int) $request->input('per_page', 20));

        return response()->json($sessions);
    }

    public function show(int $id)
    {
        $session = Session::with(['tutor.user', 'student.user', 'subject', 'tutorRequest'])->findOrFail($id);

        return response()->json(['session' => $session]);
    }

    public function cancel(int $id)
    {
        $session = Session::findOrFail($id);
        $session->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return response()->json(['message' => 'Session cancelled.']);
    }
}
