import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../services/api_service.dart';
import '../../models/models.dart';
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
    _tabCtrl = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = context.read<AppState>();
      state.loadPendingMatches();
      state.loadSessions();
    });
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
                  IconButton(
                    icon: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F0F4),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.refresh_rounded,
                          color: AppTheme.textDark, size: 18),
                    ),
                    onPressed: () {
                      context.read<AppState>().loadPendingMatches();
                      context.read<AppState>().loadSessions();
                    },
                  ),
                  const SizedBox(width: 4),
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
                      fontSize: 13,
                      fontWeight: FontWeight.w600),
                  unselectedLabelStyle:
                      const TextStyle(fontFamily: 'Poppins', fontSize: 13),
                  tabs: [
                    Tab(
                      child: _TabLabel(
                        label: 'Requests',
                        count: state.pendingMatchUsers.length,
                      ),
                    ),
                    Tab(
                      child: _TabLabel(
                        label: 'Upcoming',
                        count: state.sessions.where((s) => s.isUpcoming).length,
                      ),
                    ),
                    const Tab(text: 'Past'),
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
                  _RequestsTab(state: state),
                  _UpcomingTab(state: state),
                  _PastTab(state: state),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Tab label with badge ──────────────────────────────────────────────────────
class _TabLabel extends StatelessWidget {
  final String label;
  final int count;
  const _TabLabel({required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    if (count == 0) return Text(label);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label),
        const SizedBox(width: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
          decoration: BoxDecoration(
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '$count',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins'),
          ),
        ),
      ],
    );
  }
}

