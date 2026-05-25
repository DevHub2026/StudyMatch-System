import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/app_state.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../models/models.dart';
import '../../widgets/profile_avatar.dart';
import 'user_profile_screen.dart';
import 'messages_screen.dart';

class MyMatchesScreen extends StatefulWidget {
  const MyMatchesScreen({super.key});

  @override
  State<MyMatchesScreen> createState() => _MyMatchesScreenState();
}

class _MyMatchesScreenState extends State<MyMatchesScreen> {
  int _selectedTab = 0; // 0=All, 1=New, 2=Favorites
  bool _bannerDismissed = false;
  final Set<String> _favorites = {};

  void _showBookingDialog(RealUser tutor) {
    DateTime? selectedDate;
    TimeOfDay? selectedTime;
    int selectedDuration = 60;
    final notesCtrl = TextEditingController();
    bool booking = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceLight,
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
                      dropdownColor: AppTheme.surfaceLight,
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
                            selectedTime == null
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

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final matches = state.matchedUsers;

    final newMatches = matches.take(2).toList();
    final displayedMatches = _selectedTab == 1
        ? newMatches
        : _selectedTab == 2
            ? matches.where((u) => _favorites.contains(u.id)).toList()
            : matches;

    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new,
                        size: 18, color: AppTheme.textDark),
                    onPressed: () => Navigator.maybePop(context),
                  ),
                  const Expanded(
                    child: Text(
                      'My Matches',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F0F4),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.tune_rounded,
                        color: AppTheme.textDark, size: 18),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Search bar ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: const Row(
                  children: [
                    SizedBox(width: 14),
                    Icon(Icons.search, color: AppTheme.textMuted, size: 18),
                    SizedBox(width: 8),
                    Text('Search your matches...',
                        style: TextStyle(
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins',
                            fontSize: 13)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // ── Filter tabs ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _FilterChip(
                    label: 'All Matches',
                    selected: _selectedTab == 0,
                    onTap: () => setState(() => _selectedTab = 0),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'New Matches',
                    badge: matches.isNotEmpty ? '${newMatches.length}' : null,
                    selected: _selectedTab == 1,
                    onTap: () => setState(() => _selectedTab = 1),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'Favorites',
                    selected: _selectedTab == 2,
                    onTap: () => setState(() => _selectedTab = 2),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Content ────────────────────────────────────────────────
            Expanded(
              child: matches.isEmpty
                  ? _EmptyState()
                  : ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        // Info banner
                        if (!_bannerDismissed && _selectedTab == 0) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color:
                                      AppTheme.primary.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    color:
                                        AppTheme.primary.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.favorite_rounded,
                                      color: AppTheme.primary, size: 16),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                          state.currentUser?.role == 'tutor'
                                              ? 'These are students who matched with you!'
                                              : 'These are tutors who matched with you!',
                                          style: const TextStyle(
                                              color: AppTheme.textDark,
                                              fontFamily: 'Poppins',
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600)),
                                      const Text(
                                          'Start a conversation and schedule your first session.',
                                          style: TextStyle(
                                              color: AppTheme.textBody,
                                              fontFamily: 'Poppins',
                                              fontSize: 11)),
                                    ],
                                  ),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      setState(() => _bannerDismissed = true),
                                  style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap),
                                  child: const Text('Got it',
                                      style: TextStyle(
                                          color: AppTheme.primary,
                                          fontFamily: 'Poppins',
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],

                        if (displayedMatches.isEmpty && _selectedTab == 2)
                          _FavoritesEmpty()
                        else
                          ...displayedMatches.map((u) {
                            final appState = context.read<AppState>();
                            return _MatchCard(
                              user: u,
                              isFavorite: _favorites.contains(u.id),
                              onFavoriteToggle: () => setState(() {
                                if (_favorites.contains(u.id)) {
                                  _favorites.remove(u.id);
                                } else {
                                  _favorites.add(u.id);
                                }
                              }),
                              onBook:
                                  (appState.currentUser?.role == 'student' &&
                                          u.role == 'tutor')
                                      ? () => _showBookingDialog(u)
                                      : null,
                              matchedLabel: 'Matched recently',
                            );
                          }),
                        const SizedBox(height: 24),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Filter chip ───────────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    this.badge,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.borderLight),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : AppTheme.textBody,
                fontFamily: 'Poppins',
                fontSize: 13,
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.3)
                      : AppTheme.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    color: selected ? Colors.white : Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Match card ────────────────────────────────────────────────────────────────
