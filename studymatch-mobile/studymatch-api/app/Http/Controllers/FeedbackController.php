<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function myFeedback(Request $request)
    {
        $feedback = Feedback::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['feedback' => $feedback]);
    }

    public function submit(Request $request)
    {
        $request->validate([
            'category' => 'required|string|max:100',
            'message'  => 'required|string|max:3000',
            'rating'   => 'nullable|integer|min:1|max:5',
        ]);

        $feedback = Feedback::create([
            'user_id'  => $request->user()->id,
            'category' => $request->category,
            'message'  => $request->message,
            'rating'   => $request->rating,
            'status'   => 'unread',
        ]);

        return response()->json(['message' => 'Feedback submitted. Thank you!', 'feedback' => $feedback], 201);
    }
}
