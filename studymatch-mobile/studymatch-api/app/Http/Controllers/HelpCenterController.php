<?php

namespace App\Http\Controllers;

use App\Models\HelpTicket;
use Illuminate\Http\Request;

class HelpCenterController extends Controller
{
    public function index(Request $request)
    {
        $tickets = HelpTicket::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['tickets' => $tickets]);
    }

    public function submit(Request $request)
    {
        $request->validate([
            'subject'  => 'required|string|max:255',
            'message'  => 'required|string|max:5000',
            'category' => 'nullable|string|max:100',
            'priority' => 'sometimes|in:low,medium,high,urgent',
        ]);

        $ticket = HelpTicket::create([
            'user_id'  => $request->user()->id,
            'subject'  => $request->subject,
            'message'  => $request->message,
            'category' => $request->category,
            'priority' => $request->priority ?? 'medium',
            'status'   => 'open',
        ]);

        return response()->json(['message' => 'Support ticket submitted.', 'ticket' => $ticket], 201);
    }
}
