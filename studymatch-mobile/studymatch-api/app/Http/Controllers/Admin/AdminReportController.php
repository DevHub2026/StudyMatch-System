<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Session;
use App\Models\TutorRequest;
use App\Models\Complaint;
use App\Models\Feedback;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'type' => 'required|in:users,sessions,requests,complaints,feedback',
            'from' => 'nullable|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        $from = $request->from ? now()->parse($request->from)->startOfDay() : now()->subDays(30)->startOfDay();
        $to   = $request->to ? now()->parse($request->to)->endOfDay() : now()->endOfDay();

        $data = match ($request->type) {
            'users'      => $this->usersReport($from, $to),
            'sessions'   => $this->sessionsReport($from, $to),
            'requests'   => $this->requestsReport($from, $to),
            'complaints' => $this->complaintsReport($from, $to),
            'feedback'   => $this->feedbackReport($from, $to),
        };

        return response()->json([
            'report_type' => $request->type,
            'from'        => $from->toDateString(),
            'to'          => $to->toDateString(),
            'data'        => $data,
        ]);
    }

    private function usersReport($from, $to)
    {
        return [
            'total_registered' => User::whereBetween('created_at', [$from, $to])->where('role', '!=', 'admin')->count(),
            'students'         => User::whereBetween('created_at', [$from, $to])->where('role', 'student')->count(),
            'tutors'           => User::whereBetween('created_at', [$from, $to])->where('role', 'tutor')->count(),
            'verified_emails'  => User::whereBetween('created_at', [$from, $to])->whereNotNull('email_verified_at')->count(),
        ];
    }

    private function sessionsReport($from, $to)
    {
        $query = Session::whereBetween('scheduled_at', [$from, $to]);

        return [
            'total'     => $query->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
            'scheduled' => (clone $query)->where('status', 'scheduled')->count(),
        ];
    }

    private function requestsReport($from, $to)
    {
        $query = TutorRequest::whereBetween('created_at', [$from, $to]);

        return [
            'total'    => $query->count(),
            'pending'  => (clone $query)->where('status', 'pending')->count(),
            'accepted' => (clone $query)->where('status', 'accepted')->count(),
            'declined' => (clone $query)->where('status', 'declined')->count(),
        ];
    }

    private function complaintsReport($from, $to)
    {
        $query = Complaint::whereBetween('created_at', [$from, $to]);

        return [
            'total'     => $query->count(),
            'open'      => (clone $query)->where('status', 'open')->count(),
            'reviewing' => (clone $query)->where('status', 'reviewing')->count(),
            'resolved'  => (clone $query)->where('status', 'resolved')->count(),
            'dismissed' => (clone $query)->where('status', 'dismissed')->count(),
        ];
    }

    private function feedbackReport($from, $to)
    {
        $query = Feedback::whereBetween('created_at', [$from, $to]);

        return [
            'total'   => $query->count(),
            'unread'  => (clone $query)->where('status', 'unread')->count(),
            'read'    => (clone $query)->where('status', 'read')->count(),
            'flagged' => (clone $query)->where('status', 'flagged')->count(),
        ];
    }
}
