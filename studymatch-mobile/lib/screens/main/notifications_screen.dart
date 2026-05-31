import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../widgets/app_shell_header.dart';
import '../../widgets/shared_widgets.dart';
import '../../navigation/student_nav.dart';
import '../../widgets/shell_scope.dart';
import '../../models/models.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    // Refresh all notification data immediately when the screen opens,
    // then continue refreshing every 30 seconds while it stays visible.
    WidgetsBinding.instance.addPostFrameCallback((_) => _refresh());
    _refreshTimer =
        Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    if (!mounted) return;
    await context.read<AppState>().refreshNotifications();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final unread = state.unreadMessageCount;
    final pendingMatches = state.pendingMatchUsers;
    final upcomingSessions = state.sessions;
    final conversations = state.conversations;
    final apiNotifications = state.notifications;

    final hasNotifications = unread > 0 ||
        pendingMatches.isNotEmpty ||
        upcomingSessions.isNotEmpty ||
        apiNotifications.isNotEmpty;

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
                        IconButton(
                          icon: const Icon(Icons.close_rounded,
                              color: AppTheme.textDark),
                          onPressed: () => ShellScope.of(context)
                              .navigate(StudentNav.dashboard),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      hasNotifications
                          ? 'You have ${unread > 0 ? '$unread unread message' : ''} ${pendingMatches.isNotEmpty ? (unread > 0 ? ', ' : '') + '${pendingMatches.length} pending request${pendingMatches.length > 1 ? 's' : ''}' : ''}'
                              .trim()
                          : 'All caught up! No new notifications',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textMuted,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            if (!hasNotifications)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(Icons.notifications_none_rounded,
                              color: AppTheme.primary, size: 40),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No notifications',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'You\'re all caught up! Check back later for new activity.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildListDelegate([
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ─── Pending Match Requests ────────────────────────────────
                        if (pendingMatches.isNotEmpty) ...[
                          _NotificationSection(
                            title: 'Pending Requests',
                            subtitle: '${pendingMatches.length} pending',
                            icon: Icons.people_alt_rounded,
                            color: AppTheme.warning,
                            children: [
                              for (int i = 0;
                                  i < pendingMatches.length;
                                  i++) ...[
                                _PendingRequestTile(
                                  user: pendingMatches[i],
                                  state: state,
                                ),
                                if (i < pendingMatches.length - 1)
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFEEEEF4),
                                  ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Unread Messages ───────────────────────────────────────
                        if (unread > 0) ...[
                          _NotificationSection(
                            title: 'Unread Messages',
                            subtitle: '$unread message${unread > 1 ? 's' : ''}',
                            icon: Icons.chat_bubble_outline_rounded,
                            color: AppTheme.primary,
                            children: [
                              for (int i = 0;
                                  i < conversations.take(5).length;
                                  i++) ...[
                                _MessageNotificationTile(
                                  conversation: conversations[i],
                                ),
                                if (i < conversations.take(5).length - 1)
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFEEEEF4),
                                  ),
                              ],
                              if (conversations.length > 5)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 12),
                                  child: Center(
                                    child: Text(
                                      'View all ${conversations.length} conversations →',
                                      style: const TextStyle(
                                        color: AppTheme.primary,
                                        fontFamily: 'Poppins',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Upcoming Sessions ─────────────────────────────────────
                        if (upcomingSessions.isNotEmpty) ...[
                          _NotificationSection(
                            title: 'Upcoming Sessions',
                            subtitle:
                                '${upcomingSessions.length} session${upcomingSessions.length > 1 ? 's' : ''}',
                            icon: Icons.schedule_rounded,
                            color: AppTheme.success,
                            children: [
                              for (int i = 0;
                                  i < upcomingSessions.take(3).length;
                                  i++) ...[
                                _SessionNotificationTile(
                                  session: upcomingSessions[i],
                                ),
                                if (i < upcomingSessions.take(3).length - 1)
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFEEEEF4),
                                  ),
                              ],
                              if (upcomingSessions.length > 3)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 12),
                                  child: Center(
                                    child: Text(
                                      'View all ${upcomingSessions.length} sessions →',
                                      style: const TextStyle(
                                        color: AppTheme.success,
                                        fontFamily: 'Poppins',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── API Notifications ─────────────────────────────────────
                        if (apiNotifications.isNotEmpty) ...[
                          _NotificationSection(
                            title: 'Recent Activity',
                            subtitle:
                                '${apiNotifications.where((n) => !n.isRead).length} unread',
                            icon: Icons.notifications_rounded,
                            color: const Color(0xFF8B5CF6),
                            children: [
                              for (int i = 0;
                                  i < apiNotifications.take(10).length;
                                  i++) ...[
                                _ApiNotificationTile(
                                  item: apiNotifications[i],
                                  onTap: () => context
                                      .read<AppState>()
                                      .markNotificationRead(
                                          apiNotifications[i].id),
                                ),
                                if (i < apiNotifications.take(10).length - 1)
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFEEEEF4),
                                  ),
                              ],
                            ],
                          ),
                        ],

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ]),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Notification Section Wrapper ──────────────────────────────────────────
class _NotificationSection extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final List<Widget> children;

  const _NotificationSection({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textDark,
                    fontFamily: 'Poppins',
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}

// ─── Pending Request Notification Tile ─────────────────────────────────────
class _PendingRequestTile extends StatelessWidget {
  final RealUser user;
  final AppState state;

  const _PendingRequestTile({
    required this.user,
    required this.state,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: AppTheme.primary.withOpacity(0.15),
        child: Text(
          user.initials,
          style: const TextStyle(
            color: AppTheme.primary,
            fontWeight: FontWeight.bold,
            fontSize: 13,
            fontFamily: 'Poppins',
          ),
        ),
      ),
      title: Text(
        user.fullName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: AppTheme.textDark,
          fontFamily: 'Poppins',
        ),
      ),
      subtitle: Text(
        'Match request pending • ${user.subjects.join(", ")}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 12,
          color: AppTheme.textMuted,
          fontFamily: 'Poppins',
        ),
      ),
      trailing: Icon(Icons.chevron_right_rounded,
          color: AppTheme.textMuted, size: 20),
      onTap: () =>
          Navigator.of(context).pushNamed('/user-profile', arguments: user.id),
    );
  }
}

// ─── Message Notification Tile ─────────────────────────────────────────────
class _MessageNotificationTile extends StatelessWidget {
  final Conversation conversation;

  const _MessageNotificationTile({required this.conversation});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: AppTheme.primary.withOpacity(0.15),
        child: Text(
          conversation.participant.initials,
          style: const TextStyle(
            color: AppTheme.primary,
            fontWeight: FontWeight.bold,
            fontSize: 13,
            fontFamily: 'Poppins',
          ),
        ),
      ),
      title: Text(
        conversation.participant.fullName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: AppTheme.textDark,
          fontFamily: 'Poppins',
        ),
      ),
      subtitle: Text(
        conversation.lastMessage?.content ?? 'No messages yet',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 12,
          color: AppTheme.textMuted,
          fontFamily: 'Poppins',
        ),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (conversation.unreadCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${conversation.unreadCount}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins',
                ),
              ),
            )
          else
            const Icon(Icons.chevron_right_rounded,
                color: AppTheme.textMuted, size: 20),
        ],
      ),
    );
  }
}

