<?php

namespace App\Http\Controllers;

use App\Models\Resource;
use App\Models\ResourceDownloadLog;
use App\Models\ResourceFavorite;
use App\Models\ResourceFolder;
use App\Models\ResourceShare;
use App\Models\TutorRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LibraryController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'student') {
            $query = Resource::query();
            $this->applyScope($query, $request, $user); // uses shared scope for students
            $ids = $query->pluck('id');

            return response()->json([
                'total_resources'  => $ids->count(),
                'total_downloads'  => Resource::whereIn('id', $ids)->sum('download_count'),
                'students_reached' => 0,
                'folders'          => ResourceFolder::where('user_id', $user->id)->count(),
            ]);
        }

        $resourceIds = $this->ownedResourceIds($user);

        return response()->json([
            'total_resources'  => count($resourceIds),
            'total_downloads'  => Resource::whereIn('id', $resourceIds)->sum('download_count'),
            'students_reached' => ResourceDownloadLog::whereIn('resource_id', $resourceIds)
                ->where('user_id', '!=', $user->id)
                ->distinct()
                ->count('user_id'),
            'folders'          => ResourceFolder::where('user_id', $user->id)->count(),
        ]);
    }

    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Resource::with(['uploader', 'subject', 'folder'])
            ->withCount(['shares', 'favorites']);

        $this->applyScope($query, $request, $user);
        $this->applyFilters($query, $request);
        $this->applySort($query, $request);
        $perPage   = min((int) $request->input('per_page', 50), 100);
        $paginator = $query->paginate($perPage);

        $favoriteIds = ResourceFavorite::where('user_id', $user->id)
            ->whereIn('resource_id', collect($paginator->items())->pluck('id'))
            ->pluck('resource_id')
            ->all();
        $paginator->getCollection()->transform(function (Resource $resource) use ($favoriteIds) {
            return $this->formatResource($resource, $favoriteIds);
        });


        return response()->json($paginator);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'subject_id'  => 'nullable|exists:subjects,id',
            'folder_id'   => 'nullable|exists:resource_folders,id',
            'file'        => 'required|file|max:51200',
        ]);

        $user = $request->user();

        if ($request->filled('folder_id')) {
            // Verifies the folder belongs to this user (throws 404 otherwise)
            ResourceFolder::where('user_id', $user->id)->findOrFail($request->folder_id);
        }

        $file  = $request->file('file');
        $path  = $file->store('library', 'public');
        $title = $request->title ?: $file->getClientOriginalName();

        $resource = Resource::create([
            'uploader_id'  => $user->id,
            'subject_id'   => $request->subject_id,
            'folder_id'    => $request->folder_id,
            'title'        => $title,
            'description'  => $request->description,
            'file_path'    => $path,
            'file_name'    => $file->getClientOriginalName(),
            'file_size'    => $file->getSize(),
            'file_type'    => $file->getClientMimeType(),
        ]);

        $resource->load(['uploader', 'subject', 'folder']);
        $resource->loadCount(['shares', 'favorites']);

        return response()->json([
            'message'  => 'Resource uploaded.',
            'resource' => $this->formatResource($resource, []),
        ], 201);
    }

    public function download(Request $request, int $id)
    {
        $resource = Resource::findOrFail($id);
        $user     = $request->user();

        abort_unless($this->canAccess($user, $resource), 403, 'You do not have access to this resource.');

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if (!$disk->exists($resource->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $resource->increment('download_count');

        ResourceDownloadLog::firstOrCreate([
            'resource_id' => $resource->id,
            'user_id'     => $user->id,
        ]);

        return $disk->download(
            $resource->file_path,
            $resource->file_name ?: basename($resource->file_path)
        );
    }

    public function preview(Request $request, int $id)
    {
        $resource = Resource::findOrFail($id);
        $user     = $request->user();

        abort_unless($this->canAccess($user, $resource), 403);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        if (!$disk->exists($resource->file_path)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        $url = $disk->url($resource->file_path);

        return response()->json([
            'preview_url' => $url,
            'file_type'   => $resource->file_type,
            'file_name'   => $resource->file_name,
            'is_image'    => Str::startsWith($resource->file_type ?? '', 'image/'),
            'is_pdf'      => ($resource->file_type ?? '') === 'application/pdf'
                || Str::endsWith(strtolower($resource->file_name ?? ''), '.pdf'),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $resource = Resource::findOrFail($id);
        $user     = $request->user();

        abort_unless($resource->uploader_id === $user->id, 403, 'Only the uploader can delete this resource.');

        if (Storage::disk('public')->exists($resource->file_path)) {
            Storage::disk('public')->delete($resource->file_path);
        }

        $resource->delete();

        return response()->json(['message' => 'Resource deleted.']);
    }

    public function foldersIndex(Request $request)
    {
        $folders = ResourceFolder::with('subject')
            ->where('user_id', $request->user()->id)
            ->withCount('resources')
            ->latest()
            ->get();

        return response()->json(['folders' => $folders]);
    }

    public function foldersStore(Request $request)
    {
        $request->validate([
            'name'       => 'required|string|max:120',
            'subject_id' => 'nullable|exists:subjects,id',
        ]);

        $folder = ResourceFolder::create([
            'user_id'    => $request->user()->id,
            'name'       => $request->name,
            'subject_id' => $request->subject_id,
        ]);

        $folder->load('subject');
        $folder->loadCount('resources');

        return response()->json(['message' => 'Folder created.', 'folder' => $folder], 201);
    }

    public function shareTargets(Request $request)
    {
        $user  = $request->user();
        $tutor = $user->tutor;

        if (!$tutor) {
            return response()->json(['students' => []]);
        }

        $students = TutorRequest::with('student.user')
            ->where('tutor_id', $tutor->id)
            ->where('status', 'accepted')
            ->get()
            ->map(fn ($tr) => [
                'user_id' => $tr->student?->user?->id,
                'name'    => $tr->student?->user?->name ?? 'Student',
            ])
            ->filter(fn ($s) => $s['user_id'])
            ->values();

        return response()->json(['students' => $students]);
    }

    public function share(Request $request, int $id)
    {
        $request->validate([
            'user_ids'   => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $resource = Resource::findOrFail($id);
        $user     = $request->user();

        abort_unless($resource->uploader_id === $user->id, 403);

        foreach ($request->user_ids as $targetId) {
            ResourceShare::firstOrCreate([
                'resource_id'         => $resource->id,
                'shared_with_user_id' => $targetId,
            ], [
                'shared_by_user_id' => $user->id,
            ]);
        }

        $resource->loadCount('shares');

        return response()->json([
            'message'                => 'Resource shared.',
            'shared_students_count'  => $resource->shares_count,
        ]);
    }

    public function toggleFavorite(Request $request, int $id)
    {
        $resource = Resource::findOrFail($id);
        $user     = $request->user();

        abort_unless($this->canAccess($user, $resource), 403);

        $existing = ResourceFavorite::where('user_id', $user->id)
            ->where('resource_id', $resource->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['message' => 'Removed from favorites.', 'is_favorited' => false]);
        }

        ResourceFavorite::create([
            'user_id'     => $user->id,
            'resource_id' => $resource->id,
        ]);

        return response()->json(['message' => 'Added to favorites.', 'is_favorited' => true]);
    }

    private function applyScope(\Illuminate\Database\Eloquent\Builder $query, Request $request, \App\Models\User $user): void
    {
        $scope = $request->input('scope', 'all');

        if ($scope === 'mine') {
            $query->where('uploader_id', $user->id);
            return;
        }

        if ($scope === 'shared') {
            if ($user->role === 'tutor' || $user->tutor) {
                $query->where('uploader_id', $user->id)->whereHas('shares');
            } else {
                $query->whereHas('shares', fn ($q) => $q->where('shared_with_user_id', $user->id));
            }
            return;
        }

        if ($scope === 'favorites') {
            $query->whereHas('favorites', fn ($q) => $q->where('user_id', $user->id));
            return;
        }

        if ($user->role === 'student') {
            // Students only see resources their tutors explicitly shared with them
            $query->whereHas('shares', fn ($sq) => $sq->where('shared_with_user_id', $user->id));
            return;
        }

        $query->where('uploader_id', $user->id);
    }

    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, Request $request): void
    {
        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->folder_id);
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('file_name', 'LIKE', "%{$search}%")
                    ->orWhereHas('subject', fn ($sq) => $sq->where('name', 'LIKE', "%{$search}%"));
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $extensions = $this->typeExtensions($request->type);
            $query->where(function ($q) use ($extensions) {
                foreach ($extensions as $ext) {
                    $q->orWhere('file_name', 'LIKE', "%.{$ext}");
                }
            });
        }
    }

    private function applySort(\Illuminate\Database\Eloquent\Builder $query, Request $request): void
    {
        $sort = $request->input('sort', 'newest');

        match ($sort) {
            'oldest'       => $query->oldest(),
            'downloads'    => $query->orderByDesc('download_count')->latest(),
            'alphabetical' => $query->orderBy('title'),
            default        => $query->latest(),
        };
    }

    private function typeExtensions(string $type): array
    {
        return match (strtolower($type)) {
            'pdf'   => ['pdf'],
            'docx'  => ['doc', 'docx'],
            'ppt'   => ['ppt', 'pptx'],
            'xlsx'  => ['xls', 'xlsx'],
            'video' => ['mp4', 'mov', 'webm', 'avi'],
            'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            default => [strtolower($type)],
        };
    }

    private function canAccess(\App\Models\User $user, Resource $resource): bool
    {
        if ($resource->uploader_id === $user->id) {
            return true;
        }

        return ResourceShare::where('resource_id', $resource->id)
            ->where('shared_with_user_id', $user->id)
            ->exists();
    }

    private function ownedResourceIds(\App\Models\User $user): array
    {
        return Resource::where('uploader_id', $user->id)->pluck('id')->all();
    }

    private function formatResource(Resource $resource, array $favoriteIds): array
    {
        $data = $resource->toArray();
        $data['subject_name'] = $resource->subject?->name;
        $data['uploader_name'] = $resource->uploader?->name;
        $data['folder_name'] = $resource->folder?->name;
        $data['shared_students_count'] = $resource->shares_count ?? $resource->shares()->count();
        $data['is_favorited'] = in_array($resource->id, $favoriteIds, true);
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $data['preview_url'] = ($resource->file_path && $disk->exists($resource->file_path))
            ? $disk->url($resource->file_path)
            : null;
        $data['file_extension'] = strtolower(pathinfo($resource->file_name ?? $resource->title ?? '', PATHINFO_EXTENSION));

        return $data;
    }
}
