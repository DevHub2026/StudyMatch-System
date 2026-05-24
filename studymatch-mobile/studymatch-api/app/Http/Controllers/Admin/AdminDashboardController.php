<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tutor;
use App\Models\Session;
use App\Models\Complaint;
use App\Models\HelpTicket;
use App\Models\TutorRequest;

class AdminDashboardController extends Controller
{
    public function overview()
    {
        $totalUsers    = User::where('role', '!=', 'admin')->count();
        $totalStudents = User::where('role', 'student')->count();
        $totalTutors   = Tutor::where('verification_status', 'approved')->count();
        $pendingTutors = Tutor::where('verification_status', 'pending')->count();

        $totalSessions     = Session::count();
        $activeSessions    = Session::whereIn('status', ['scheduled', 'ongoing'])->count();
        $completedSessions = Session::where('status', 'completed')->count();

        $openComplaints  = Complaint::where('status', 'open')->count();
        $openTickets     = HelpTicket::whereIn('status', ['open', 'in_progress'])->count();
        $pendingRequests = TutorRequest::where('status', 'pending')->count();

        return response()->json([
            'users' => [
                'total'    => $totalUsers,
                'students' => $totalStudents,
                'tutors'   => $totalTutors,
                'pending_tutor_approval' => $pendingTutors,
            ],
            'sessions' => [
                'total'     => $totalSessions,
                'active'    => $activeSessions,
                'completed' => $completedSessions,
            ],
            'support' => [
                'open_complaints' => $openComplaints,
                'open_tickets'    => $openTickets,
            ],
            'requests' => [
                'pending' => $pendingRequests,
            ],
        ]);
    }
}
