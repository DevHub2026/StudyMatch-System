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
        raterId:   j['raterId']   as String? ?? '',
        raterName: j['raterName'] as String? ?? 'Anonymous',
        score:     (j['score']    as num?)?.toInt() ?? 0,
        review:    j['review']    as String? ?? '',
        createdAt: j['createdAt'] as String? ?? '',
        isOwn:     j['isOwn']     as bool?   ?? false,
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

  static Map<String, String> get _jsonHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_token != null && _token!.isNotEmpty) 'Authorization': 'Bearer $_token',
      };

  // ── Auth ──────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String id, required String name,
    required String email, required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/register'),
      headers: _jsonHeaders,
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    try {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final token = body['token'] as String? ?? body['data']?['token'] as String?;
      if (token != null) setToken(token);
      return {'_statusCode': res.statusCode, ...body};
    } catch (_) {
      return {'_statusCode': res.statusCode, 'success': false, 'message': 'Server error (${res.statusCode})'};
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email, required String password,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/login'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final token = body['token'] as String?;
    if (token != null) setToken(token);
    return body;
  }

  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/auth/change-password'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'current_password': currentPassword,
        'new_password':     newPassword,
        'new_password_confirmation': newPassword,
      }),
    );
    try {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'success': false, 'message': 'Server error (${res.statusCode})'};
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
    required String email, required String name,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/auth/send-otp'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email, 'name': name}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> verifyOtp({
    required String email, required String otp,
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
    String? subject, String? search, String? excludeId,
    String? myRole, String? targetRole,
    List<String>? myStrengths, List<String>? myWeaknesses,
  }) async {
    final params = <String, String>{};
    if (subject    != null && subject.isNotEmpty)    params['subject']      = subject;
    if (search     != null && search.isNotEmpty)     params['search']       = search;
    if (excludeId  != null)                          params['exclude_id']   = excludeId;
    if (myRole     != null && myRole.isNotEmpty)     params['my_role']      = myRole;
    if (targetRole != null && targetRole.isNotEmpty) params['target_role']  = targetRole;
    if (myStrengths != null && myStrengths.isNotEmpty) {
      params['my_strengths'] = jsonEncode(myStrengths);
    }
    if (myWeaknesses != null && myWeaknesses.isNotEmpty) {
      params['my_weaknesses'] = jsonEncode(myWeaknesses);
    }

    try {
      final uri  = Uri.parse('$_base/tutors').replace(queryParameters: params.isEmpty ? null : params);
      final res  = await http.get(uri, headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      if (data is List) {
        return data.map((u) => RealUser.fromJson(u as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) { return []; }
  }

  // ── Match endpoints ───────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> saveMatch({
    required String userId, required String matchedId,
  }) async {
    final res = await http.post(
      Uri.parse('$_base/match-requests/send'),
      headers: _jsonHeaders,
      body: jsonEncode({'receiver_user_id': matchedId}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<List<RealUser>> getMatches(String userId) async {
    try {
      final res  = await http.get(Uri.parse('$_base/match-requests'), headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((u) => RealUser.fromJson(u as Map<String, dynamic>))
            .toList();
      }
      if (data is List) {
        return data.map((u) => RealUser.fromJson(u as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) { return []; }
  }

  static Future<Map<String, dynamic>> removeMatch({
    required String userId, required String matchedId,
  }) async {
    final res = await http.delete(
      Uri.parse('$_base/match-requests/$matchedId/cancel'),
      headers: _jsonHeaders,
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
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
        'rating':   score,
        'comment':  review,
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
      final uri  = Uri.parse('$_base/reviews/tutor/$tutorId');
      final res  = await http.get(uri, headers: _jsonHeaders);
      final body = jsonDecode(res.body);

      final rawList = body is List
          ? body
          : (body is Map ? (body['data'] as List? ?? []) : <dynamic>[]);

      final reviews = rawList.map((r) {
        final m           = r as Map<String, dynamic>;
        final studentUser = (m['student'] as Map<String, dynamic>?)?['user']
                                as Map<String, dynamic>?;
        return TutorReview(
          raterId:   m['student_id']?.toString() ?? '',
          raterName: studentUser?['name'] as String? ?? 'Anonymous',
          score:     (m['rating'] as num?)?.toInt() ?? 0,
          review:    m['comment'] as String? ?? '',
          createdAt: m['created_at'] as String? ?? '',
          isOwn:     m['student_id']?.toString() == raterId,
        );
      }).toList();

      TutorReview? own;
      for (final r in reviews) { if (r.isOwn) { own = r; break; } }

      return ReviewsResult(
        reviews:  reviews,
        myRating: own?.score,
        myReview: own?.review,
      );
    } catch (e) {
      return const ReviewsResult(reviews: []);
    }
  }

  // ── Resources ─────────────────────────────────────────────────────────────
  static Future<List<DBResource>> getResources({
    String? subject, String? search,
  }) async {
    final params = <String, String>{};
    if (subject != null && subject != 'All') params['subject'] = subject;
    if (search  != null && search.isNotEmpty) params['search'] = search;

    try {
      final uri  = Uri.parse('$_base/library').replace(queryParameters: params.isEmpty ? null : params);
      final res  = await http.get(uri, headers: _jsonHeaders);
      final data = jsonDecode(res.body);
      if (data is Map && data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((r) => DBResource.fromJson(r as Map<String, dynamic>))
            .toList();
      }
      if (data is List) {
        return data.map((r) => DBResource.fromJson(r as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) { return []; }
  }

  static Future<Map<String, dynamic>> uploadResource({
    required String uploaderId, required String title,
    required String subject,    required String description,
    required String authorName,
    required Uint8List fileBytes, required String fileName,
  }) async {
    final uri     = Uri.parse('$_base/library');
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll({
      'Accept': 'application/json',
      if (_token != null && _token!.isNotEmpty) 'Authorization': 'Bearer $_token',
    });
    request.fields['uploader_id']  = uploaderId;
    request.fields['title']        = title;
    request.fields['subject']      = subject;
    request.fields['description']  = description;
    request.fields['author_name']  = authorName;
    request.files.add(http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));
    final streamed = await request.send();
    final res      = await http.Response.fromStream(streamed);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}