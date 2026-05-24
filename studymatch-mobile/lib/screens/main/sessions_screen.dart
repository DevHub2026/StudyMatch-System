import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../widgets/shell_scope.dart';
import '../../navigation/student_nav.dart';

class SessionsScreen extends StatefulWidget {
  const SessionsScreen({super.key});

  @override
  State<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends State<SessionsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final unread = state.unreadMessageCount;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new,
                        size: 18, color: AppTheme.textDark),
                    onPressed: () =>
                        ShellScope.of(context).navigate(StudentNav.dashboard),
                  ),
                  const Expanded(
                    child: Text(
                      'Study Sessions',
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
                  const SizedBox(width: 8),
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F0F4),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.notifications_outlined,
                            color: AppTheme.textDark, size: 18),
                      ),
                      if (unread > 0)
                        Positioned(
                          right: 4,
                          top: 4,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle),
                            child: Center(
                              child: Text(
                                unread > 9 ? '9+' : '$unread',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 7,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Tab bar ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 46,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEDE9F8),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabCtrl,
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: AppTheme.primary,
                  unselectedLabelColor: AppTheme.textBody,
                  labelStyle: const TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: 14,
                      fontWeight: FontWeight.w600),
                  unselectedLabelStyle: const TextStyle(
                      fontFamily: 'Poppins', fontSize: 14),
                  tabs: const [
                    Tab(text: 'Upcoming'),
                    Tab(text: 'Past'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // ── Tab views ─────────────────────────────────────────────────
            Expanded(
              child: TabBarView(
                controller: _tabCtrl,
                children: [
                  _UpcomingTab(state: state),
                  const _PastTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Upcoming tab ──────────────────────────────────────────────────────────────
class _UpcomingTab extends StatelessWidget {
  final AppState state;
  const _UpcomingTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final matches = state.matchedUsers;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        // Stay on track banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.calendar_month_rounded,
                    color: AppTheme.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  matches.isEmpty
                      ? 'No upcoming sessions this week.'
                      : 'You have ${matches.length} upcoming session${matches.length > 1 ? 's' : ''} this week.',
                  style: const TextStyle(
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w500),
                ),
              ),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('View Calendar',
                        style: TextStyle(
                            color: AppTheme.primary,
                            fontFamily: 'Poppins',
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    SizedBox(width: 2),
                    Icon(Icons.chevron_right_rounded,
                        color: AppTheme.primary, size: 16),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        if (matches.isEmpty) ...[
          // Empty state
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.calendar_today_rounded,
                      color: AppTheme.primary, size: 28),
                ),
                const SizedBox(height: 14),
                const Text(
                  'No upcoming sessions',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins'),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Connect with a study partner to schedule\nyour first session.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      fontFamily: 'Poppins',
                      height: 1.4),
                ),
                const SizedBox(height: 18),
                OutlinedButton.icon(
                  onPressed: () =>
                      ShellScope.of(context).navigate(StudentNav.findTutors),
                  icon: const Icon(Icons.search, size: 16),
                  label: const Text('Find Partners',
                      style:
                          TextStyle(fontFamily: 'Poppins', fontSize: 13)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 10),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          // Next Session
          const Text('Next Session',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 10),
          _NextSessionCard(user: matches.first),
          const SizedBox(height: 16),

          if (matches.length > 1) ...[
            const Text('Upcoming This Week',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 10),
            ...matches
                .skip(1)
                .take(3)
                .map((u) => _UpcomingSessionRow(user: u)),
            const SizedBox(height: 16),
          ],
        ],

        // Need to schedule CTA
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person_add_outlined,
                    color: AppTheme.primary, size: 22),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Need to schedule a new session?',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: AppTheme.textDark,
                            fontFamily: 'Poppins')),
                    SizedBox(height: 2),
                    Text('Find your tutor and book a session',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins')),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: () =>
                    ShellScope.of(context).navigate(StudentNav.findTutors),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  side: const BorderSide(color: AppTheme.primary),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Find Tutors',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Next session hero card ─────────────────────────────────────────────────────
class _NextSessionCard extends StatelessWidget {
  final dynamic user;
  const _NextSessionCard({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 72,
                  height: 72,
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  child: Center(
                    child: Text(
                      user.initials,
                      style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                          fontFamily: 'Poppins'),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Session with',
                        style: TextStyle(
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins',
                            fontSize: 12)),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            user.fullName,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: AppTheme.textDark,
                                fontFamily: 'Poppins'),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                              color: AppTheme.primary,
                              shape: BoxShape.circle),
                          child: const Icon(Icons.check,
                              color: Colors.white, size: 10),
                        ),
                      ],
                    ),
                    if (user.department != null) ...[
                      const SizedBox(height: 2),
                      Text(user.department!,
                          style: const TextStyle(
                              color: AppTheme.textBody,
                              fontFamily: 'Poppins',
                              fontSize: 13)),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.videocam_outlined,
                            size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        const Text('Online',
                            style: TextStyle(
                                color: AppTheme.textMuted,
                                fontFamily: 'Poppins',
                                fontSize: 12)),
                        const SizedBox(width: 12),
                        const Icon(Icons.refresh_rounded,
                            size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        const Text('Weekly',
                            style: TextStyle(
                                color: AppTheme.textMuted,
                                fontFamily: 'Poppins',
                                fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: AppTheme.borderLight, height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.videocam_rounded,
                      size: 16, color: Colors.white),
                  label: const Text('Join Session',
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.calendar_today_outlined,
                      size: 16, color: AppTheme.primary),
                  label: const Text('Reschedule',
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Upcoming session row ──────────────────────────────────────────────────────
class _UpcomingSessionRow extends StatelessWidget {
  final dynamic user;
  const _UpcomingSessionRow({required this.user});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                user.initials,
                style: const TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    fontFamily: 'Poppins'),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        user.fullName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: AppTheme.textDark,
                            fontFamily: 'Poppins'),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                          color: AppTheme.primary, shape: BoxShape.circle),
                      child: const Icon(Icons.check,
                          color: Colors.white, size: 8),
                    ),
                  ],
                ),
                if (user.department != null)
                  Text(user.department!,
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textBody,
                          fontFamily: 'Poppins')),
                const SizedBox(height: 4),
                const Row(
                  children: [
                    Icon(Icons.videocam_outlined,
                        size: 12, color: AppTheme.textMuted),
                    SizedBox(width: 4),
                    Text('Online',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins')),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded,
              color: AppTheme.textMuted, size: 18),
        ],
      ),
    );
  }
}

// ── Past tab ──────────────────────────────────────────────────────────────────
class _PastTab extends StatelessWidget {
  const _PastTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Column(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppTheme.textMuted.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.history_rounded,
                    color: AppTheme.textMuted, size: 28),
              ),
              const SizedBox(height: 14),
              const Text('No past sessions',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins')),
              const SizedBox(height: 6),
              const Text(
                'Completed sessions will appear here.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
