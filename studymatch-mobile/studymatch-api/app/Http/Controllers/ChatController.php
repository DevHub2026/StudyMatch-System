<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::with(['participantOne', 'participantTwo', 'latestMessage'])
            ->where('participant_one_id', $userId)
            ->orWhere('participant_two_id', $userId)
            ->latest('last_message_at')
            ->get()
            ->map(function ($conv) use ($userId) {
                $conv->other_user = $conv->otherParticipant($userId);
                $conv->unread_count = $conv->messages()
                    ->where('sender_id', '!=', $userId)
                    ->where('is_read', false)
                    ->count();
                return $conv;
            });

        return response()->json(['conversations' => $conversations]);
    }

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
            ->with('sender')
            ->latest()
            ->paginate(50);

        return response()->json([
            'conversation' => $conversation,
            'messages'     => $messages,
        ]);
    }

    public function send(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content'     => 'required|string|max:5000',
        ]);

        $user    = $request->user();
        $partner = User::findOrFail($request->receiver_id);

        if ($user->id === $partner->id) {
            return response()->json(['message' => 'Cannot send a message to yourself.'], 422);
        }

        $conversation = $this->findOrCreateConversation($user->id, $partner->id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'content'         => $request->content,
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json(['message' => $message->load('sender')], 201);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;

        $count = Message::where('is_read', false)
            ->where('sender_id', '!=', $userId)
            ->whereHas('conversation', fn ($q) => $q
                ->where('participant_one_id', $userId)
                ->orWhere('participant_two_id', $userId))
            ->count();

        return response()->json(['count' => $count]);
    }

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
            return response()->json(['message' => 'Cannot send a file to yourself.'], 422);
        }

        $file      = $request->file('file');
        $mime      = $file->getMimeType();
        $isImage   = str_starts_with($mime, 'image/');
        $storedPath = $file->store('chat-files', 'public');

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

        return response()->json(['message' => $message->load('sender')], 201);
    }

    private function findOrCreateConversation(int $userA, int $userB): Conversation
    {
        // Always store with lower ID as participant_one to ensure uniqueness
        [$one, $two] = $userA < $userB ? [$userA, $userB] : [$userB, $userA];

        return Conversation::firstOrCreate(
            ['participant_one_id' => $one, 'participant_two_id' => $two]
        );
    }
}
