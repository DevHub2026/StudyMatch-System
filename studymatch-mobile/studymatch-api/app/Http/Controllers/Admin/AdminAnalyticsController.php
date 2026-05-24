<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Session;
use App\Models\Subject;
use App\Models\TutorSubject;
use App\Models\StudentWeakSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function overview()
    {
        return response()->json([
            'total_users'      => User::where('role', '!=', 'admin')->count(),
            'total_sessions'   => Session::count(),
            'completed_sessions' => Session::where('status', 'completed')->count(),
            'active_tutors'    => User::where('role', 'tutor')->count(),
            'active_students'  => User::where('role', 'student')->count(),
        ]);
    }

    public function sessionTrends(Request $request)
    {
        $days = (int) $request->get('days', 30);
        $from = now()->subDays($days);

        $trends = Session::select(
                DB::raw('DATE(scheduled_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled')
            )
            ->where('scheduled_at', '>=', $from)
            ->groupBy(DB::raw('DATE(scheduled_at)'))
            ->orderBy('date')
            ->get();

        return response()->json(['trends' => $trends, 'days' => $days]);
    }

    public function subjectDemand()
    {
        $demand = Subject::select('subjects.id', 'subjects.name', 'subjects.code')
            ->selectRaw('COUNT(DISTINCT student_weak_subjects.student_id) as student_demand')
            ->selectRaw('COUNT(DISTINCT tutor_subjects.tutor_id) as tutor_supply')
            ->leftJoin('student_weak_subjects', 'subjects.id', '=', 'student_weak_subjects.subject_id')
            ->leftJoin('tutor_subjects', 'subjects.id', '=', 'tutor_subjects.subject_id')
            ->groupBy('subjects.id', 'subjects.name', 'subjects.code')
            ->orderByDesc('student_demand')
            ->get();

        return response()->json(['subjects' => $demand]);
    }

    public function userGrowth(Request $request)
    {
        $days = (int) $request->get('days', 30);
        $from = now()->subDays($days);

        $growth = User::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN role = "student" THEN 1 ELSE 0 END) as students'),
                DB::raw('SUM(CASE WHEN role = "tutor" THEN 1 ELSE 0 END) as tutors')
            )
            ->where('created_at', '>=', $from)
            ->where('role', '!=', 'admin')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json(['growth' => $growth, 'days' => $days]);
    }

    public function activity(Request $request)
    {
        $days = (int) $request->get('days', 7);
        $from = now()->subDays($days);

        $sessions  = Session::where('created_at', '>=', $from)->count();
        $newUsers  = User::where('created_at', '>=', $from)->where('role', '!=', 'admin')->count();
        $requests  = \App\Models\TutorRequest::where('created_at', '>=', $from)->count();

        return response()->json([
            'days'             => $days,
            'new_sessions'     => $sessions,
            'new_users'        => $newUsers,
            'new_requests'     => $requests,
        ]);
    }
}
