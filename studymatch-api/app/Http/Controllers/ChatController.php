<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    /**
     * GET /chat/conversations
     * Returns the inbox in the camelCase format expected by the Flutter MessagesScreen.
     */
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::with([
                'participantOne.student.weakSubjects.subject',
                'participantOne.tutor.strongSubjects.subject',
                'participantTwo.student.weakSubjects.subject',
                'participantTwo.tutor.strongSubjects.subject',
                'latestMessage',
            ])
            ->where(function ($q) use ($userId) {
                $q->where('participant_one_id', $userId)
                  ->orWhere('participant_two_id', $userId);
            })
            ->latest('last_message_at')
            ->get();

        $data = $conversations->map(function ($conv) use ($userId) {
            $other = $conv->participant_one_id === $userId
                ? $conv->participantTwo
                : $conv->participantOne;

            if (!$other) return null;

            $unreadCount = $conv->messages()
                ->where('sender_id', '!=', $userId)
                ->where('is_read', false)
                ->count();

            $latest = $conv->latestMessage;

            $subjects   = $this->subjectsFor($other);
            $strengths  = $other->isTutor()  ? $subjects : [];
            $weaknesses = $other->isStudent() ? $subjects : [];

            return [
                'participantId'            => (string) $other->id,
                'participantName'          => $other->name,
                'participantEmail'         => $other->email,
                'participantRole'          => $other->role,
                'participantDept'          => $other->student?->program ?? $other->tutor?->specialization,
                'participantSchool'        => null,
                'participantBio'           => $other->bio ?? $other->student?->bio ?? $other->tutor?->bio,
                'participantRating'        => (float) ($other->tutor?->average_rating ?? 0),
                'participantRatingCount'   => (int) ($other->tutor?->reviews_count ?? 0),
                'participantSubjects'      => $subjects,
                'participantStrengths'     => $strengths,
                'participantWeaknesses'    => $weaknesses,
                'participantLearningStyles'=> $other->learning_styles ?? [],
                'participantStudyStyles'   => $other->study_styles ?? [],
                'lastMessage'              => $latest?->content ?? '',
                'lastMessageType'          => $latest?->message_type ?? 'text',
                'lastMessageTime'          => $latest?->created_at?->toIso8601String() ?? '',
                'lastMessageSenderId'      => $latest ? (string) $latest->sender_id : '',
                'unreadCount'              => $unreadCount,
            ];
        })->filter()->values();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /chat/{partnerId}/messages
     * Returns messages in ascending (oldest-first) order in camelCase format.
     */
    public function messages(Request $request, $partnerId)
    {
        $user    = $request->user();
        $partner = User::findOrFail($partnerId);

        $conversation = $this->findOrCreateConversation($user->id, $partner->id);

        // Mark incoming messages as read
        $conversation->messages()
            ->where('sender_id', $partner->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = $conversation->messages()
            ->oldest()
            ->get()
            ->map(fn ($m) => $this->formatMessage($m, $user->id, $partner->id));

        return response()->json(['success' => true, 'data' => $messages]);
    }

    /**
     * POST /chat/send
     * Body: { receiver_id, content }
     */
    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content'     => 'required|string|max:5000',
        ]);

        $user    = $request->user();
        $partner = User::findOrFail($request->receiver_id);

        if ($user->id === $partner->id) {
            return response()->json(['success' => false, 'message' => 'Cannot send a message to yourself.'], 422);
        }

        $conversation = $this->findOrCreateConversation($user->id, $partner->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'content'         => $request->content,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json(['success' => true, 'data' => $this->formatMessage($message, $user->id, $partner->id)], 201);
    }

    /**
     * POST /chat/send-file
     * Multipart: receiver_id + file
     */
    public function sendFile(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'file'        => 'required|file|max:10240|mimes:jpeg,jpg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip',
            'caption'     => 'nullable|string|max:500',
        ]);

        $user    = $request->user();
        $partner = User::findOrFail($request->receiver_id);

        if ($user->id === $partner->id) {
            return response()->json(['success' => false, 'message' => 'Cannot send a file to yourself.'], 422);
        }

        $file        = $request->file('file');
        $mime        = $file->getMimeType();
        $isImage     = str_starts_with($mime, 'image/');
        $storedPath  = $file->store('chat-files', 'public');

        $conversation = $this->findOrCreateConversation($user->id, $partner->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'message_type'    => $isImage ? 'image' : 'file',
            'content'         => $request->input('caption'),
            'file_path'       => Storage::url($storedPath),
            'file_name'       => $file->getClientOriginalName(),
            'file_size'       => $file->getSize(),
            'file_mime'       => $mime,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json(['success' => true, 'data' => $this->formatMessage($message, $user->id, $partner->id)], 201);
    }

    /**
     * GET /chat/unread-count
     */
    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $count = Message::where('is_read', false)
            ->where('sender_id', '!=', $userId)
            ->whereHas('conversation', fn ($q) => $q
                ->where('participant_one_id', $userId)
                ->orWhere('participant_two_id', $userId))
            ->count();

        return response()->json(['success' => true, 'data' => ['count' => $count]]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function findOrCreateConversation(int $userA, int $userB): Conversation
    {
        [$one, $two] = $userA < $userB ? [$userA, $userB] : [$userB, $userA];

        return Conversation::firstOrCreate(
            ['participant_one_id' => $one, 'participant_two_id' => $two]
        );
    }

    private function formatMessage(Message $m, int $myId, int $partnerId): array
    {
        $isMe       = $m->sender_id === $myId;
        $receiverId = $isMe ? $partnerId : $myId;

        return [
            'id'          => (string) $m->id,
            'senderId'    => (string) $m->sender_id,
            'receiverId'  => (string) $receiverId,
            'content'     => $m->content ?? '',
            'messageType' => $m->message_type ?? 'text',
            'fileUrl'     => $m->file_path,
            'fileName'    => $m->file_name,
            'fileSize'    => $m->file_size,
            'isRead'      => (bool) $m->is_read,
            'createdAt'   => $m->created_at?->toIso8601String() ?? '',
        ];
    }

    private function subjectsFor(User $user): array
    {
        if ($user->student && $user->student->weakSubjects) {
            return $user->student->weakSubjects
                ->map(fn ($ws) => $ws->subject?->name)
                ->filter()
                ->values()
                ->all();
        }
        if ($user->tutor && $user->tutor->strongSubjects) {
            return $user->tutor->strongSubjects
                ->map(fn ($ts) => $ts->subject?->name)
                ->filter()
                ->values()
                ->all();
        }
        return [];
    }
}
