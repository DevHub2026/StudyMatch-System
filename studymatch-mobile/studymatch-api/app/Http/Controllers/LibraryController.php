<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LibraryController extends Controller
{
    public function index(Request $request)
    {
        $query = Resource::with(['uploader', 'subject']);

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('search')) {
            $query->where('title', 'LIKE', "%{$request->search}%");
        }

        if ($request->filled('type')) {
            $query->where('file_type', 'LIKE', "%{$request->type}%");
        }

        $resources = $query->latest()->paginate(20);

        return response()->json($resources);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'      => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'subject_id' => 'nullable|exists:subjects,id',
            'file'       => 'required|file|max:51200', // 50 MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('library', 'public');

        $resource = Resource::create([
            'uploader_id'  => $request->user()->id,
            'subject_id'   => $request->subject_id,
            'title'        => $request->title,
            'description'  => $request->description,
            'file_path'    => $path,
            'file_name'    => $file->getClientOriginalName(),
            'file_size'    => $file->getSize(),
            'file_type'    => $file->getClientMimeType(),
        ]);

        return response()->json(['message' => 'Resource uploaded.', 'resource' => $resource], 201);
    }

    public function download($id)
    {
        $resource = Resource::findOrFail($id);

        if (!Storage::disk('public')->exists($resource->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $resource->increment('download_count');

        return Storage::disk('public')->download($resource->file_path, $resource->file_name);
    }
}
