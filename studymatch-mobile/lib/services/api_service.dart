import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../models/models.dart';

// ── Review model ──────────────────────────────────────────────────────────────
class TutorReview {
  final String raterId;
  final String raterName;
  final int score;
  final String review;
  final String createdAt;
  final bool isOwn;

  const TutorReview({
    required this.raterId,
    required this.raterName,
    required this.score,
    required this.review,
    required this.createdAt,
    required this.isOwn,
  });

  factory TutorReview.fromJson(Map<String, dynamic> j) => TutorReview(
        raterId: j['raterId'] as String? ?? '',
        raterName: j['raterName'] as String? ?? 'Anonymous',
        score: (j['score'] as num?)?.toInt() ?? 0,
        review: j['review'] as String? ?? '',
        createdAt: j['createdAt'] as String? ?? '',
        isOwn: j['isOwn'] as bool? ?? false,
      );
}

class ReviewsResult {
  final List<TutorReview> reviews;
  final int? myRating;
  final String? myReview;

  const ReviewsResult({
    required this.reviews,
    this.myRating,
    this.myReview,
  });
}

// ── ApiService ────────────────────────────────────────────────────────────────
class ApiService {
  /// Laravel API — use 10.0.2.2 on Android emulator, your LAN IP on a physical device.
  static const _base = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://127.0.0.1:8000/api',
  );

  static String? _token;

  static void setToken(String? token) => _token = token;

  static String? get token => _token;

  static Map<String, String> get _jsonHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_token != null && _token!.isNotEmpty)
          'Authorization': 'Bearer $_token',
      };

  static Map<String, String> get _jsonHeadersNoAuth => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  // ── Auth ──────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String id,
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/register'),
      headers: _jsonHeadersNoAuth,
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );

    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final token =
          body['token'] as String? ?? body['data']?['token'] as String?;
      if (token != null) setToken(token);
      return {'_statusCode': res.statusCode, ...body};
    } catch (_) {
      return {
        '_statusCode': res.statusCode,
        'success': false,
        'message': 'Server error (${res.statusCode})'
      };
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/login'),
      headers: _jsonHeadersNoAuth,
      body: jsonEncode({'email': email, 'password': password}),
    );

    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final token =
          body['token'] as String? ?? body['data']?['token'] as String?;
      if (token != null) setToken(token);
      return body;
    } catch (_) {
      return {
        '_statusCode': res.statusCode,
        'success': false,
        'message': 'Server error (${res.statusCode})'
      };
    }
  }

  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final res = await http.put(
        Uri.parse('$_base/profile/password'),
        headers: _jsonHeaders,
        body: jsonEncode({
          'current_password': currentPassword,
          'password': newPassword,
          'password_confirmation': newPassword,
        }),
      );
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200) {
        return {'success': true, ...body};
      }
      return {'success': false, ...body};
    } catch (_) {
      return {'success': false, 'message': 'Server error'};
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    final res = await http.post(
      Uri.parse('$_base/auth/forgot-password'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> sendOtp({
    required String email,
    required String name,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/auth/send-otp'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email, 'name': name}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otp,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/auth/verify-otp'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email, 'otp': otp}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> updateUser(UserModel user) async {
    final res = await http.put(
      Uri.parse('$_base/profile'),
      headers: _jsonHeaders,
      body: jsonEncode(user.toJson()),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getProfile() async {
    try {
      final res = await http.get(
        Uri.parse('$_base/profile'),
        headers: _jsonHeaders,
      );
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'success': false};
    }
  }

  /// POST /profile/avatar-base64 — upload avatar as base64 JSON.
  static Future<Map<String, dynamic>> uploadAvatarBase64({
    required String userId,
    required String base64Photo,
    required String fileName,
    required String mimeType,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/profile/avatar-base64'),
        headers: _jsonHeaders,
        body: jsonEncode({
          'id': userId,
          'photo': base64Photo,
          'fileName': fileName,
          'mimeType': mimeType,
        }),
      );
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'success': false, 'message': 'Network error'};
    }
  }

  /// POST /profile/complete — sets profile_completed = true in the database.
  static Future<Map<String, dynamic>> completeProfile() async {
    try {
      final res = await http.post(
        Uri.parse('$_base/profile/complete'),
        headers: _jsonHeaders,
      );
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'success': false, 'message': 'Network error'};
    }
  }

  // ── Users / Matching ──────────────────────────────────────────────────────
  static Future<List<RealUser>> getUsers({
    String? subject,
    String? search,
    String? excludeId,
    String? myRole,
    String? targetRole,
    List<String>? myStrengths,
    List<String>? myWeaknesses,
  }) async {
    final params = <String, String>{};
    if (subject != null && subject.isNotEmpty) params['subject'] = subject;
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (excludeId != null) params['exclude_id'] = excludeId;
    if (myRole != null && myRole.isNotEmpty) params['my_role'] = myRole;
    if (targetRole != null && targetRole.isNotEmpty) {
      params['target_role'] = targetRole;
    }
    if (myStrengths != null && myStrengths.isNotEmpty) {
      params['my_strengths'] = jsonEncode(myStrengths);
    }
    if (myWeaknesses != null && myWeaknesses.isNotEmpty) {
      params['my_weaknesses'] = jsonEncode(myWeaknesses);
    }

    try {
      final uri = Uri.parse('$_base/tutors')
          .replace(queryParameters: params.isEmpty ? null : params);
      final res = await http.get(uri, headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      if (data is List) {
        return data
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // ── Match endpoints ───────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> saveMatch({
    required String userId,
    required String matchedId,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/match-requests/send'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'sender_id': userId,
        'sender_user_id': userId,
        'user_id': userId,
        'receiver_id': matchedId,
        'receiver_user_id': matchedId,
        'matched_id': matchedId,
      }),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<List<RealUser>> getMatches(String userId) async {
    try {
      final res = await http.get(Uri.parse('$_base/match-requests'),
          headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      if (data is List) {
        return data
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> removeMatch({
    required String userId,
    required String matchedId,
  }) async {
    final res = await http.delete(
      Uri.parse('$_base/match-requests/$matchedId/cancel'),
      headers: _jsonHeaders,
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> acceptMatch({
    required String userId,
    required String matchedId,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/match-requests/$matchedId/accept'),
      headers: _jsonHeaders,
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> declineMatch({
    required String userId,
    required String matchedId,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/match-requests/$matchedId/decline'),
      headers: _jsonHeaders,
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> cancelSession(String sessionId) async {
    final res = await http.delete(
      Uri.parse('$_base/sessions/$sessionId'),
      headers: _jsonHeaders,
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<List<RealUser>> getPendingMatches() async {
    try {
      final res = await http.get(Uri.parse('$_base/match-requests/pending'),
          headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /// GET /match-requests/incoming — raw TutorRequest objects sent TO the current
  /// user (i.e. students who have requested a tutor). Returns the full raw JSON
  /// list so callers can extract both the match-request `id` and the nested user.
  static Future<List<Map<String, dynamic>>> getIncomingRequests() async {
    try {
      final res = await http.get(Uri.parse('$_base/match-requests/incoming'),
          headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return List<Map<String, dynamic>>.from(
            (data['data'] as List).map((e) => e as Map<String, dynamic>));
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<List<StudySession>> getSessions() async {
    try {
      final res =
          await http.get(Uri.parse('$_base/sessions'), headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((s) => StudySession.fromJson(s as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> confirmSession(String sessionId) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/sessions/$sessionId/confirm'),
        headers: _jsonHeaders,
      );
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'success': false, 'message': 'Network error'};
    }
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  /// POST /sessions — book a tutoring session.
  /// Pass [tutorUserId] (the tutor's user ID) from the match card.
  static Future<Map<String, dynamic>> bookSession({
    required String tutorUserId,
    required String studentUserId,
    required DateTime scheduledAt,
    int durationMinutes = 60,
    String? notes,
    String? subject,
    String? sessionType,
    String? sessionLink,
  }) async {
    try {
      final body = <String, dynamic>{
        'tutor_user_id': tutorUserId,
        'student_user_id': studentUserId,
        'scheduled_at': scheduledAt.toUtc().toIso8601String(),
        'duration_minutes': durationMinutes,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (sessionType != null && sessionType.isNotEmpty)
          'session_type': sessionType,
        if (sessionLink != null && sessionLink.isNotEmpty)
          'session_link': sessionLink,
      };
      final res = await http.post(
        Uri.parse('$_base/sessions'),
        headers: _jsonHeaders,
        body: jsonEncode(body),
      );
      try {
        final decoded = jsonDecode(res.body) as Map<String, dynamic>;
        // API returns HTTP 201 with {message, session} on success — no
        // 'success' key. Normalise so callers can check result['success'].
        if (res.statusCode == 201 || decoded.containsKey('session')) {
          return {'success': true, ...decoded};
        }
        return decoded;
      } catch (_) {
        return {
          'success': false,
          'message': 'Server error (${res.statusCode})'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // ── Rating & Review ───────────────────────────────────────────────────────

  /// Submit a star rating + optional written review for a tutor.
  static Future<Map<String, dynamic>> rateUser({
    required String raterId,
    required String ratedId,
    required int score,
    String review = '',
    String? tutorRequestId,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/reviews'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'tutor_id': ratedId,
        'rating': score,
        'comment': review,
        if (tutorRequestId != null) 'tutor_request_id': tutorRequestId,
      }),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  /// Fetch all reviews for a tutor.
  /// Pass [raterId] to mark the caller's own review with [TutorReview.isOwn].
  static Future<ReviewsResult> getReviews({
    required String tutorId,
    String? raterId,
  }) async {
    try {
      final uri = Uri.parse('$_base/reviews/tutor/$tutorId');
      final res = await http.get(uri, headers: _jsonHeaders);
      final body = jsonDecode(res.body);

      final rawList = body is List
          ? body
          : (body is Map ? (body['data'] as List? ?? []) : <dynamic>[]);

      final reviews = rawList.map((r) {
        final m = r as Map<String, dynamic>;
        final studentUser = (m['student'] as Map<String, dynamic>?)?['user']
            as Map<String, dynamic>?;
        return TutorReview(
          raterId: m['student_id']?.toString() ?? '',
          raterName: studentUser?['name'] as String? ?? 'Anonymous',
          score: (m['rating'] as num?)?.toInt() ?? 0,
          review: m['comment'] as String? ?? '',
          createdAt: m['created_at'] as String? ?? '',
          isOwn: m['student_id']?.toString() == raterId,
        );
      }).toList();

      TutorReview? own;
      for (final r in reviews) {
        if (r.isOwn) {
          own = r;
          break;
        }
      }

      return ReviewsResult(
        reviews: reviews,
        myRating: own?.score,
        myReview: own?.review,
      );
    } catch (e) {
      return const ReviewsResult(reviews: []);
    }
  }

  // ── Resources ─────────────────────────────────────────────────────────────
  static Future<List<DBResource>> getResources({
    String? subject,
    String? search,
  }) async {
    final params = <String, String>{};
    if (subject != null && subject != 'All') params['subject'] = subject;
    if (search != null && search.isNotEmpty) params['search'] = search;

    try {
      final uri = Uri.parse('$_base/library')
          .replace(queryParameters: params.isEmpty ? null : params);
      final res = await http.get(uri, headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      List<dynamic> rawList = [];
      if (data is Map) {
        // Handles both {success:true, data:[...]} and Laravel paginator {data:[...]}
        if (data['data'] is List) {
          rawList = data['data'] as List;
        }
      } else if (data is List) {
        rawList = data;
      }
      return rawList
          .map((r) => DBResource.fromJson(r as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> uploadResource({
    required String uploaderId,
    required String title,
    required String subject,
    required String description,
    required String authorName,
    required Uint8List fileBytes,
    required String fileName,
  }) async {
    final uri = Uri.parse('$_base/library');
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll({
      'Accept': 'application/json',
      if (_token != null && _token!.isNotEmpty)
        'Authorization': 'Bearer $_token',
    });
    request.fields['uploader_id'] = uploaderId;
    request.fields['title'] = title;
    request.fields['subject'] = subject;
    request.fields['description'] = description;
    request.fields['author_name'] = authorName;
    request.files.add(
        http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