// ── Requests tab — pending match requests ─────────────────────────────────────
class _RequestsTab extends StatelessWidget {
  final AppState state;
  const _RequestsTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final pending = state.pendingMatchUsers;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        // Banner
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
                  color: AppTheme.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.pending_actions_rounded,
                    color: AppTheme.warning, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  pending.isEmpty
                      ? 'No pending match requests.'
                      : 'You have ${pending.length} pending request${pending.length > 1 ? 's' : ''} waiting for a response.',
                  style: const TextStyle(
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (pending.isEmpty) ...[
          _EmptyState(
            icon: Icons.people_outline_rounded,
            title: 'No pending requests',
            subtitle:
                'When you like someone in the Match screen, your request will appear here while waiting for them to like you back.',
            actionLabel: 'Find Matches',
            onAction: () =>
                ShellScope.of(context).navigate(StudentNav.findTutors),
          ),
        ] else ...[
          const Text('Pending Requests',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 10),
          ...pending.map((u) => _PendingMatchCard(user: u)),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Pending match card ────────────────────────────────────────────────────────
class _PendingMatchCard extends StatefulWidget {
  final RealUser user;
  const _PendingMatchCard({required this.user});

  @override
  State<_PendingMatchCard> createState() => _PendingMatchCardState();
}

class _PendingMatchCardState extends State<_PendingMatchCard> {
  bool _isProcessing = false;

  Future<void> _handleAccept() async {
    setState(() => _isProcessing = true);
    final res =
        await context.read<AppState>().acceptMatchRequest(widget.user.id);
    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (res['success'] == true || res['status'] == 'accepted') {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Request accepted! It\'s a match!',
            style: TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(res['message'] as String? ?? 'Failed to accept',
            style: const TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _handleDecline() async {
    setState(() => _isProcessing = true);
    final res =
        await context.read<AppState>().declineMatchRequest(widget.user.id);
    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content:
            Text('Request declined.', style: TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.warning,
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(res['message'] as String? ?? 'Failed to decline',
            style: const TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _handleCancel() async {
    setState(() => _isProcessing = true);
    final res =
        await context.read<AppState>().cancelMatchRequest(widget.user.id);
    if (!mounted) return;
    setState(() => _isProcessing = false);

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Match request cancelled.',
            style: TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.textDark,
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(res['message'] as String? ?? 'Failed to cancel',
            style: const TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final isTutor = state.currentUser?.role == 'tutor';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    widget.user.initials,
                    style: const TextStyle(
                        color: AppTheme.warning,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        fontFamily: 'Poppins'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.user.fullName,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins'),
                    ),
                    if (widget.user.department != null)
                      Text(widget.user.department!,
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textBody,
                              fontFamily: 'Poppins')),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                          isTutor
                              ? 'Received Match Request'
                              : 'Awaiting Response',
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.warning,
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w500)),
                    ),
                  ],
                ),
              ),
              if (_isProcessing)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppTheme.warning,
                  ),
                )
              else
                const Icon(Icons.hourglass_top_rounded,
                    color: AppTheme.warning, size: 18),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppTheme.borderLight, height: 1),
          const SizedBox(height: 12),
          if (isTutor) ...[
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isProcessing ? null : _handleAccept,
                    icon: const Icon(Icons.check_rounded,
                        size: 16, color: Colors.white),
                    label: const Text('Accept',
                        style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.success,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isProcessing ? null : _handleDecline,
                    icon: const Icon(Icons.close_rounded,
                        size: 16, color: AppTheme.error),
                    label: const Text('Decline',
                        style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.error,
                      side: const BorderSide(color: AppTheme.error),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ],
            ),
          ] else ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _isProcessing ? null : _handleCancel,
                icon: const Icon(Icons.cancel_outlined,
                    size: 16, color: AppTheme.textMuted),
                label: const Text('Cancel Match Request',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        color: AppTheme.textDark,
                        fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.textDark,
                  side: const BorderSide(color: AppTheme.borderLight),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Upcoming tab — pending + scheduled sessions ───────────────────────────────
class _UpcomingTab extends StatefulWidget {
  final AppState state;
  const _UpcomingTab({required this.state});

  @override
  State<_UpcomingTab> createState() => _UpcomingTabState();
}

class _UpcomingTabState extends State<_UpcomingTab> {
  String? _processingId;

  Future<void> _confirm(String sessionId) async {
    setState(() => _processingId = sessionId);
    final result = await ApiService.confirmSession(sessionId);
    if (!mounted) return;
    setState(() => _processingId = null);
    if (result['success'] == true) {
      await context.read<AppState>().loadSessions();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content:
            Text('Session confirmed!', style: TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] as String? ?? 'Failed to confirm',
            style: const TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _cancel(String sessionId) async {
    setState(() => _processingId = sessionId);
    final result = await context.read<AppState>().cancelSession(sessionId);
    if (!mounted) return;
    setState(() => _processingId = null);
    if (result['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Session booking cancelled.',
            style: TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.textDark,
        behavior: SnackBarBehavior.floating,
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(
            result['message'] as String? ?? 'Failed to cancel session',
            style: const TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessions = widget.state.sessions.where((s) => s.isUpcoming).toList();
    final myId = widget.state.currentUser?.id ?? '';
    final isTutor = widget.state.currentUser?.role == 'tutor';

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        // Banner
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
                  sessions.isEmpty
                      ? 'No upcoming sessions.'
                      : 'You have ${sessions.length} upcoming session${sessions.length > 1 ? 's' : ''}.',
                  style: const TextStyle(
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (sessions.isEmpty) ...[
          _EmptyState(
            icon: Icons.calendar_today_rounded,
            title: 'No upcoming sessions',
            subtitle:
                'Book a session from your My Matches screen to get started.',
            actionLabel: 'Find Partners',
            onAction: () =>
                ShellScope.of(context).navigate(StudentNav.findTutors),
          ),
        ] else ...[
          ...sessions.map((s) => _SessionCard(
                session: s,
                myId: myId,
                isTutor: isTutor,
                processingId: _processingId,
                onConfirm: isTutor && s.isPending ? _confirm : null,
                onCancel: _cancel,
              )),
        ],

        const SizedBox(height: 16),
        // CTA
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
                    Text('Book from My Matches after connecting',
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Find',
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

// ── Session card ──────────────────────────────────────────────────────────────
class _SessionCard extends StatelessWidget {
  final StudySession session;
  final String myId;
  final bool isTutor;
  final String? processingId;
  final Future<void> Function(String)? onConfirm;
  final Future<void> Function(String)? onCancel;

  const _SessionCard({
    required this.session,
    required this.myId,
    required this.isTutor,
    required this.processingId,
    this.onConfirm,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final otherName = session.otherName(myId);
    final initials = otherName.isNotEmpty ? otherName[0].toUpperCase() : 'U';
    final isProcessing = processingId == session.id;

    final dt = session.scheduledAt.toLocal();
    final dateStr = '${_month(dt.month)} ${dt.day}, ${dt.year}';
    final timeStr =
        '${dt.hour % 12 == 0 ? 12 : dt.hour % 12}:${dt.minute.toString().padLeft(2, '0')} ${dt.hour < 12 ? 'AM' : 'PM'}';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: session.isPending ? AppTheme.warning : AppTheme.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(initials,
                      style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          fontFamily: 'Poppins')),
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
                            fontSize: 11)),
                    Text(otherName,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: AppTheme.textDark,
                            fontFamily: 'Poppins')),
                  ],
                ),
              ),
              _StatusChip(status: session.status),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppTheme.borderLight, height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 14, color: AppTheme.textMuted),
              const SizedBox(width: 6),
              Text('$dateStr · $timeStr',
                  style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textBody,
                      fontFamily: 'Poppins')),
              const Spacer(),
              const Icon(Icons.timer_outlined,
                  size: 14, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text('${session.durationMinutes} min',
                  style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textBody,
                      fontFamily: 'Poppins')),
            ],
          ),
          if (session.notes != null && session.notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.notes_rounded,
                    size: 14, color: AppTheme.textMuted),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(session.notes!,
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                          fontFamily: 'Poppins')),
                ),
              ],
            ),
          ],
          if (session.isPending) ...[
            const SizedBox(height: 12),
            const Divider(color: AppTheme.borderLight, height: 1),
            const SizedBox(height: 12),
            if (isTutor) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed:
                          isProcessing ? null : () => onConfirm!(session.id),
                      icon: isProcessing
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.check_rounded,
                              size: 16, color: Colors.white),
                      label: const Text('Confirm',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.success,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed:
                          isProcessing ? null : () => onCancel!(session.id),
                      icon: const Icon(Icons.close_rounded,
                          size: 16, color: AppTheme.error),
                      label: const Text('Decline',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.error,
                        side: const BorderSide(color: AppTheme.error),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.warning.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.hourglass_top_rounded,
                            size: 14, color: AppTheme.warning),
                        SizedBox(width: 6),
                        Text('Waiting for tutor to confirm',
                            style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.warning,
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed:
                          isProcessing ? null : () => onCancel!(session.id),
                      icon: isProcessing
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  color: AppTheme.error, strokeWidth: 2))
                          : const Icon(Icons.cancel_outlined,
                              size: 16, color: AppTheme.error),
                      label: const Text('Cancel Request',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              color: AppTheme.error,
                              fontWeight: FontWeight.w600)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.error,
                        side: const BorderSide(color: AppTheme.error),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ] else if (session.isScheduled) ...[
            const SizedBox(height: 12),
            const Divider(color: AppTheme.borderLight, height: 1),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: isProcessing ? null : () => onCancel!(session.id),
                icon: isProcessing
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                            color: AppTheme.error, strokeWidth: 2))
                    : const Icon(Icons.cancel_outlined,
                        size: 16, color: AppTheme.error),
                label: const Text('Cancel Booking',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        color: AppTheme.error,
                        fontWeight: FontWeight.w600)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.error,
                  side: const BorderSide(color: AppTheme.error),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _month(int m) => const [
        '',
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
      ][m];
}

