class UserModel {
  final String id;
  String fullName;
  String email;
  String? password;
  String? token;
  String? profilePhotoUrl;
  String? phoneNumber;
  String? school;
  String? department;
  String? topic;
  String? yearLevel;
  DateTime? dateOfBirth;
  String? gender;
  String? bio;
  String role; // 'student' or 'tutor'
  List<String> subjects;
  List<String> learningStyles;
  List<String> studyStyles;
  Map<String, List<String>> availability;
  List<String> strengths;
  List<String> weaknesses;
  bool onboardingComplete;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.password,
    this.token,
    this.profilePhotoUrl,
    this.phoneNumber,
    this.school,
    this.department,
    this.topic,
    this.yearLevel,
    this.dateOfBirth,
    this.gender,
    this.bio,
    this.role = 'student',
    this.subjects = const [],
    this.learningStyles = const [],
    this.studyStyles = const [],
    this.availability = const {},
    this.strengths = const [],
    this.weaknesses = const [],
    this.onboardingComplete = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: (json['id'] ?? '').toString(),
        fullName: (json['fullName'] ?? json['name'] ?? '').toString(),
        email: (json['email'] ?? '').toString(),
        password: json['password'] as String?,
        token: json['token'] as String?,
        profilePhotoUrl: json['profilePhotoUrl'] as String?,
        phoneNumber: json['phoneNumber'] as String?,
        school: json['school'] as String?,
        department: json['department'] as String?,
        topic: json['topic'] as String?,
        yearLevel: json['yearLevel'] as String?,
        dateOfBirth: json['dateOfBirth'] != null
            ? DateTime.tryParse(json['dateOfBirth'] as String)
            : null,
        gender: json['gender'] as String?,
        bio: json['bio'] as String?,
        role: json['role'] as String? ?? 'student',
        subjects: _toStringList(json['subjects']),
        learningStyles: _toStringList(json['learningStyles']),
        studyStyles: _toStringList(json['studyStyles']),
        availability: _toAvailabilityMap(json['availability']),
        strengths: _toStringList(json['strengths']),
        weaknesses: _toStringList(json['weaknesses']),
        onboardingComplete: json['onboardingComplete'] as bool? ?? false,
      );

  // ── Safe list parser — handles null, List, and unexpected types ──────────
  static List<String> _toStringList(dynamic val) {
    if (val == null) return [];
    if (val is List) {
      return val.map((e) => e?.toString() ?? '').where((e) => e.isNotEmpty).toList();
    }
    return [];
  }

  // ── Safe availability map parser — handles null, wrong types, bad data ──
  static Map<String, List<String>> _toAvailabilityMap(dynamic val) {
    if (val == null || val is! Map) return {};
    try {
      return val.map(
        (k, v) => MapEntry(
          k.toString(),
          v is List
              ? v.map((e) => e?.toString() ?? '').where((e) => e.isNotEmpty).toList()
              : <String>[],
        ),
      );
    } catch (_) {
      return {};
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'email': email,
        'password': password,
        'token': token,
        'profilePhotoUrl': profilePhotoUrl,
        'phoneNumber': phoneNumber,
        'school': school,
        'department': department,
        'topic': topic,
        'yearLevel': yearLevel,
        'dateOfBirth': dateOfBirth?.toIso8601String(),
        'gender': gender,
        'bio': bio,
        'role': role,
        'subjects': subjects,
        'learningStyles': learningStyles,
        'studyStyles': studyStyles,
        'availability': availability,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'onboardingComplete': onboardingComplete,
      };

  bool get isTutor   => role == 'tutor';
  bool get isStudent => role == 'student';

  String get roleLabel => isTutor ? 'Tutor' : 'Student';
  String get roleEmoji => isTutor ? '🏫' : '🎓';
}

// ═════════════════════════════════════════════════════════════════════════════
// RealUser — used in match cards and conversations
// ═════════════════════════════════════════════════════════════════════════════
class RealUser {
  final String id;
  final String fullName;
  final String email;
  final String? school;
  final String? department;
  final String? profilePhotoUrl;
  final String? bio;
  final String role; // 'student' or 'tutor'
  final List<String> subjects;
  final List<String> learningStyles;
  final List<String> studyStyles;
  final List<String> strengths;
  final List<String> weaknesses;
  final double rating;
  final int ratingCount;
  final int compatibilityScore;

  const RealUser({
    required this.id,
    required this.fullName,
    required this.email,
    this.school,
    this.department,
    this.profilePhotoUrl,
    this.bio,
    this.role = 'student',
    this.subjects = const [],
    this.learningStyles = const [],
    this.studyStyles = const [],
    this.strengths = const [],
    this.weaknesses = const [],
    this.rating = 0,
    this.ratingCount = 0,
    this.compatibilityScore = 0,
  });

