<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use Illuminate\Http\Request;

class AdminComplaintController extends Controller
{
    public function index(Request $request)
    {
        $query = Complaint::with(['submittedBy', 'reportedUser', 'resolvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('subject', 'LIKE', "%{$request->search}%")
                  ->orWhereHas('submittedBy', fn($q2) => $q2->where('name', 'LIKE', "%{$request->search}%"));
            });
        }

        $complaints = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json($complaints);
    }

    public function show(int $id)
    {
        $complaint = Complaint::with(['submittedBy', 'reportedUser', 'resolvedBy'])->findOrFail($id);

        return response()->json(['complaint' => $complaint]);
    }

    public function update(Request $request, int $id)
    {
        $complaint = Complaint::findOrFail($id);

        $request->validate([
            'status'           => 'required|in:open,reviewing,resolved,dismissed',
            'resolution_notes' => 'nullable|string|max:2000',
        ]);

        /** @var \App\Models\User $admin */
        $admin = $request->user();

        $complaint->update([
            'status'           => $request->status,
            'resolution_notes' => $request->resolution_notes,
            'resolved_by'      => in_array($request->status, ['resolved', 'dismissed']) ? $admin->id : $complaint->resolved_by,
            'resolved_at'      => in_array($request->status, ['resolved', 'dismissed']) ? now() : $complaint->resolved_at,
        ]);

        return response()->json(['message' => 'Complaint updated.', 'complaint' => $complaint->fresh()]);
    }
}
