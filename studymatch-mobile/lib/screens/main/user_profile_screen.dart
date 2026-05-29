import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
import '../../widgets/profile_avatar.dart';
import '../main/messages_screen.dart';

class UserProfileScreen extends StatefulWidget {
  final RealUser user;

  const UserProfileScreen({super.key, required this.user});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  // ── Reviews state ──────────────────────────────────────────────────────────
  List<TutorReview> _reviews = [];
  bool _loadingReviews = false;
  int? _myExistingRating;
  String _myExistingReview = '';
  bool _sendingRequest = false;

  @override
  void initState() {
    super.initState();
    if (widget.user.role == 'tutor') {
      _fetchReviews();
    }
  }

  Future<void> _sendRequest() async {
    final state = context.read<AppState>();
    final me = state.currentUser;
    if (me == null) return;
    setState(() => _sendingRequest = true);
    try {
      final result =
          await ApiService.saveMatch(userId: me.id, matchedId: widget.user.id);
      if (result['success'] == true) {
        final status = result['status'] as String? ?? 'pending';
        // Update local state based on the response
        state.updateMatchStatus(widget.user, status);
      }
      if (mounted) {
        final isNowMatched =
            state.matchedUsers.any((u) => u.id == widget.user.id);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
            isNowMatched
                ? 'It\'s a match with ${widget.user.fullName}!'
                : 'Request sent to ${widget.user.fullName}!',
            style: const TextStyle(fontFamily: 'Poppins'),
          ),
          backgroundColor: isNowMatched ? AppTheme.success : AppTheme.primary,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Failed to send request',
              style: TextStyle(fontFamily: 'Poppins')),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _sendingRequest = false);
    }
  }

  void _showBookingDialog(RealUser tutor) {
    DateTime? selectedDate;
    TimeOfDay? selectedTime;
    int selectedDuration = 60;
    String? selectedSubject;
    String selectedSessionType = 'online';
    final sessionLinkCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    bool booking = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                        color: AppTheme.borderLight,
                        borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Book Session with ${tutor.fullName.split(' ').first}',
                    style: const TextStyle(
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.bold,
                        fontSize: 17)),
                const SizedBox(height: 20),
                // ── Subject ──────────────────────────────────────────────
                const Text('Subject',
                    style: TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: selectedSubject != null
                              ? AppTheme.primary
                              : AppTheme.borderLight)),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedSubject,
                      isExpanded: true,
                      dropdownColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      borderRadius: BorderRadius.circular(12),
                      hint: const Text('Select a subject',
                          style: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontFamily: 'Poppins',
                              fontSize: 14)),
                      style: const TextStyle(
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins',
                          fontSize: 14),
                      items: AppConstants.subjects
                          .map(
                              (s) => DropdownMenuItem(value: s, child: Text(s)))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) setS(() => selectedSubject = v);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                // ── Session Type ─────────────────────────────────────────
                const Text('Session Type',
                    style: TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ('Online', 'online'),
                    ('In-Person', 'in_person'),
                  ].map((entry) {
                    final label = entry.$1;
                    final value = entry.$2;
                    final sel = selectedSessionType == value;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setS(() => selectedSessionType = value),
                        child: Container(
                          margin: EdgeInsets.only(
                              right: label == 'Online' ? 6 : 0,
                              left: label == 'In-Person' ? 6 : 0),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: sel
                                ? AppTheme.primary.withValues(alpha: 0.08)
                                : const Color(0xFFF5F5F8),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: sel
                                    ? AppTheme.primary
                                    : AppTheme.borderLight),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                value == 'online'
                                    ? Icons.video_call_outlined
                                    : Icons.location_on_outlined,
                                color: sel
                                    ? AppTheme.primary
                                    : const Color(0xFF9CA3AF),
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(label,
                                  style: TextStyle(
                                      color: sel
                                          ? AppTheme.primary
                                          : const Color(0xFF9CA3AF),
                                      fontFamily: 'Poppins',
                                      fontSize: 13,
                                      fontWeight: sel
                                          ? FontWeight.w600
                                          : FontWeight.normal)),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                // ── Meeting Link (Online only) ────────────────────────────
                if (selectedSessionType == 'online') ...[
                  const Text('Meeting Link (Optional)',
                      style: TextStyle(
                          color: AppTheme.textBody,
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: sessionLinkCtrl,
                    style: const TextStyle(
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                        fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Zoom, Google Meet, Teams link…',
                      hintStyle: const TextStyle(
                          color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
                      prefixIcon: const Icon(Icons.link_rounded,
                          color: Color(0xFF9CA3AF), size: 20),
                      filled: true,
                      fillColor: const Color(0xFFF5F5F8),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppTheme.borderLight)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppTheme.borderLight)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppTheme.primary, width: 1.5)),
                    ),
                  ),
                  const SizedBox(height: 14),
                ],
                const Text('Date',
                    style: TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: ctx,
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate:
                          DateTime.now().add(const Duration(minutes: 30)),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                      builder: (c, child) => Theme(
                        data: ThemeData.light().copyWith(
                            colorScheme: const ColorScheme.light(
                                primary: AppTheme.primary,
                                surface: Colors.white)),
                        child: child!,
                      ),
                    );
                    if (picked != null) setS(() => selectedDate = picked);
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: selectedDate != null
                              ? AppTheme.primary
                              : AppTheme.borderLight),
                    ),
                    child: Row(children: [
                      const Icon(Icons.calendar_today_outlined,
                          color: Color(0xFF9CA3AF), size: 18),
                      const SizedBox(width: 10),
                      Text(
                        selectedDate != null
                            ? '${selectedDate!.year}-${selectedDate!.month.toString().padLeft(2, '0')}-${selectedDate!.day.toString().padLeft(2, '0')}'
                            : 'Select date',
                        style: TextStyle(
                            color: selectedDate != null
                                ? AppTheme.textDark
                                : const Color(0xFF9CA3AF),
                            fontFamily: 'Poppins',
                            fontSize: 14),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Time',
                    style: TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () async {
                    final picked = await showTimePicker(
                      context: ctx,
                      initialTime: TimeOfDay.now(),
                      builder: (c, child) => Theme(
                        data: ThemeData.light().copyWith(
                            colorScheme: const ColorScheme.light(
                                primary: AppTheme.primary,
                                surface: Colors.white)),
                        child: child!,
                      ),
                    );
                    if (picked != null) setS(() => selectedTime = picked);
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: selectedTime != null
                              ? AppTheme.primary
                              : AppTheme.borderLight),
                    ),
                    child: Row(children: [
                      const Icon(Icons.access_time_outlined,
                          color: Color(0xFF9CA3AF), size: 18),
                      const SizedBox(width: 10),
                      Text(
                        selectedTime != null
                            ? selectedTime!.format(ctx)
                            : 'Select time',
                        style: TextStyle(
                            color: selectedTime != null
                                ? AppTheme.textDark
                                : const Color(0xFF9CA3AF),
                            fontFamily: 'Poppins',
                            fontSize: 14),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Duration',
                    style: TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F8),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderLight)),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: selectedDuration,
                      isExpanded: true,
                      dropdownColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      borderRadius: BorderRadius.circular(12),
                      style: const TextStyle(
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins',
                          fontSize: 14),
                      items: const [
                        DropdownMenuItem(value: 30, child: Text('30 minutes')),
                        DropdownMenuItem(value: 60, child: Text('1 hour')),
                        DropdownMenuItem(value: 90, child: Text('1.5 hours')),
                        DropdownMenuItem(value: 120, child: Text('2 hours')),
                      ],
                      onChanged: (v) {
                        if (v != null) setS(() => selectedDuration = v);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Notes (Optional)',
                    style: TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                TextField(
                  controller: notesCtrl,
                  maxLines: 3,
                  style: const TextStyle(
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins',
                      fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Topics to cover, preferred platform, etc.',
                    hintStyle: const TextStyle(
                        color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
                    filled: true,
                    fillColor: const Color(0xFFF5F5F8),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            const BorderSide(color: AppTheme.borderLight)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            const BorderSide(color: AppTheme.borderLight)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                            color: AppTheme.primary, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: booking ||
                            selectedDate == null ||
                            selectedTime == null ||
                            selectedSubject == null
                        ? null
                        : () async {
                            setS(() => booking = true);
                            final dt = DateTime(
                              selectedDate!.year,
                              selectedDate!.month,
                              selectedDate!.day,
                              selectedTime!.hour,
                              selectedTime!.minute,
                            );
                            final result = await ApiService.bookSession(
                              tutorUserId: tutor.id,
                              studentUserId:
                                  context.read<AppState>().currentUser!.id,
                              scheduledAt: dt,
                              durationMinutes: selectedDuration,
                              subject: selectedSubject,
                              sessionType: selectedSessionType,
                              sessionLink: sessionLinkCtrl.text.trim().isEmpty
                                  ? null
                                  : sessionLinkCtrl.text.trim(),
                              notes: notesCtrl.text.trim().isEmpty
                                  ? null
                                  : notesCtrl.text.trim(),
                            );
                            if (!ctx.mounted) return;
                            Navigator.pop(ctx);
                            if (mounted) {
                              if (result['success'] == true) {
                                context.read<AppState>().loadSessions();
                              }
                              ScaffoldMessenger.of(context)
                                  .showSnackBar(SnackBar(
                                content: Text(
                                  result['success'] == true
                                      ? 'Session booked with ${tutor.fullName.split(' ').first}!'
                                      : (result['message'] as String? ??
                                          'Booking failed'),
                                  style: const TextStyle(fontFamily: 'Poppins'),
                                ),
                                backgroundColor: result['success'] == true
                                    ? AppTheme.success
                                    : AppTheme.error,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                              ));
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      disabledBackgroundColor: AppTheme.borderLight,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: booking
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('Confirm Booking',
                            style: TextStyle(
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w600,
                                color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _fetchReviews() async {
    setState(() => _loadingReviews = true);
    final me = context.read<AppState>().currentUser;
    final result = await ApiService.getReviews(
      tutorId: widget.user.id,
      raterId: me?.id,
    );
    if (mounted) {
      setState(() {
        _reviews = result.reviews;
        _myExistingRating = result.myRating;
        _myExistingReview = result.myReview ?? '';
        _loadingReviews = false;
      });
    }
  }

  // ── Rate & Review bottom sheet ─────────────────────────────────────────────
  void _showRateSheet(BuildContext context) {
    final me = context.read<AppState>().currentUser;
    if (me == null) return;

    // Seed with existing values if the user already rated
    int selectedStars = _myExistingRating ?? 0;
    final reviewCtrl = TextEditingController(text: _myExistingReview);
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFF1A1035),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(
              top: BorderSide(color: Color(0xFF2E2850), width: 1),
              left: BorderSide(color: Color(0xFF2E2850), width: 1),
              right: BorderSide(color: Color(0xFF2E2850), width: 1),
            ),
          ),
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 32,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2E2850),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Header
                Row(
                  children: [
                    ProfileAvatar(
                      photoUrl: widget.user.profilePhotoUrl,
                      displayName: widget.user.fullName,
                      size: 48,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _myExistingRating != null
                                ? 'Update Your Review'
                                : 'Rate This Tutor',
                            style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 17,
                                fontFamily: 'Poppins'),
                          ),
                          Text(widget.user.fullName,
                              style: const TextStyle(
                                  color: AppTheme.textMuted,
                                  fontFamily: 'Poppins',
                                  fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Star picker
                const Text('How would you rate this tutor?',
                    style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (i) {
                    final filled = i < selectedStars;
                    return GestureDetector(
                      onTap: () => setS(() => selectedStars = i + 1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        child: Icon(
                          filled
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                          color: filled
                              ? AppTheme.warning
                              : const Color(0xFF3D3660),
                          size: 44,
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    _starLabel(selectedStars),
                    style: TextStyle(
                        color: selectedStars > 0
                            ? AppTheme.warning
                            : AppTheme.textMuted,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(height: 24),

                // Written review
                const Text('Write a review (optional)',
                    style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 10),
                TextField(
                  controller: reviewCtrl,
                  maxLines: 4,
                  maxLength: 500,
                  style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontFamily: 'Poppins',
                      fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Share your experience with this tutor. '
                        'How helpful were they? What did they teach well?',
                    hintStyle: const TextStyle(
                        color: AppTheme.textMuted,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        height: 1.5),
                    filled: true,
                    fillColor: const Color(0xFF120D2A),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFF2E2850))),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFF2E2850))),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppTheme.primary)),
                    counterStyle: const TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 20),

                // Submit
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (submitting || selectedStars == 0)
                        ? null
                        : () async {
                            setS(() => submitting = true);
                            final result =
                                await context.read<AppState>().rateUser(
                                      ratedId: widget.user.id,
                                      score: selectedStars,
                                      review: reviewCtrl.text.trim(),
                                    );
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (mounted) {
                              final ok = result['success'] == true;
                              ScaffoldMessenger.of(this.context)
                                  .showSnackBar(SnackBar(
                                content: Text(ok
                                    ? '✅ Review submitted!'
                                    : result['message'] ?? 'Failed to submit'),
                                backgroundColor:
                                    ok ? AppTheme.success : AppTheme.error,
                                behavior: SnackBarBehavior.floating,
                              ));
                              if (ok) _fetchReviews();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      disabledBackgroundColor:
                          AppTheme.primary.withValues(alpha: 0.3),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    child: submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : Text(
                            _myExistingRating != null
                                ? 'Update Review'
                                : 'Submit Review',
                            style: const TextStyle(
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w600,
                                fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _starLabel(int stars) {
    switch (stars) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent!';
      default:
        return 'Tap a star to rate';
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final me = state.currentUser;
    final isTutor = widget.user.role == 'tutor';
    final roleColor = isTutor ? AppTheme.success : const Color(0xFF3B82F6);
    final roleLabel = isTutor ? '🏫 Tutor' : '🎓 Student';

    final myWeaknesses = me?.weaknesses ?? [];
    final myStrengths = me?.strengths ?? [];

    int compatScore = 0;
    if (isTutor) {
      compatScore =
          widget.user.strengths.where((s) => myWeaknesses.contains(s)).length;
    } else {
      compatScore =
          widget.user.weaknesses.where((s) => myStrengths.contains(s)).length;
    }

    // Can the current user rate this tutor?
    final canRate = me != null && me.id != widget.user.id && isTutor;

    // Match status with this user
    final isMatched = state.matchedUsers.any((u) => u.id == widget.user.id);
    final isPending =
        state.pendingMatchUsers.any((u) => u.id == widget.user.id);
    final canBook = isMatched &&
        me != null &&
        me.role == 'student' &&
        widget.user.role == 'tutor';

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Container(
          //   height: 280,
          //   decoration: const BoxDecoration(
          //     gradient: LinearGradient(
          //       begin: Alignment.topLeft,
          //       end: Alignment.bottomRight,
          //       colors: [AppTheme.primary, AppTheme.primaryDark],
          //     ),
          //   ),
          // ),
          SafeArea(
            child: CustomScrollView(
              slivers: [
                // ── App bar ────────────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new,
                              color: AppTheme.textDark, size: 18),
                          onPressed: () => Navigator.pop(context),
                        ),
                        const Expanded(
                          child: Text('Profile',
                              style: TextStyle(
                                  color: AppTheme.textDark,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  fontFamily: 'Poppins')),
                        ),
                        // Rate button in app bar (tutors only)
                        if (canRate)
                          TextButton.icon(
                            onPressed: () => _showRateSheet(context),
                            icon: Icon(
                              _myExistingRating != null
                                  ? Icons.edit_outlined
                                  : Icons.star_outline_rounded,
                              color: AppTheme.warning,
                              size: 18,
                            ),
                            label: Text(
                              _myExistingRating != null
                                  ? 'Edit Review'
                                  : 'Rate',
                              style: const TextStyle(
                                  color: AppTheme.warning,
                                  fontFamily: 'Poppins',
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),

                // ── Hero section ───────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // Avatar
                      ProfileAvatar(
                        photoUrl: widget.user.profilePhotoUrl,
                        displayName: widget.user.fullName,
                        size: 90,
                        borderColor: Colors.white,
                        borderWidth: 3,
                      ),
                      const SizedBox(height: 10),

                      Text(widget.user.fullName,
                          style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 22,
                              fontFamily: 'Poppins')),
                      const SizedBox(height: 4),

                      Text(widget.user.email,
                          style: const TextStyle(
                              color: AppTheme.textBody,
                              fontFamily: 'Poppins',
                              fontSize: 13)),
                      const SizedBox(height: 10),

                      // Role badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color: roleColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: roleColor.withValues(alpha: 0.5)),
                        ),
                        child: Text(roleLabel,
                            style: TextStyle(
                                color: roleColor,
                                fontFamily: 'Poppins',
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 8),

                      // School
                      if (widget.user.school != null &&
                          widget.user.school!.isNotEmpty) ...[
                        Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.school_outlined,
                                  color: AppTheme.textMuted, size: 14),
                              const SizedBox(width: 4),
                              Text(widget.user.school!,
                                  style: const TextStyle(
                                      color: AppTheme.textMuted,
                                      fontFamily: 'Poppins',
                                      fontSize: 13)),
                            ]),
                        const SizedBox(height: 4),
                      ],

                      // Department
                      if (widget.user.department != null &&
                          widget.user.department!.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: AppTheme.primary.withValues(alpha: 0.3)),
                          ),
                          child: Text(widget.user.department!,
                              style: const TextStyle(
                                  color: AppTheme.primaryLight,
                                  fontFamily: 'Poppins',
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500)),
                        ),
                        const SizedBox(height: 6),
                      ],

                      // Bio
                      if (widget.user.bio != null &&
                          widget.user.bio!.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Text(widget.user.bio!,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                  color: AppTheme.textSecondary,
                                  fontFamily: 'Poppins',
                                  fontSize: 13,
                                  height: 1.5)),
                        ),
                        const SizedBox(height: 8),
                      ],

                      const SizedBox(height: 12),

                      // Stats row: rating + compatibility
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(
                          children: [
                            // Rating card
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                        color: AppTheme.borderLight)),
                                child: Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: List.generate(
                                        5,
                                        (i) => Icon(
                                          i < widget.user.rating.round()
                                              ? Icons.star_rounded
                                              : Icons.star_border_rounded,
                                          color: AppTheme.warning,
                                          size: 16,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${widget.user.rating.toStringAsFixed(1)} (${widget.user.ratingCount})',
                                      style: const TextStyle(
                                          color: AppTheme.textBody,
                                          fontSize: 12,
                                          fontFamily: 'Poppins'),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text('Rating',
                                        style: TextStyle(
                                            color: AppTheme.textMuted,
                                            fontSize: 11,
                                            fontFamily: 'Poppins')),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Compatibility card
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                    color: compatScore > 0
                                        ? AppTheme.success
                                            .withValues(alpha: 0.1)
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                        color: compatScore > 0
                                            ? AppTheme.success
                                                .withValues(alpha: 0.4)
                                            : AppTheme.borderLight)),
                                child: Column(
                                  children: [
                                    Text('$compatScore',
                                        style: TextStyle(
                                            color: compatScore > 0
                                                ? AppTheme.success
                                                : AppTheme.textMuted,
                                            fontSize: 22,
                                            fontWeight: FontWeight.bold,
                                            fontFamily: 'Poppins')),
                                    const SizedBox(height: 2),
                                    Text(
                                        compatScore > 0
                                            ? '✅ Match!'
                                            : 'No match',
                                        style: TextStyle(
                                            color: compatScore > 0
                                                ? AppTheme.success
                                                : AppTheme.textMuted,
                                            fontSize: 11,
                                            fontFamily: 'Poppins')),
                                    const SizedBox(height: 2),
                                    const Text('Compatibility',
                                        style: TextStyle(
                                            color: AppTheme.textMuted,
                                            fontSize: 11,
                                            fontFamily: 'Poppins')),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),

                // ── Attribute + Review sections ────────────────────────────
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      if (widget.user.subjects.isNotEmpty) ...[
                        _Section(
                            title: '📚 Subjects',
                            child:
                                _chips(widget.user.subjects, AppTheme.primary)),
                        const SizedBox(height: 12),
                      ],

                      if (widget.user.strengths.isNotEmpty) ...[
                        _Section(
                          title: isTutor
                              ? '💪 Can Tutor (Expert Subjects)'
                              : '💪 Strong Subjects',
                          child:
                              _chips(widget.user.strengths, AppTheme.success),
                        ),
                        const SizedBox(height: 12),
                      ],

                      if (widget.user.weaknesses.isNotEmpty) ...[
                        _Section(
                          title: isTutor
                              ? '📖 Still Learning'
                              : '😅 Needs Help With',
                          child: _chips(widget.user.weaknesses, AppTheme.error),
                        ),
                        const SizedBox(height: 12),
                      ],

                      if (widget.user.learningStyles.isNotEmpty) ...[
                        _Section(
                            title: '🧠 Learning Style',
                            child: _chips(
                                widget.user.learningStyles, AppTheme.accent)),
                        const SizedBox(height: 12),
                      ],

                      if (widget.user.studyStyles.isNotEmpty) ...[
                        _Section(
                            title: '👥 Study Format',
                            child: _chips(
                                widget.user.studyStyles, AppTheme.warning)),
                        const SizedBox(height: 12),
                      ],

                      // ── Reviews section (tutors only) ─────────────────────
                      if (isTutor) ...[
                        _ReviewsSection(
                          reviews: _reviews,
                          loading: _loadingReviews,
                          myExistingRating: _myExistingRating,
                          canRate: canRate,
                          onRate: () => _showRateSheet(context),
                          currentUserId: me?.id ?? '',
                        ),
                        const SizedBox(height: 12),
                      ],

                      // ── Action buttons ────────────────────────────────────────────────
                      if (me!.role != 'tutor') ...[
                        // const SizedBox(height: 8),

                        // Match request status / send button
                        if (isMatched)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            decoration: BoxDecoration(
                              color: AppTheme.success.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color:
                                      AppTheme.success.withValues(alpha: 0.4)),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_outline,
                                    color: AppTheme.success, size: 18),
                                SizedBox(width: 8),
                                Text('Matched',
                                    style: TextStyle(
                                        color: AppTheme.success,
                                        fontFamily: 'Poppins',
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15)),
                              ],
                            ),
                          )
                        else if (isPending)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            decoration: BoxDecoration(
                              color: AppTheme.warning.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color:
                                      AppTheme.warning.withValues(alpha: 0.4)),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.schedule_outlined,
                                    color: AppTheme.warning, size: 18),
                                SizedBox(width: 8),
                                Text('Request Pending',
                                    style: TextStyle(
                                        color: AppTheme.warning,
                                        fontFamily: 'Poppins',
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15)),
                              ],
                            ),
                          )
                        else
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _sendingRequest ? null : _sendRequest,
                              icon: _sendingRequest
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                          color: Colors.white, strokeWidth: 2))
                                  : const Icon(Icons.favorite_border, size: 18),
                              label: Text(
                                  _sendingRequest
                                      ? 'Sending...'
                                      : 'Send Match Request',
                                  style: const TextStyle(
                                      fontFamily: 'Poppins',
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                disabledBackgroundColor:
                                    AppTheme.primary.withValues(alpha: 0.4),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                              ),
                            ),
                          ),

                        const SizedBox(height: 10),

                        // Message button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) =>
                                        ChatScreen(participant: widget.user)),
                              );
                            },
                            icon:
                                const Icon(Icons.chat_bubble_outline, size: 18),
                            label: Text(
                                'Message ${widget.user.fullName.split(' ').first}',
                                style: const TextStyle(
                                    fontFamily: 'Poppins',
                                    fontWeight: FontWeight.w600,
                                    fontSize: 15)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14)),
                            ),
                          ),
                        ),

                        // Book Session button (matched student → tutor)
                        if (canBook) ...[
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _showBookingDialog(widget.user),
                              icon: const Icon(Icons.calendar_month_outlined,
                                  size: 18),
                              label: Text(
                                  'Book Session with ${widget.user.fullName.split(' ').first}',
                                  style: const TextStyle(
                                      fontFamily: 'Poppins',
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.primary,
                                side: const BorderSide(color: AppTheme.primary),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14)),
                              ),
                            ),
                          ),
                        ],
                      ],
                      const SizedBox(height: 32),
                    ]),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chips(List<String> items, Color color) => Wrap(
        spacing: 8,
        runSpacing: 8,
        children: items
            .map((s) => Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withValues(alpha: 0.3)),
                  ),
                  child: Text(s,
                      style: TextStyle(
                          color: color,
                          fontFamily: 'Poppins',
                          fontSize: 12,
                          fontWeight: FontWeight.w500)),
                ))
            .toList(),
      );
}