  factory RealUser.fromJson(Map<String, dynamic> json) => RealUser(
        id: (json['id'] ?? '').toString(),
        fullName: (json['fullName'] ?? json['name'] ?? '').toString(),
        email: (json['email'] ?? '').toString(),
        school: json['school'] as String?,
        department: json['department'] as String?,
        profilePhotoUrl: json['profilePhotoUrl'] as String?,
        bio: json['bio'] as String?,
        role: json['role'] as String? ?? 'student',
        subjects: UserModel._toStringList(json['subjects']),
        learningStyles: UserModel._toStringList(json['learningStyles']),
        studyStyles: UserModel._toStringList(json['studyStyles']),
        strengths: UserModel._toStringList(json['strengths']),
        weaknesses: UserModel._toStringList(json['weaknesses']),
        rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        compatibilityScore: (json['compatibilityScore'] as num?)?.toInt() ?? 0,
      );

  String get initials  => fullName.isNotEmpty ? fullName[0].toUpperCase() : 'U';
  bool   get isTutor   => role == 'tutor';
  bool   get isStudent => role == 'student';
  String get roleLabel => isTutor ? 'Tutor' : 'Student';
  String get roleEmoji => isTutor ? '🏫' : '🎓';
}

// ═════════════════════════════════════════════════════════════════════════════
// DBResource
// ═════════════════════════════════════════════════════════════════════════════
class DBResource {
  final String id;
  final String title;
  final String subject;
  final String description;
  final String uploaderName;
  final String? fileUrl;
  final String fileType;
  final String uploadedAt;

  const DBResource({
    required this.id,
    required this.title,
    required this.subject,
    required this.description,
    required this.uploaderName,
    this.fileUrl,
    required this.fileType,
    required this.uploadedAt,
  });

  factory DBResource.fromJson(Map<String, dynamic> json) {
    // subject: API returns 'subjectName' (string) or nested 'subject' object or raw string
    String subjectName = '';
    final rawSubject = json['subjectName'] ?? json['subject'];
    if (rawSubject is String) {
      subjectName = rawSubject;
    } else if (rawSubject is Map) {
      subjectName = rawSubject['name'] as String? ?? '';
    }

    // uploaderName: API returns 'uploaderName' (string) or nested 'uploader' object
    String uploaderName = 'Unknown';
    final rawUploader = json['uploaderName'] ?? json['uploader'];
    if (rawUploader is String) {
      uploaderName = rawUploader;
    } else if (rawUploader is Map) {
      uploaderName = rawUploader['name'] as String? ?? 'Unknown';
    }

    return DBResource(
      id: json['id'].toString(),
      title: json['title'] as String? ?? '',
      subject: subjectName,
      description: json['description'] as String? ?? '',
      uploaderName: uploaderName,
      // API returns 'fileUrl' (Storage::url) or falls back to download path
      fileUrl: json['fileUrl'] as String?,
      fileType: json['file_type'] as String? ?? json['fileType'] as String? ?? 'application/octet-stream',
      uploadedAt: json['uploadedAt'] as String? ?? json['created_at'] as String? ?? '',
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// StudySession
// ═════════════════════════════════════════════════════════════════════════════
class StudySession {
  final String id;
  final String tutorUserId;
  final String tutorName;
  final String studentUserId;
  final String studentName;
  final DateTime scheduledAt;
  final int durationMinutes;
  final String status; // 'pending', 'scheduled', 'completed', 'cancelled'
  final String? notes;
  final String createdAt;

  const StudySession({
    required this.id,
    required this.tutorUserId,
    required this.tutorName,
    required this.studentUserId,
    required this.studentName,
    required this.scheduledAt,
    required this.durationMinutes,
    required this.status,
    this.notes,
    required this.createdAt,
  });

  factory StudySession.fromJson(Map<String, dynamic> json) => StudySession(
        id: json['id'].toString(),
        tutorUserId: json['tutorUserId'] as String? ?? '',
        tutorName: json['tutorName'] as String? ?? 'Tutor',
        studentUserId: json['studentUserId'] as String? ?? '',
        studentName: json['studentName'] as String? ?? 'Student',
        scheduledAt: DateTime.tryParse(json['scheduledAt'] as String? ?? '') ??
            DateTime.now(),
        durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 60,
        status: json['status'] as String? ?? 'pending',
        notes: json['notes'] as String?,
        createdAt: json['createdAt'] as String? ?? '',
      );

  bool get isPending   => status == 'pending';
  bool get isScheduled => status == 'scheduled';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isUpcoming  => isPending || isScheduled;
  bool get isPast      => isCompleted || isCancelled;

  String otherName(String myUserId) =>
      myUserId == tutorUserId ? studentName : tutorName;
}

// ═════════════════════════════════════════════════════════════════════════════
// Message
// ═════════════════════════════════════════════════════════════════════════════
class Message {
  final String id;
  final String senderId;
  final String content;
  final DateTime timestamp;
  final bool isRead;

  const Message({
    required this.id,
    required this.senderId,
    required this.content,
    required this.timestamp,
    this.isRead = false,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// Conversation
// ═════════════════════════════════════════════════════════════════════════════
class Conversation {
  final String id;
  final RealUser participant;
  final List<Message> messages;
  final DateTime lastActivity;

  const Conversation({
    required this.id,
    required this.participant,
    required this.messages,
    required this.lastActivity,
  });

  Message? get lastMessage  => messages.isNotEmpty ? messages.last : null;
  int      get unreadCount  =>
      messages.where((m) => !m.isRead && m.senderId != 'current_user').length;
}