class _MatchCard extends StatelessWidget {
  final RealUser user;
  final bool isFavorite;
  final VoidCallback onFavoriteToggle;
  final VoidCallback? onBook;
  final String matchedLabel;

  const _MatchCard({
    required this.user,
    required this.isFavorite,
    required this.onFavoriteToggle,
    this.onBook,
    required this.matchedLabel,
  });

  @override
  Widget build(BuildContext context) {
    final isTutor = user.role == 'tutor';
    final isOnline = user.id.hashCode % 2 == 0;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => UserProfileScreen(user: user)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar with online indicator
                Stack(
                  children: [
                    ProfileAvatar(
                      photoUrl: user.profilePhotoUrl,
                      displayName: user.fullName,
                      size: 62,
                    ),
                    Positioned(
                      bottom: 2,
                      right: 2,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color:
                              isOnline ? AppTheme.success : AppTheme.textMuted,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(user.fullName,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                    color: AppTheme.textDark,
                                    fontFamily: 'Poppins')),
                          ),
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle),
                            child: const Icon(Icons.check,
                                color: Colors.white, size: 9),
                          ),
                          const SizedBox(width: 6),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: isOnline
                                      ? AppTheme.success
                                      : AppTheme.textMuted,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 3),
                              Text(
                                isOnline ? 'Online' : 'Offline',
                                style: TextStyle(
                                    color: isOnline
                                        ? AppTheme.success
                                        : AppTheme.textMuted,
                                    fontFamily: 'Poppins',
                                    fontSize: 11),
                              ),
                            ],
                          ),
                        ],
                      ),
                      if (user.department != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          '${isTutor ? "Tutor" : "Student"} · ${user.department}',
                          style: const TextStyle(
                              color: AppTheme.textBody,
                              fontFamily: 'Poppins',
                              fontSize: 12),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              color: AppTheme.warning, size: 14),
                          const SizedBox(width: 2),
                          Text(
                            '${user.rating.toStringAsFixed(1)} (${user.ratingCount})',
                            style: const TextStyle(
                                color: AppTheme.textBody,
                                fontFamily: 'Poppins',
                                fontSize: 12),
                          ),
                          if (user.school != null) ...[
                            const SizedBox(width: 8),
                            const Text('·',
                                style: TextStyle(color: AppTheme.textMuted)),
                            const SizedBox(width: 8),
                            const Icon(Icons.school_outlined,
                                size: 12, color: AppTheme.textMuted),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                user.school!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontFamily: 'Poppins',
                                    fontSize: 11),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                // Action buttons
                Column(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => ChatScreen(participant: user)),
                      ),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.chat_bubble_outline_rounded,
                            color: AppTheme.primary, size: 16),
                      ),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: onFavoriteToggle,
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: isFavorite
                              ? AppTheme.warning.withValues(alpha: 0.12)
                              : AppTheme.borderLight.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          isFavorite
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: isFavorite
                              ? AppTheme.warning
                              : AppTheme.textMuted,
                          size: 16,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: onBook,
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: onBook != null
                              ? AppTheme.primary.withValues(alpha: 0.08)
                              : AppTheme.borderLight.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          Icons.calendar_today_outlined,
                          color: onBook != null
                              ? AppTheme.primary
                              : AppTheme.textMuted,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            if (user.subjects.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: user.subjects
                    .take(3)
                    .map((s) => Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(s,
                              style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontFamily: 'Poppins',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500)),
                        ))
                    .toList(),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              matchedLabel,
              style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Empty states ──────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.people_alt_outlined,
                  color: AppTheme.primary, size: 32),
            ),
            const SizedBox(height: 16),
            const Text('No matches yet',
                style: TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 8),
            const Text('Use Find Tutors to connect\nwith study partners.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins',
                    height: 1.5)),
          ],
        ),
      ),
    );
  }
}

class _FavoritesEmpty extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: const Column(
        children: [
          Icon(Icons.star_outline_rounded, color: AppTheme.textMuted, size: 36),
          SizedBox(height: 10),
          Text('No favorites yet',
              style: TextStyle(
                  color: AppTheme.textDark,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                  fontSize: 14)),
          SizedBox(height: 4),
          Text('Tap the star icon on a match\nto save them here.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  fontSize: 12)),
        ],
      ),
    );
  }
}
