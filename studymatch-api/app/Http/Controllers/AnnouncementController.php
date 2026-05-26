<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->user()->role;

        $announcements = Announcement::published()
            ->forRole($role)
            ->orderByDesc('is_pinned')
            ->latest('published_at')
            ->paginate(20);

        return response()->json($announcements);
    }

    public function show($id)
    {
        $announcement = Announcement::published()->findOrFail($id);

        return response()->json(['announcement' => $announcement]);
    }

    // ── Admin-only CRUD ─────────────────────────────────────────

    public function adminIndex(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $announcements = Announcement::orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'data' => $announcements]);
    }

    public function adminStore(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
            'target'  => 'sometimes|in:all,student,tutor',
            'status'  => 'sometimes|in:draft,published',
        ]);

        $announcement = Announcement::create([
            'created_by'   => $request->user()->id,
            'title'        => $request->title,
            'content'      => $request->content,
            'target'       => $request->target ?? 'all',
            'status'       => $request->status ?? 'published',
            'published_at' => ($request->status ?? 'published') === 'published' ? now() : null,
        ]);

        return response()->json(['success' => true, 'announcement' => $announcement], 201);
    }

    public function adminUpdate(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $announcement = Announcement::findOrFail($id);

        $request->validate([
            'title'   => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'target'  => 'sometimes|in:all,student,tutor',
            'status'  => 'sometimes|in:draft,published',
        ]);

        $data = $request->only(['title', 'content', 'target', 'status']);
        if (isset($data['status']) && $data['status'] === 'published' && !$announcement->published_at) {
            $data['published_at'] = now();
        }

        $announcement->update($data);

        return response()->json(['success' => true, 'announcement' => $announcement->fresh()]);
    }

    public function adminDestroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        Announcement::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Announcement deleted.']);
    }
}