// ─── API Notification Tile ─────────────────────────────────────────────────
class _ApiNotificationTile extends StatelessWidget {
  final NotificationItem item;
  final VoidCallback onTap;

  const _ApiNotificationTile({required this.item, required this.onTap});

  IconData _iconForType(String type) {
    switch (type) {
      case 'match_request':
        return Icons.people_alt_rounded;
      case 'message':
        return Icons.chat_bubble_outline_rounded;
      case 'session':
        return Icons.schedule_rounded;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _colorForType(String type) {
    switch (type) {
      case 'match_request':
        return AppTheme.warning;
      case 'message':
        return AppTheme.primary;
      case 'session':
        return AppTheme.success;
      default:
        return const Color(0xFF8B5CF6);
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final color = _colorForType(item.type);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(_iconForType(item.type), color: color, size: 20),
      ),
      title: Text(
        item.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontWeight: item.isRead ? FontWeight.w500 : FontWeight.w700,
          fontSize: 13,
          color: AppTheme.textDark,
          fontFamily: 'Poppins',
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.message,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textMuted,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _timeAgo(item.createdAt),
            style: TextStyle(
              fontSize: 10,
              color: color,
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
      trailing: item.isRead
          ? null
          : Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
      onTap: onTap,
    );
  }
}

// ─── Session Notification Tile ─────────────────────────────────────────────
class _SessionNotificationTile extends StatelessWidget {
  final StudySession session;

  const _SessionNotificationTile({required this.session});

  String _formatDate(DateTime? date) {
    if (date == null) return 'No date';
    final diff = date.difference(DateTime.now());
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Tomorrow';
    if (diff.inDays < 7) return 'In ${diff.inDays} days';
    return '${date.month}/${date.day}';
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppTheme.success.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(Icons.schedule_rounded,
            color: AppTheme.success, size: 24),
      ),
      title: Text(
        session.topic ?? 'Study Session',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
          color: AppTheme.textDark,
          fontFamily: 'Poppins',
        ),
      ),
      subtitle: Text(
        'With ${session.partnerName ?? 'study partner'} • ${_formatDate(session.scheduledTime)}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 12,
          color: AppTheme.textMuted,
          fontFamily: 'Poppins',
        ),
      ),
      trailing: Icon(Icons.chevron_right_rounded,
          color: AppTheme.textMuted, size: 20),
    );
  }
}
