import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../widgets/app_shell_header.dart';
import '../../widgets/shared_widgets.dart';
import '../../navigation/student_nav.dart';
import '../../widgets/shell_scope.dart';
import 'profile_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /// Renders the Mon–Sun dot row from the weekDays list returned by the API
  /// (or computed client-side). Falls back to 7 static inactive dots when no
  /// data is available yet.
  Widget _buildWeekDots(List<Map<String, dynamic>> weekDays) {
    if (weekDays.isEmpty) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: const ['M', 'T', 'W', 'T', 'F', 'S', 'S']
            .map((d) => _StreakDot(label: d))
            .toList(),
      );
    }

    final todayStr = () {
      final n = DateTime.now();
      return '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
    }();

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: weekDays.map((d) {
        final fullLabel = (d['label'] as String?) ?? '';
        // Backend returns 3-letter labels ('Mon', 'Tue', …); show only initial.
        final shortLabel =
            fullLabel.isNotEmpty ? fullLabel[0].toUpperCase() : '';
        return _StreakDot(
          label: shortLabel,
          active: d['active'] == true,
          isToday: d['date'] == todayStr,
        );
      }).toList(),
    );
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final s = context.read<AppState>();
      s.loadConversations();
      s.fetchNotifications();
      s.loadStudyStreak();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.currentUser;
    final firstName = user?.fullName.split(' ').first ?? 'Student';
    final activeMatches = state.matchedUsers.length;
    final unreadNotifs = state.unreadNotificationCount;

    return ColoredBox(
      color: AppTheme.bgLight,
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppShellHeader(
                      actions: [
                        // ── Notification bell ──────────────────────────
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.notifications_outlined,
                                  color: AppTheme.textDark),
                              onPressed: () => ShellScope.of(context)
                                  .navigate(StudentNav.notifications),
                            ),
                            if (unreadNotifs > 0)
                              Positioned(
                                right: 10,
                                top: 10,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: AppTheme.primary,
                                    shape: BoxShape.circle,
                                  ),
                                  constraints: const BoxConstraints(
                                      minWidth: 16, minHeight: 16),
                                  child: Text(
                                    unreadNotifs > 9 ? '9+' : '$unreadNotifs',
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        // ── Avatar → Profile (tutor & student) ────────
                        GestureDetector(
                          onTap: () =>
                              ShellScope.of(context).navigate(StudentNav.profile),
                          child: UserAvatar(user: user, radius: 18),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text(
                      '${_greeting()}, $firstName! 👋',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Let's keep learning and achieve your goals.",
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.textMuted,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 20),
                    const _HeroBanner(),
                    const SizedBox(height: 16),
                    _StatsGrid(
                      activeMatches: activeMatches,
                      pendingRequests: state.pendingMatchUsers.length,
                      upcomingSessions: state.sessions.length,
                      notifications: unreadNotifs,
                    ),
                    const SizedBox(height: 20),
                    _SectionCard(
                      title: 'Upcoming Sessions',
                      child: _EmptyInline(
                        icon: Icons.calendar_month_rounded,
                        title: 'No upcoming sessions',
                        subtitle:
                            'Connect with a study partner to schedule your first session.',
                      ),
                    ),
                    const SizedBox(height: 14),
                    // ── Study Streak ───────────────────────────────────
                    _SectionCard(
                      title: 'Study Streak',
                      compact: true,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.local_fire_department,
                                color: state.streakDays > 0
                                    ? AppTheme.warning
                                    : AppTheme.textMuted,
                                size: 26,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${state.streakDays}',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textDark,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'days in a row',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textMuted,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _buildWeekDots(state.weekDays),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    _SectionCard(
                      title: 'Recent Messages',
                      child: state.conversations.isEmpty
                          ? _EmptyInline(
                              icon: Icons.chat_bubble_outline_rounded,
                              title: 'No messages yet',
                              subtitle: 'Start a conversation and connect!',
                            )
                          : Column(
                              children: state.conversations
                                  .take(2)
                                  .map((c) => ListTile(
                                        contentPadding: EdgeInsets.zero,
                                        leading: CircleAvatar(
                                          backgroundColor:
                                              AppTheme.primary.withOpacity(0.15),
                                          child: Text(
                                            c.participant.initials,
                                            style: const TextStyle(
                                              color: AppTheme.primary,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                        title: Text(
                                          c.participant.fullName,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                            fontFamily: 'Poppins',
                                          ),
                                        ),
                                        subtitle: Text(
                                          c.lastMessage?.content ?? '',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ))
                                  .toList(),
                            ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner
// ─────────────────────────────────────────────────────────────────────────────
class _HeroBanner extends StatelessWidget {
  const _HeroBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2B1464), Color(0xFF12052C)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Find your perfect ',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                fontFamily: 'Poppins',
                height: 1.25,
              )),
          const Text('study partner',
              style: TextStyle(
                color: AppTheme.primaryLight,
                fontSize: 22,
                fontWeight: FontWeight.w800,
                fontFamily: 'Poppins',
                height: 1.25,
              )),
          const SizedBox(height: 8),
          Text(
            'Connect, learn and achieve your goals together.',
            style: TextStyle(
              color: Colors.white.withOpacity(0.55),
              fontSize: 13,
              fontFamily: 'Poppins',
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          Material(
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              onTap: () =>
                  ShellScope.of(context).navigate(StudentNav.findTutors),
              borderRadius: BorderRadius.circular(10),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Find Matches',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          fontFamily: 'Poppins',
                        )),
                    SizedBox(width: 6),
                    Icon(Icons.arrow_forward_rounded,
                        color: Colors.white, size: 16),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Grid
// ─────────────────────────────────────────────────────────────────────────────
class _StatsGrid extends StatelessWidget {
  final int activeMatches;
  final int pendingRequests;
  final int upcomingSessions;
  final int notifications;

  const _StatsGrid({
    required this.activeMatches,
    required this.pendingRequests,
    required this.upcomingSessions,
    required this.notifications,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final crossAxisCount = width >= 700 ? 4 : 2;

    final items = [
      _StatItem(
        icon: Icons.people_alt_rounded,
        color: AppTheme.success,
        value: '$activeMatches',
        label: 'Active Matches',
        sub: 'View matches →',
        onTap: () => ShellScope.of(context).navigate(StudentNav.myMatches),
      ),
      _StatItem(
        icon: Icons.pending_actions_rounded,
        color: AppTheme.warning,
        value: '$pendingRequests',
        label: 'Pending Requests',
        sub: 'View requests →',
        onTap: () =>
            ShellScope.of(context).navigate(StudentNav.studySessions),
      ),
      _StatItem(
        icon: Icons.schedule_rounded,
        color: AppTheme.primary,
        value: '$upcomingSessions',
        label: 'Upcoming Sessions',
        sub: 'View sessions →',
        onTap: () =>
            ShellScope.of(context).navigate(StudentNav.studySessions),
      ),
      _StatItem(
        icon: Icons.notifications_active_rounded,
        color: AppTheme.error,
        value: '$notifications',
        label: 'Notifications',
        sub: 'View all →',
        onTap: () =>
            ShellScope.of(context).navigate(StudentNav.notifications),
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: 96,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) => _StatCard(item: items[i]),
    );
  }
}

class _StatItem {
  final IconData icon;
  final Color color;
  final String value;
  final String label;
  final String sub;
  final VoidCallback? onTap;

  const _StatItem({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
    required this.sub,
    this.onTap,
  });
}

class _StatCard extends StatelessWidget {
  final _StatItem item;
  const _StatCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: item.onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: item.color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(item.icon, color: item.color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(item.value,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          height: 1,
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins',
                        )),
                    const SizedBox(height: 2),
                    Text(item.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textBody,
                          fontFamily: 'Poppins',
                        )),
                    Text(item.sub,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppTheme.textMuted,
                          fontFamily: 'Poppins',
                        )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  final bool compact;

  const _SectionCard({
    required this.title,
    required this.child,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 14 : 18),
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.textDark,
                fontFamily: 'Poppins',
              )),
          SizedBox(height: compact ? 10 : 14),
          child,
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty Inline
// ─────────────────────────────────────────────────────────────────────────────
class _EmptyInline extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool compact;
  final VoidCallback? onTap;

  const _EmptyInline({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.compact = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Column(
          children: [
            Icon(icon, size: compact ? 28 : 36, color: AppTheme.primary),
            SizedBox(height: compact ? 8 : 12),
            Text(title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: compact ? 12 : 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins',
                )),
            const SizedBox(height: 4),
            Text(subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: compact ? 11 : 12,
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                )),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Streak Dot
// ─────────────────────────────────────────────────────────────────────────────
class _StreakDot extends StatelessWidget {
  final String label;
  final bool active;
  final bool isToday;

  const _StreakDot({
    required this.label,
    this.active = false,
    this.isToday = false,
  });

  @override
  Widget build(BuildContext context) {
    // active  → amber fire colour
    // isToday → primary blue outline (so the current day is always obvious)
    // inactive → neutral grey
    final Color dotColor;
    final Color iconColor;
    final BoxBorder? border;

    if (active) {
      dotColor  = AppTheme.warning.withValues(alpha: 0.15);
      iconColor = AppTheme.warning;
      border    = isToday
          ? Border.all(color: AppTheme.warning, width: 1.5)
          : null;
    } else if (isToday) {
      dotColor  = AppTheme.primary.withValues(alpha: 0.1);
      iconColor = AppTheme.primary;
      border    = Border.all(color: AppTheme.primary, width: 1.5);
    } else {
      dotColor  = const Color(0xFFF3F4F6);
      iconColor = const Color(0xFFD1D5DB);
      border    = null;
    }

    return Column(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: dotColor,
            shape: BoxShape.circle,
            border: border,
          ),
          child: Icon(Icons.bolt_rounded, size: 14, color: iconColor),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontFamily: 'Poppins',
            color: active ? AppTheme.textDark : AppTheme.textMuted,
            fontWeight: active ? FontWeight.w700 : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}