// ── Reviews section widget ────────────────────────────────────────────────────
class _ReviewsSection extends StatelessWidget {
  final List<TutorReview> reviews;
  final bool loading;
  final int? myExistingRating;
  final bool canRate;
  final VoidCallback onRate;
  final String currentUserId;

  const _ReviewsSection({
    required this.reviews,
    required this.loading,
    required this.myExistingRating,
    required this.canRate,
    required this.onRate,
    required this.currentUserId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 12, 12),
            child: Row(
              children: [
                const Expanded(
                  child: Text('⭐ Ratings & Reviews',
                      style: TextStyle(
                          color: AppTheme.textDark,
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          fontFamily: 'Poppins')),
                ),
                if (canRate)
                  GestureDetector(
                    onTap: onRate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                            colors: [AppTheme.primary, AppTheme.accent]),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            myExistingRating != null
                                ? Icons.edit_rounded
                                : Icons.star_rounded,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            myExistingRating != null ? 'Edit' : 'Rate',
                            style: const TextStyle(
                                color: Colors.white,
                                fontFamily: 'Poppins',
                                fontSize: 12,
                                fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.borderLight),

          if (loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                  child: CircularProgressIndicator(
                      color: AppTheme.primary, strokeWidth: 2)),
            )
          else if (reviews.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Text('⭐', style: TextStyle(fontSize: 36)),
                  const SizedBox(height: 10),
                  const Text('No reviews yet',
                      style: TextStyle(
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(
                    canRate
                        ? 'Be the first to leave a review!'
                        : 'No one has reviewed this tutor yet.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        height: 1.4),
                  ),
                  if (canRate) ...[
                    const SizedBox(height: 14),
                    GestureDetector(
                      onTap: onRate,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                              colors: [AppTheme.primary, AppTheme.accent]),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Write a Review',
                            style: TextStyle(
                                color: Colors.white,
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w600,
                                fontSize: 13)),
                      ),
                    ),
                  ],
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: reviews.length,
              separatorBuilder: (_, __) => const Divider(
                  height: 20, color: AppTheme.borderLight, thickness: 0.5),
              itemBuilder: (_, i) => _ReviewTile(review: reviews[i]),
            ),
        ],
      ),
    );
  }
}

