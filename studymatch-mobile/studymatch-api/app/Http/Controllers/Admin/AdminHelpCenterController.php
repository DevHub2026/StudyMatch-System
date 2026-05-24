<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HelpTicket;
use Illuminate\Http\Request;

class AdminHelpCenterController extends Controller
{
    public function index(Request $request)
    {
        $query = HelpTicket::with(['user', 'respondedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $query->where('subject', 'LIKE', "%{$request->search}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'LIKE', "%{$request->search}%"));
        }

        $tickets = $query->latest()->paginate((int) $request->input('per_page', 20));

        return response()->json($tickets);
    }

    public function show(int $id)
    {
        $ticket = HelpTicket::with(['user', 'respondedBy'])->findOrFail($id);

        return response()->json(['ticket' => $ticket]);
    }

    public function respond(Request $request, int $id)
    {
        $ticket = HelpTicket::findOrFail($id);

        $request->validate([
            'admin_response' => 'required|string|max:5000',
            'status'         => 'sometimes|in:open,in_progress,resolved,closed',
        ]);

        /** @var \App\Models\User $admin */
        $admin = $request->user();

        $ticket->update([
            'admin_response' => $request->admin_response,
            'status'         => $request->input('status', 'resolved'),
            'responded_by'   => $admin->id,
            'responded_at'   => now(),
        ]);

        return response()->json(['message' => 'Response sent.', 'ticket' => $ticket->fresh()]);
    }
}
