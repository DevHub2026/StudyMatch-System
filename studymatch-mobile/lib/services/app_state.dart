import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:typed_data';
import '../models/models.dart';
import 'api_service.dart';
import 'message_service.dart';
import 'package:flutter/foundation.dart';

enum AuthState { unauthenticated, onboarding, authenticated }

class AppState extends ChangeNotifier {
  UserModel? _currentUser;
  int _onboardingStep = 0;
  static const int _totalOnboardingSteps = 5;
  int get totalOnboardingSteps => _totalOnboardingSteps;

  List<RealUser> _matchUsers = [];
  List<RealUser> _matchedUsers = [];
  List<RealUser> _pendingMatchUsers = [];
  List<StudySession> _sessions = [];
  List<String> _passedIds = [];
  List<DBResource> _dbResources = [];
  bool _loadingUsers = false;
  bool _loadingResources = false;
  final List<Conversation> _conversations = [];

  UserModel? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;
  int get onboardingStep => _onboardingStep;
  List<RealUser> get matchUsers => List.unmodifiable(_matchUsers);
  List<RealUser> get matchedUsers => List.unmodifiable(_matchedUsers);
  List<RealUser> get pendingMatchUsers => List.unmodifiable(_pendingMatchUsers);
  List<StudySession> get sessions => List.unmodifiable(_sessions);
  List<DBResource> get dbResources => List.unmodifiable(_dbResources);
  bool get loadingUsers => _loadingUsers;
  bool get loadingResources => _loadingResources;
  List<Conversation> get conversations => List.unmodifiable(_conversations);

  int get unreadMessageCount =>
      _conversations.fold(0, (sum, c) => sum + c.unreadCount);

  AuthState get authState {
    if (_currentUser == null) return AuthState.unauthenticated;
    if (!_currentUser!.onboardingComplete) return AuthState.onboarding;
    return AuthState.authenticated;
  }

  AppState() {
    _loadSession();
  }

