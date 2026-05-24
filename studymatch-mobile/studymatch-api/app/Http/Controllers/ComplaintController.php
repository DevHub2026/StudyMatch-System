<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        $complaints = Complaint::with(['reportedUser'])
            ->where('submitted_by', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['complaints' => $complaints]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'reported_user_id' => 'nullable|exists:users,id',
            'subject'          => 'required|string|max:255',
            'description'      => 'required|string|max:3000',
            'priority'         => 'sometimes|in:low,medium,high',
        ]);

        if ($request->reported_user_id && $request->reported_user_id == $request->user()->id) {
            return response()->json(['message' => 'You cannot report yourself.'], 422);
        }

        $complaint = Complaint::create([
            'submitted_by'     => $request->user()->id,
            'reported_user_id' => $request->reported_user_id,
            'subject'          => $request->subject,
            'description'      => $request->description,
            'priority'         => $request->priority ?? 'medium',
            'status'           => 'open',
        ]);

        return response()->json(['message' => 'Complaint submitted.', 'complaint' => $complaint], 201);
    }
}
