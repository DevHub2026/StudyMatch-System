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
}
