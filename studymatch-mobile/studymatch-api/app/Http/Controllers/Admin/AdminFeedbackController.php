<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class AdminFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $feedback = $query->latest()->paginate((int) $request->input('per_page', 20));

        return response()->json($feedback);
    }

    public function update(Request $request, int $id)
    {
        $feedback = Feedback::findOrFail($id);

        $request->validate([
            'status'      => 'required|in:unread,read,flagged',
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        $feedback->update($request->only(['status', 'admin_notes']));

        return response()->json(['message' => 'Feedback updated.', 'feedback' => $feedback->fresh()]);
    }
}
