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

        // Mobile sends subject as a plain name string (not an ID)
        if ($request->filled('subject') && !$request->filled('subject_id')) {
            $query->whereHas('subject', fn ($q) => $q->where('name', 'LIKE', "%{$request->subject}%"));
        }

        if ($request->filled('search')) {
            $query->where('title', 'LIKE', "%{$request->search}%");
        }

        if ($request->filled('type')) {
            $query->where('file_type', 'LIKE', "%{$request->type}%");
        }

        $paginator = $query->latest()->paginate(20);

        // Append mobile-friendly aliases to each item without breaking web clients
        $paginator->setCollection(
            $paginator->getCollection()->map(fn ($r) => array_merge($r->toArray(), [
                'uploaderName' => $r->uploader?->name ?? 'Unknown',
                'subjectName'  => $r->subject?->name ?? '',
                'fileUrl'      => $r->file_path ? Storage::url($r->file_path) : null,
                'uploadedAt'   => $r->created_at?->toIso8601String() ?? '',
            ]))
        );

        return response()->json($paginator);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'subject_id'  => 'nullable|exists:subjects,id',
            'subject'     => 'nullable|string|max:255',
            'file'        => 'required|file|max:51200', // 50 MB max
        ]);

        // Resolve subject_id from name when mobile sends a plain string
        $subjectId = $request->subject_id;
        if (!$subjectId && $request->filled('subject')) {
            $subjectId = \App\Models\Subject::where('name', 'LIKE', "%{$request->subject}%")
                ->value('id');
        }

        $file = $request->file('file');
        $path = $file->store('library', 'public');

        $resource = Resource::create([
            'uploader_id'  => $request->user()->id,
            'subject_id'   => $subjectId,
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
