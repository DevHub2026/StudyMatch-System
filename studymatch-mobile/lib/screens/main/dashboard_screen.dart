import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../widgets/app_shell_header.dart';
import '../../widgets/shared_widgets.dart';
import '../../navigation/student_nav.dart';
import '../../widgets/shell_scope.dart';

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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().loadConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.currentUser;
    final firstName = user?.fullName.split(' ').first ?? 'Student';
    final initials = user?.fullName.isNotEmpty == true
        ? user!.fullName
            .trim()
            .split(' ')
            .map((w) => w[0])
            .take(2)
            .join()
            .toUpperCase()
        : 'S';

    final activeMatches = state.matchedUsers.length;
    final unread = state.unreadMessageCount;

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
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.notifications_outlined,
                                  color: AppTheme.textDark),
                              onPressed: () {},
                            ),
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
                                child: const Text(
                                  '3',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          ],
                        ),
                        UserAvatar(user: user, radius: 18),
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
                      pendingRequests: 0,
                      upcomingSessions: 0,
                      notifications: unread,
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
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: _SectionCard(
                            title: 'Study Streak',
                            compact: true,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.local_fire_department,
                                        color: AppTheme.warning, size: 26),
                                    const SizedBox(width: 8),
                                    const Text(
                                      '0',
                                      style: TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textDark,
                                        fontFamily: 'Poppins',
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Flexible(
                                      child: Text(
                                        'days in a row',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppTheme.textMuted,
                                          fontFamily: 'Poppins',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    children: [
                                      'M',
                                      'T',
                                      'W',
                                      'T',
                                      'F',
                                      'S',
                                      'S'
                                    ]
                                        .map((d) => Padding(
                                              padding: const EdgeInsets.only(
                                                  right: 6),
                                              child: _StreakDot(label: d),
                                            ))
                                        .toList(),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _SectionCard(
                            title: 'Subjects',
                            compact: true,
                            child: _EmptyInline(
                              icon: Icons.menu_book_rounded,
                              title: 'No subjects yet',
                              subtitle: '+ Add subjects',
                              compact: true,
                            ),
                          ),
                        ),
                      ],
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
                                          backgroundColor: AppTheme.primary
                                              .withOpacity(0.15),
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
          const Text(
            'Find your perfect ',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              fontFamily: 'Poppins',
              height: 1.25,
            ),
          ),
          const Text(
            'study partner',
            style: TextStyle(
              color: AppTheme.primaryLight,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              fontFamily: 'Poppins',
              height: 1.25,
            ),
          ),
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
                    Text(
                      'Find Matches',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        fontFamily: 'Poppins',
                      ),
                    ),
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
      ),
      _StatItem(
        icon: Icons.pending_actions_rounded,
        color: AppTheme.warning,
        value: '$pendingRequests',
        label: 'Pending Requests',
        sub: 'View requests →',
      ),
      _StatItem(
        icon: Icons.schedule_rounded,
        color: AppTheme.primary,
        value: '$upcomingSessions',
        label: 'Upcoming Sessions',
        sub: 'View sessions →',
      ),
      _StatItem(
        icon: Icons.notifications_active_rounded,
        color: AppTheme.error,
        value: '$notifications',
        label: 'Notifications',
        sub: 'View all →',
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

  const _StatItem({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
    required this.sub,
  });
}

class _StatCard extends StatelessWidget {
  final _StatItem item;
  const _StatCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
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
                Text(
                  item.value,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    height: 1,
                    color: AppTheme.textDark,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textBody,
                    fontFamily: 'Poppins',
                  ),
                ),
                Text(
                  item.sub,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

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
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppTheme.textDark,
              fontFamily: 'Poppins',
            ),
          ),
          SizedBox(height: compact ? 10 : 14),
          child,
        ],
      ),
    );
  }
}

class _EmptyInline extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool compact;

  const _EmptyInline({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: compact ? 28 : 36, color: AppTheme.primary),
        SizedBox(height: compact ? 8 : 12),
        Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: compact ? 12 : 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.textDark,
            fontFamily: 'Poppins',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: compact ? 11 : 12,
            color: AppTheme.textMuted,
            fontFamily: 'Poppins',
          ),
        ),
      ],
    );
  }
}

class _StreakDot extends StatelessWidget {
  final String label;
  const _StreakDot({required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: const BoxDecoration(
            color: Color(0xFFF3F4F6),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.bolt_rounded,
              size: 12, color: Color(0xFFD1D5DB)),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
              fontSize: 9, color: AppTheme.textMuted, fontFamily: 'Poppins'),
        ),
      ],
    );
  }
}