// ── Single review tile ────────────────────────────────────────────────────────
class _ReviewTile extends StatelessWidget {
  final TutorReview review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    final initial =
        review.raterName.isNotEmpty ? review.raterName[0].toUpperCase() : '?';

    // Parse date
    String dateStr = '';
    try {
      final dt = DateTime.parse(review.createdAt);
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      dateStr = '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {}

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Avatar
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            gradient: review.isOwn
                ? const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.accent])
                : const LinearGradient(
                    colors: [Color(0xFFE8E8EF), Color(0xFFD8D8E8)]),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(initial,
                style: TextStyle(
                    color: review.isOwn ? Colors.white : AppTheme.textBody,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    fontFamily: 'Poppins')),
          ),
        ),
        const SizedBox(width: 12),

        // Content
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Name + "You" badge + date
              Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Text(
                          review.isOwn ? 'You' : review.raterName,
                          style: const TextStyle(
                              color: AppTheme.textDark,
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                              fontSize: 13),
                        ),
                        if (review.isOwn) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color:
                                      AppTheme.primary.withValues(alpha: 0.3)),
                            ),
                            child: const Text('Your review',
                                style: TextStyle(
                                    color: AppTheme.primaryLight,
                                    fontFamily: 'Poppins',
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (dateStr.isNotEmpty)
                    Text(dateStr,
                        style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins',
                            fontSize: 11)),
                ],
              ),
              const SizedBox(height: 4),

              // Stars
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < review.score
                        ? Icons.star_rounded
                        : Icons.star_border_rounded,
                    color: AppTheme.warning,
                    size: 15,
                  ),
                ),
              ),

              // Review text
              if (review.review.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(review.review,
                    style: const TextStyle(
                        color: AppTheme.textBody,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        height: 1.5)),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ── Reusable section card ─────────────────────────────────────────────────────
class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: AppTheme.textDark,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