  // ── Session ───────────────────────────────────────────────────────────────
  Future<void> _loadSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('sm_session');
      if (raw != null) {
        final decoded = jsonDecode(raw);
        if (decoded is Map<String, dynamic>) {
          final candidate = UserModel.fromJson(decoded);
          // Sessions saved before token persistence was added have no token.
          // Clear them so the user is prompted to log in again rather than
          // reaching screens that will immediately get 401 responses.
          if (candidate.token == null || candidate.token!.isEmpty) {
            await _clearSession();
            return;
          }
          _currentUser = candidate;
          ApiService.setToken(_currentUser!.token);
          notifyListeners();
          if (_currentUser!.onboardingComplete) {
            await _loadPassedIds();
            await _loadMatchedUsersFromDb();
            await loadPendingMatches();
            await loadSessions();
            await loadMatchUsers();
            await loadResources();
          }
        }
      }
    } catch (e) {
      await _clearSession();
    }
  }

  Future<void> _saveSession(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('sm_session', jsonEncode(user.toJson()));
  }

  Future<void> _clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('sm_session');
  }

  // ── Load matches from DB ──────────────────────────────────────────────────
  Future<void> _loadMatchedUsersFromDb() async {
    if (_currentUser == null) return;
    try {
      _matchedUsers = await ApiService.getMatches(_currentUser!.id);
      notifyListeners();
    } catch (_) {
      _matchedUsers = [];
    }
  }

  Future<void> loadPendingMatches() async {
    if (_currentUser == null) return;
    try {
      _pendingMatchUsers = await ApiService.getPendingMatches();
      notifyListeners();
    } catch (_) {
      _pendingMatchUsers = [];
    }
  }

  Future<void> refreshMatches() async {
    await _loadMatchedUsersFromDb();
    await loadPendingMatches();
  }

  Future<void> loadSessions() async {
    if (_currentUser == null) return;
    try {
      _sessions = await ApiService.getSessions();
      notifyListeners();
    } catch (_) {
      _sessions = [];
    }
  }

  // ── Passed IDs ────────────────────────────────────────────────────────────
  Future<void> _loadPassedIds() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('sm_passed_${_currentUser?.id}');
    if (raw != null) {
      _passedIds = List<String>.from(jsonDecode(raw) as List);
    }
  }

  Future<void> _savePassedIds() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        'sm_passed_${_currentUser?.id}', jsonEncode(_passedIds));
  }

  // ── Load match deck ───────────────────────────────────────────────────────
  Future<void> loadMatchUsers({String? subject, String? search}) async {
    _loadingUsers = true;
    notifyListeners();
    try {
      // A tutor should see students (and vice-versa).
      final targetRole = (_currentUser?.role == 'tutor') ? 'student' : 'tutor';
      final all = await ApiService.getUsers(
        subject: subject,
        search: search,
        excludeId: _currentUser?.id,
        myRole: _currentUser?.role,
        targetRole: targetRole,
        myStrengths: _currentUser?.strengths,
        myWeaknesses: _currentUser?.weaknesses,
      );
      final excludeIds = {
        ..._matchedUsers.map((u) => u.id),
        ..._pendingMatchUsers.map((u) => u.id),
        ..._passedIds,
      };
      final candidates = all.where((u) => !excludeIds.contains(u.id)).toList();
      _matchUsers = currentUserHasAttributes
          ? candidates.where(isCompatible).toList()
          : candidates;
    } catch (_) {
      _matchUsers = [];
    }
    _loadingUsers = false;
    notifyListeners();
  }

  // ── Load resources ────────────────────────────────────────────────────────
  Future<void> loadResources({String? subject, String? search}) async {
    _loadingResources = true;
    notifyListeners();
    try {
      _dbResources =
          await ApiService.getResources(subject: subject, search: search);
    } catch (_) {
      _dbResources = [];
    }
    _loadingResources = false;
    notifyListeners();
  }

  // ── Upload resource ───────────────────────────────────────────────────────
  Future<Map<String, dynamic>> uploadResource({
    required String title,
    required String subject,
    required String description,
    required String authorName,
    required Uint8List fileBytes,
    required String fileName,
  }) async {
    final result = await ApiService.uploadResource(
      uploaderId: _currentUser!.id,
      title: title,
      subject: subject,
      description: description,
      authorName: authorName,
      fileBytes: fileBytes,
      fileName: fileName,
    );
    if (result['success'] == true) await loadResources();
    return result;
  }

  // ── MIME helper ───────────────────────────────────────────────────────────
  static String _mimeFromExt(String ext) {
    switch (ext.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  // ── Upload profile photo ──────────────────────────────────────────────────
  /// Sends the photo as base64 JSON to POST /api/profile/avatar-base64.
  /// The backend stores the file and returns a full public URL which is
  /// stored directly in the session so ProfileAvatar can display it.
  Future<String?> uploadProfilePhoto({
    required Uint8List photoBytes,
    required String fileName,
  }) async {
    if (_currentUser == null) return null;
    try {
      final ext = fileName.contains('.')
          ? fileName.split('.').last.toLowerCase()
          : 'jpg';
      final base64Photo = base64Encode(photoBytes);

      final data = await ApiService.uploadAvatarBase64(
        userId: _currentUser!.id,
        base64Photo: base64Photo,
        fileName: fileName,
        mimeType: _mimeFromExt(ext),
      );

      if (data['success'] == true) {
        final url = data['url'] as String?;
        if (url == null || url.isEmpty) {
          debugPrint('Photo upload: no url in response');
          return null;
        }

        debugPrint('Photo uploaded, storing url: $url');
        final json = _currentUser!.toJson()..['profilePhotoUrl'] = url;
        _currentUser = UserModel.fromJson(json);
        await _saveSession(_currentUser!);
        notifyListeners();
        return url;
      }

      debugPrint('Photo upload failed: ${data['message']}');
      return null;
    } catch (e) {
      debugPrint('Photo upload error: $e');
      return null;
    }
  }

  // ── Rate user ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> rateUser({
    required String ratedId,
    required int score,
    String review = '',
  }) async {
    try {
      final result = await ApiService.rateUser(
        raterId: _currentUser!.id,
        ratedId: ratedId,
        score: score,
        review: review,
      );
      if (result['success'] == true) {
        final data = result['data'] as Map<String, dynamic>?;
        _updateRatingInList(_matchUsers, ratedId, data);
        _updateRatingInList(_matchedUsers, ratedId, data);
        notifyListeners();
      }
      return result;
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  void _updateRatingInList(
      List<RealUser> list, String id, Map<String, dynamic>? data) {
    final idx = list.indexWhere((u) => u.id == id);
    if (idx != -1 && data != null) {
      final u = list[idx];
      list[idx] = RealUser(
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        school: u.school,
        department: u.department,
        profilePhotoUrl: u.profilePhotoUrl,
        bio: u.bio,
        subjects: u.subjects,
        learningStyles: u.learningStyles,
        studyStyles: u.studyStyles,
        strengths: u.strengths,
        weaknesses: u.weaknesses,
        rating: (data['newRating'] as num?)?.toDouble() ?? u.rating,
        ratingCount: (data['ratingCount'] as int?) ?? u.ratingCount,
        compatibilityScore: u.compatibilityScore,
      );
    }
  }

  // ── Sign Up ───────────────────────────────────────────────────────────────
  Future<String?> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final id = DateTime.now().millisecondsSinceEpoch.toString();
      final result = await ApiService.register(
          id: id, name: name, email: email, password: password);
      if (result['success'] == true) return null;
      // A 500 can mean the user was saved but a post-save step (e.g. email)
      // failed server-side. Allow the user to proceed to OTP verification
      // rather than blocking them on a server-side exception.
      final statusCode = result['_statusCode'] as int? ?? 0;
      if (statusCode >= 500) return null;
      return result['message'] as String? ?? 'Registration failed';
    } catch (e) {
      return 'Network error: $e';
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────
  Future<String?> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final result = await ApiService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      if (result['success'] == true) return null;
      return result['message'] as String? ?? 'Failed to change password';
    } catch (e) {
      return 'Network error: $e';
    }
  }

  // ── Sign In ───────────────────────────────────────────────────────────────
  Future<String?> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final result = await ApiService.login(email: email, password: password);
      if (result['success'] == true) {
        final rawData = result['data'];
        if (rawData == null || rawData is! Map<String, dynamic>) {
          return 'Login failed: unexpected server response';
        }
        // Embed the token into the user map so it survives app restarts.
        final token = result['token'] as String?;
        final userJson = Map<String, dynamic>.from(rawData);
        if (token != null) userJson['token'] = token;

        final user = UserModel.fromJson(userJson);
        _currentUser = user;
        _onboardingStep = 0;
        if (user.onboardingComplete) {
          // Fetch full profile (login response only contains basic user fields).
          try {
            final profileResult = await ApiService.getProfile();
            final profileData = profileResult['data'] as Map<String, dynamic>?;
            if (profileData != null) {
              final merged = Map<String, dynamic>.from(userJson)
                ..addAll(profileData);
              _currentUser = UserModel.fromJson(merged);
            }
          } catch (_) {}
          await _saveSession(_currentUser!);
          await _loadPassedIds();
          await _loadMatchedUsersFromDb();
          await loadPendingMatches();
          await loadSessions();
          await loadMatchUsers();
          await loadResources();
        } else {
          await _saveSession(user);
        }
        notifyListeners();
        return null;
      }
      return result['message'] as String? ?? 'Login failed';
    } catch (e) {
      return 'Network error: $e';
    }
  }

  // ── Forgot Password ───────────────────────────────────────────────────────
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      return await ApiService.forgotPassword(email);
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // ── Sign Out ──────────────────────────────────────────────────────────────
  Future<void> signOut() async {
    _currentUser = null;
    _onboardingStep = 0;
    _matchUsers = [];
    _matchedUsers = [];
    _pendingMatchUsers = [];
    _sessions = [];
    _passedIds = [];
    _dbResources = [];
    _conversations.clear();
    await _clearSession();
    notifyListeners();
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  void nextOnboardingStep() {
    if (_onboardingStep < _totalOnboardingSteps - 1) {
      _onboardingStep++;
      notifyListeners();
    }
  }

  void previousOnboardingStep() {
    if (_onboardingStep > 0) {
      _onboardingStep--;
      notifyListeners();
    }
  }

  void updateUserProfile(Map<String, dynamic> fields) {
    if (_currentUser == null) return;
    final json = _currentUser!.toJson()..addAll(fields);
    _currentUser = UserModel.fromJson(json);
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    if (_currentUser == null) return;
    final updated = UserModel(
      id: _currentUser!.id,
      fullName: _currentUser!.fullName,
      email: _currentUser!.email,
      token: _currentUser!.token,
      profilePhotoUrl: _currentUser!.profilePhotoUrl,
      school: _currentUser!.school,
      department: _currentUser!.department,
      topic: _currentUser!.topic,
      yearLevel: _currentUser!.yearLevel,
      dateOfBirth: _currentUser!.dateOfBirth,
      gender: _currentUser!.gender,
      bio: _currentUser!.bio,
      role: _currentUser!.role,
      subjects: _currentUser!.subjects,
      learningStyles: _currentUser!.learningStyles,
      studyStyles: _currentUser!.studyStyles,
      availability: _currentUser!.availability,
      strengths: _currentUser!.strengths,
      weaknesses: _currentUser!.weaknesses,
      onboardingComplete: true,
    );
    // Save all profile fields first, then mark profile_completed = true
    // via the dedicated endpoint (PUT /profile does not set profile_completed).
    await ApiService.updateUser(updated);
    await ApiService.completeProfile();
    _currentUser = updated;
    await _saveSession(updated);
    await _loadMatchedUsersFromDb();
    await loadPendingMatches();
    await loadSessions();
    await loadMatchUsers();
    await loadResources();
    notifyListeners();
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  Future<String?> saveProfile(Map<String, dynamic> fields) async {
    if (_currentUser == null) return 'Not logged in';
    try {
      final json = _currentUser!.toJson()..addAll(fields);
      final updated = UserModel.fromJson(json);

      final result = await ApiService.updateUser(updated);

      if (result['success'] == true) {
        _currentUser = updated;
        await _saveSession(updated);
        notifyListeners();
        return null;
      }

      return result['message'] as String? ?? 'Update failed';
    } catch (e) {
      return 'Network error: $e';
    }
  }

  // ── Compatibility check ───────────────────────────────────────────────────
  bool get currentUserHasAttributes {
    final u = _currentUser;
    if (u == null) return false;
    return u.strengths.isNotEmpty ||
        u.weaknesses.isNotEmpty ||
        u.subjects.isNotEmpty;
  }

  bool _candidateHasAttributes(RealUser candidate) =>
      candidate.strengths.isNotEmpty ||
      candidate.weaknesses.isNotEmpty ||
      candidate.subjects.isNotEmpty;

  bool _hasOverlap(List<String> a, List<String> b) {
    if (a.isEmpty || b.isEmpty) return false;
    return a.toSet().intersection(b.toSet()).isNotEmpty;
  }

  bool isCompatible(RealUser candidate) {
    if (_currentUser == null) return false;
    if (!currentUserHasAttributes) return false;
    if (!_candidateHasAttributes(candidate)) return false;

    if (_currentUser!.role == 'tutor') {
      return _hasOverlap(_currentUser!.strengths, candidate.weaknesses);
    }

    if (_currentUser!.role == 'student') {
      return _hasOverlap(_currentUser!.weaknesses, candidate.strengths);
    }

    return false;
  }

  // ── Match actions ─────────────────────────────────────────────────────────
  // Returns 'matched' (mutual), 'pending' (request sent), or null (failed).
  Future<String?> likeUser(String userId) async {
    final idx = _matchUsers.indexWhere((u) => u.id == userId);
    if (idx == -1) return null;

    final liked = _matchUsers[idx];

    if (!isCompatible(liked)) {
      _matchUsers.removeAt(idx);
      if (!_passedIds.contains(userId)) {
        _passedIds.add(userId);
        _savePassedIds();
      }
      notifyListeners();
      return null;
    }

    _matchUsers.removeAt(idx);
    notifyListeners();

    if (_currentUser == null) return null;

    try {
      final result = await ApiService.saveMatch(
        userId: _currentUser!.id,
        matchedId: userId,
      );

      if (result['success'] == true) {
        final status = result['status'] as String? ?? 'pending';
        if (status == 'accepted' || status == 'matched') {
          // Mutual match: add to matched users and remove from pending
          if (!_matchedUsers.any((u) => u.id == userId)) {
            _matchedUsers.insert(0, liked);
          }
          _pendingMatchUsers.removeWhere((u) => u.id == userId);
        } else {
          // Pending request: add to pending match users
          if (!_pendingMatchUsers.any((u) => u.id == userId)) {
            _pendingMatchUsers.insert(0, liked);
          }
          _matchedUsers.removeWhere((u) => u.id == userId);
        }
        notifyListeners();
        return status == 'accepted' || status == 'matched'
            ? 'matched'
            : 'pending';
      }

      notifyListeners();
      return null;
    } catch (_) {
      notifyListeners();
      return null;
    }
  }

  void passUser(String userId) {
    _matchUsers.removeWhere((u) => u.id == userId);
    if (!_passedIds.contains(userId)) {
      _passedIds.add(userId);
      _savePassedIds();
    }
    notifyListeners();
  }

  // ── Update match status ────────────────────────────────────────────────────
  // Used to update the local state when a match request is sent/accepted
  // without triggering a full refresh from the backend.
  void updateMatchStatus(RealUser user, String status) {
    if (status == 'matched' || status == 'accepted') {
      // Remove from pending, add to matched
      if (!_matchedUsers.any((u) => u.id == user.id)) {
        _matchedUsers.insert(0, user);
      }
      _pendingMatchUsers.removeWhere((u) => u.id == user.id);
    } else if (status == 'pending') {
      // Add to pending if not already there
      if (!_pendingMatchUsers.any((u) => u.id == user.id)) {
        _pendingMatchUsers.insert(0, user);
      }
      _matchedUsers.removeWhere((u) => u.id == user.id);
    }
    notifyListeners();
  }

  Future<void> unmatchUser(String userId) async {
    _matchedUsers.removeWhere((u) => u.id == userId);
    if (_currentUser != null) {
      try {
        await ApiService.removeMatch(
          userId: _currentUser!.id,
          matchedId: userId,
        );
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<Map<String, dynamic>> acceptMatchRequest(String matchedId) async {
    if (_currentUser == null) return {'success': false, 'message': 'Not logged in'};
    try {
      final res = await ApiService.acceptMatch(
        userId: _currentUser!.id,
        matchedId: matchedId,
      );
      await loadPendingMatches();
      await _loadMatchedUsersFromDb();
      await loadMatchUsers();
      notifyListeners();
      return res;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> declineMatchRequest(String matchedId) async {
    if (_currentUser == null) return {'success': false, 'message': 'Not logged in'};
    try {
      final res = await ApiService.declineMatch(
        userId: _currentUser!.id,
        matchedId: matchedId,
      );
      await loadPendingMatches();
      await loadMatchUsers();
      notifyListeners();
      return res;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> cancelMatchRequest(String matchedId) async {
    if (_currentUser == null) return {'success': false, 'message': 'Not logged in'};
    try {
      final res = await ApiService.removeMatch(
        userId: _currentUser!.id,
        matchedId: matchedId,
      );
      await loadPendingMatches();
      await loadMatchUsers();
      notifyListeners();
      return res;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  Future<Map<String, dynamic>> cancelSession(String sessionId) async {
    try {
      final res = await ApiService.cancelSession(sessionId);
      await loadSessions();
      notifyListeners();
      return res;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  void updateConversationsFromInbox(List<Map<String, dynamic>> inboxData) {
    _conversations.clear();
    for (final c in inboxData) {
      try {
        final participant = RealUser(
          id:         c['participantId']    as String,
          fullName:   c['participantName']  as String,
          email:      c['participantEmail'] as String? ?? '',
          role:       c['participantRole']  as String? ?? 'student',
          department: c['participantDept']   as String?,
          school:     c['participantSchool'] as String?,
          bio:        c['participantBio']    as String?,
          rating: (c['participantRating'] as num?)?.toDouble() ?? 0,
          ratingCount: c['participantRatingCount'] as int? ?? 0,
          subjects: List<String>.from((c['participantSubjects']       as List?) ?? []),
          strengths: List<String>.from((c['participantStrengths']     as List?) ?? []),
          weaknesses: List<String>.from((c['participantWeaknesses']   as List?) ?? []),
          learningStyles: List<String>.from((c['participantLearningStyles'] as List?) ?? []),
          studyStyles: List<String>.from((c['participantStudyStyles'] as List?) ?? []),
        );

        final lastMessageText = c['lastMessage'] as String? ?? '';
        final lastMessageSenderId = c['lastMessageSenderId'] as String? ?? '';
        final lastMessageTimeStr = c['lastMessageTime'] as String? ?? '';
        
        DateTime lastTime;
        try {
          lastTime = DateTime.parse(lastMessageTimeStr);
        } catch (_) {
          lastTime = DateTime.now();
        }

        final lastMessage = Message(
          id: 'last',
          senderId: lastMessageSenderId,
          content: lastMessageText,
          timestamp: lastTime,
          isRead: (c['unreadCount'] as int? ?? 0) == 0,
        );

        _conversations.add(Conversation(
          id: c['participantId'] as String,
          participant: participant,
          messages: [lastMessage],
          lastActivity: lastTime,
        ));
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> loadConversations() async {
    if (_currentUser == null) return;
    try {
      final inboxData = await MessageService.getInbox(userId: _currentUser!.id);
      updateConversationsFromInbox(inboxData);
    } catch (_) {}
  }

  // ── Unread count ──────────────────────────────────────────────────────────
  Future<int> fetchUnreadCount() async {
    if (_currentUser == null) return 0;
    try {
      return await MessageService.getUnreadCount(userId: _currentUser!.id);
    } catch (_) {
      return 0;
    }
  }
}
