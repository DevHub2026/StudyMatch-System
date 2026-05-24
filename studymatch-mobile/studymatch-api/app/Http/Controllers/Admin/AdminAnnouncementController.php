<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AdminAnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::with('creator');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('target')) {
            $query->where('target', $request->target);
        }

        $announcements = $query->latest()->paginate((int) $request->input('per_page', 20));

        return response()->json($announcements);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'required|string',
            'status'       => 'sometimes|in:draft,published,archived',
            'target'       => 'sometimes|in:all,students,tutors',
            'is_pinned'    => 'boolean',
            'published_at' => 'nullable|date',
            'expires_at'   => 'nullable|date',
        ]);

        $status = $request->input('status', 'draft');

        /** @var \App\Models\User $admin */
        $admin = $request->user();

        $announcement = Announcement::create([
            'created_by'   => $admin->id,
            'title'        => $request->title,
            'content'      => $request->content,
            'status'       => $status,
            'target'       => $request->input('target', 'all'),
            'is_pinned'    => $request->boolean('is_pinned'),
            'published_at' => $status === 'published' ? ($request->published_at ?? now()) : $request->published_at,
            'expires_at'   => $request->expires_at,
        ]);

        return response()->json(['message' => 'Announcement created.', 'announcement' => $announcement], 201);
    }

    public function update(Request $request, int $id)
    {
        $announcement = Announcement::findOrFail($id);

        $request->validate([
            'title'      => 'sometimes|string|max:255',
            'content'    => 'sometimes|string',
            'status'     => 'sometimes|in:draft,published,archived',
            'target'     => 'sometimes|in:all,students,tutors',
            'is_pinned'  => 'boolean',
            'expires_at' => 'nullable|date',
        ]);

        $data = $request->only(['title', 'content', 'status', 'target', 'is_pinned', 'expires_at']);

        if (($data['status'] ?? null) === 'published' && $announcement->status !== 'published') {
            $data['published_at'] = now();
        }

        $announcement->update($data);

        return response()->json(['message' => 'Announcement updated.', 'announcement' => $announcement->fresh()]);
    }

    public function destroy(int $id)
    {
        Announcement::findOrFail($id)->delete();

        return response()->json(['message' => 'Announcement deleted.']);
    }
}
