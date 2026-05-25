import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class MessageService {
  static const _base = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://127.0.0.1:8000/api',
  );

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (ApiService.token != null && ApiService.token!.isNotEmpty)
          'Authorization': 'Bearer ${ApiService.token}',
      };

  static Map<String, String> get _authHeaders => {
        'Accept': 'application/json',
        if (ApiService.token != null && ApiService.token!.isNotEmpty)
          'Authorization': 'Bearer ${ApiService.token}',
      };

  // ── Get inbox ────────────────────────────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getInbox({
    required String userId,
  }) async {
    try {
      final res  = await http.get(
        Uri.parse('$_base/chat/conversations'),
        headers: _headers,
      );
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        return List<Map<String, dynamic>>.from(body['data'] as List);
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // ── Get messages between two users ───────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getMessages({
    required String userId,
    required String otherId,
    int limit  = 100,
    int offset = 0,
  }) async {
    try {
      final res  = await http.get(
        Uri.parse('$_base/chat/$otherId/messages'),
        headers: _headers,
      );
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        return List<Map<String, dynamic>>.from(body['data'] as List);
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  // ── Send text message ────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> sendMessage({
    required String senderId,
    required String receiverId,
    required String content,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/chat/send'),
        headers: _headers,
        body: jsonEncode({
          'receiver_id': receiverId,
          'content':     content,
        }),
      );
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // ── Send file or image message ───────────────────────────────────────────────
  static Future<Map<String, dynamic>> sendFile({
    required String    senderId,
    required String    receiverId,
    required Uint8List fileBytes,
    required String    fileName,
    required String    mimeType,
  }) async {
    try {
      final uri     = Uri.parse('$_base/chat/send-file');
      final request = http.MultipartRequest('POST', uri)
        ..headers.addAll(_authHeaders)
        ..fields['receiver_id'] = receiverId
        ..files.add(http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
        ));

      final streamed = await request.send();
      final body     = await streamed.stream.bytesToString();
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (e) {
      return {'success': false, 'message': 'Upload error: $e'};
    }
  }

  // ── Get unread count ─────────────────────────────────────────────────────────
  static Future<int> getUnreadCount({required String userId}) async {
    try {
      final res  = await http.get(
        Uri.parse('$_base/chat/unread-count'),
        headers: _headers,
      );
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] == true && body['data'] != null) {
        return (body['data']['count'] as int?) ?? 0;
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }

  // ── Mark read ────────────────────────────────────────────────────────────────
  /// Messages are automatically marked read by the server when GET /chat/{id}/messages
  /// is called, so this is a no-op kept for API compatibility.
  static Future<void> markRead({
    required String userId,
    required String otherId,
  }) async {
    // Trigger a messages fetch to mark them read on the server.
    await getMessages(userId: userId, otherId: otherId, limit: 1);
  }

  // ── Helper: human-readable file size ─────────────────────────────────────────
  static String formatFileSize(int? bytes) {
    if (bytes == null || bytes <= 0) return '';
    if (bytes < 1024)    return '$bytes B';
    if (bytes < 1048576) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / 1048576).toStringAsFixed(1)} MB';
  }

  // ── Helper: detect if a URL is an image ──────────────────────────────────────
  static bool isImageUrl(String? url) {
    if (url == null || url.isEmpty) return false;
    final lower = url.toLowerCase();
    return lower.endsWith('.jpg')  ||
           lower.endsWith('.jpeg') ||
           lower.endsWith('.png')  ||
           lower.endsWith('.gif')  ||
           lower.endsWith('.webp');
  }
}