// ── Status chip ───────────────────────────────────────────────────────────────
class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'pending':
        color = AppTheme.warning;
        label = 'Pending';
        break;
      case 'scheduled':
        color = AppTheme.success;
        label = 'Confirmed';
        break;
      case 'completed':
        color = AppTheme.primary;
        label = 'Completed';
        break;
      case 'cancelled':
        color = AppTheme.error;
        label = 'Cancelled';
        break;
      default:
        color = AppTheme.textMuted;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11,
              color: color,
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w600)),
    );
  }
}

// ── Past tab ──────────────────────────────────────────────────────────────────
class _PastTab extends StatelessWidget {
  final AppState state;
  const _PastTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final sessions = state.sessions.where((s) => s.isPast).toList();
    final myId = state.currentUser?.id ?? '';

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        if (sessions.isEmpty) ...[
          _EmptyState(
            icon: Icons.history_rounded,
            title: 'No past sessions',
            subtitle: 'Completed sessions will appear here.',
          ),
        ] else ...[
          const Text('Completed & Cancelled',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 10),
          ...sessions.map((s) => _SessionCard(
                session: s,
                myId: myId,
                isTutor: state.currentUser?.role == 'tutor',
                processingId: null,
              )),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
            child: Icon(icon, color: AppTheme.primary, size: 28),
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.textDark,
                fontFamily: 'Poppins'),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 13,
                color: AppTheme.textMuted,
                fontFamily: 'Poppins',
                height: 1.4),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 18),
            OutlinedButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.search, size: 16),
              label: Text(actionLabel!,
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 13)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primary,
                side: const BorderSide(color: AppTheme.primary),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
