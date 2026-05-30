<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::where('user_id', $request->user()->id)->latest();

        if ($request->has('is_read')) {
            $isRead = filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        $notifications = $query->paginate((int) $request->input('per_page', 20));

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markRead(int $id, Request $request)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    // POST /admin/notifications/send — broadcast DM to users via notification bell
    public function send(Request $request)
    {
        $request->validate([
            'title'   => 'required|string|max:255',
            'message' => 'required|string|max:2000',
            'type'    => 'sometimes|in:info,warning,success,error',
            'target'  => 'sometimes|in:all,students,tutors',
            'user_id' => 'sometimes|nullable|integer|exists:users,id',
        ]);

        $title  = trim($request->title);
        $body   = trim($request->message);
        $type   = $request->input('type', 'info');
        $userId = $request->input('user_id');
        $target = $request->input('target', 'all');

        $meta = [
            'sent_by_admin' => true,
            'admin_id'      => $request->user()->id,
            'admin_name'    => $request->user()->name,
        ];

        if ($userId) {
            Notification::send((int) $userId, $type, $title, $body, $meta);
            $count = 1;
        } else {
            $query = User::whereNotIn('role', ['admin', 'super_admin'])
                ->whereNull('suspended_at');

            if ($target === 'students') $query->where('role', 'student');
            if ($target === 'tutors')   $query->where('role', 'tutor');

            $count = 0;
            $query->select('id')->chunkById(200, function ($users) use ($type, $title, $body, $meta, &$count) {
                foreach ($users as $user) {
                    Notification::send($user->id, $type, $title, $body, $meta);
                    $count++;
                }
            });
        }

        return response()->json([
            'success' => true,
            'message' => "Message delivered to {$count} user(s).",
            'count'   => $count,
        ]);
    }

    // GET /admin/notifications/sent — messages sent BY admins
    public function sent(Request $request)
    {
        $notifications = Notification::whereRaw("JSON_EXTRACT(data, '$.sent_by_admin') = true")
            ->latest()
            ->paginate(30);

        // Collapse broadcasts into one row per (title + minute)
        $grouped = $notifications->getCollection()
            ->groupBy(fn ($n) => $n->title . '|' . $n->created_at->format('Y-m-d H:i'))
            ->map(fn ($group) => [
                'id'              => $group->first()->id,
                'title'           => $group->first()->title,
                'message'         => $group->first()->message,
                'type'            => $group->first()->type,
                'recipient_count' => $group->count(),
                'created_at'      => $group->first()->created_at,
                'data'            => json_decode($group->first()->data ?? '{}', true),
            ])
            ->values();

        return response()->json([
            'data'         => $grouped,
            'total'        => $notifications->total(),
            'current_page' => $notifications->currentPage(),
            'last_page'    => $notifications->lastPage(),
        ]);
    }
}
