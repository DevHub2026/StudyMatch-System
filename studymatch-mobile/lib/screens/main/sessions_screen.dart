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
                        child: IconButton(
                          icon: const Icon(Icons.notifications_outlined,
                              color: AppTheme.textDark),
                          onPressed: () => ShellScope.of(context)
                              .navigate(StudentNav.notifications),
                        ),
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
                        count:
                            state.sessions.where((s) => s.isUpcoming).length,
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

// ── Requests tab ──────────────────────────────────────────────────────────────
class _RequestsTab extends StatelessWidget {
  final AppState state;
  const _RequestsTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final pending = state.pendingMatchUsers;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
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
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        res['success'] == true || res['status'] == 'accepted'
            ? 'Request accepted! It\'s a match!'
            : res['message'] as String? ?? 'Failed to accept',
        style: const TextStyle(fontFamily: 'Poppins'),
      ),
      backgroundColor: res['success'] == true || res['status'] == 'accepted'
          ? AppTheme.success
          : AppTheme.error,
      behavior: SnackBarBehavior.floating,
    ));
  }

  Future<void> _handleDecline() async {
    setState(() => _isProcessing = true);
    final res =
        await context.read<AppState>().declineMatchRequest(widget.user.id);
    if (!mounted) return;
    setState(() => _isProcessing = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        res['success'] == true
            ? 'Request declined.'
            : res['message'] as String? ?? 'Failed to decline',
        style: const TextStyle(fontFamily: 'Poppins'),
      ),
      backgroundColor:
          res['success'] == true ? AppTheme.warning : AppTheme.error,
      behavior: SnackBarBehavior.floating,
    ));
  }

  Future<void> _handleCancel() async {
    setState(() => _isProcessing = true);
    final res =
        await context.read<AppState>().cancelMatchRequest(widget.user.id);
    if (!mounted) return;
    setState(() => _isProcessing = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        res['success'] == true
            ? 'Match request cancelled.'
            : res['message'] as String? ?? 'Failed to cancel',
        style: const TextStyle(fontFamily: 'Poppins'),
      ),
      backgroundColor:
          res['success'] == true ? AppTheme.textDark : AppTheme.error,
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isTutor = context.watch<AppState>().currentUser?.role == 'tutor';

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
                    Text(widget.user.fullName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: AppTheme.textDark,
                            fontFamily: 'Poppins')),
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
                        strokeWidth: 2, color: AppTheme.warning))
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

// ── Upcoming tab ──────────────────────────────────────────────────────────────
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
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        result['success'] == true
            ? 'Session confirmed!'
            : result['message'] as String? ?? 'Failed to confirm',
        style: const TextStyle(fontFamily: 'Poppins'),
      ),
      backgroundColor:
          result['success'] == true ? AppTheme.success : AppTheme.error,
      behavior: SnackBarBehavior.floating,
    ));
  }

  Future<void> _cancel(String sessionId) async {
    setState(() => _processingId = sessionId);
    final result = await context.read<AppState>().cancelSession(sessionId);
    if (!mounted) return;
    setState(() => _processingId = null);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        result['success'] == true
            ? 'Session booking cancelled.'
            : result['message'] as String? ?? 'Failed to cancel session',
        style: const TextStyle(fontFamily: 'Poppins'),
      ),
      backgroundColor:
          result['success'] == true ? AppTheme.textDark : AppTheme.error,
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final sessions = widget.state.sessions.where((s) => s.isUpcoming).toList();
    final myId = widget.state.currentUser?.id ?? '';
    final isTutor = widget.state.currentUser?.role == 'tutor';

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
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

  String _month(int m) => const [
        '',
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
      ][m];

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
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
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
}

// ── Status chip ───────────────────────────────────────────────────────────────
class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final (Color color, String label) = switch (status) {
      'pending'   => (AppTheme.warning, 'Pending'),
      'scheduled' => (AppTheme.success, 'Confirmed'),
      'completed' => (AppTheme.primary, 'Completed'),
      'cancelled' => (AppTheme.error, 'Cancelled'),
      _           => (AppTheme.textMuted, status),
    };
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
class _PastTab extends StatefulWidget {
  final AppState state;
  const _PastTab({required this.state});

  @override
  State<_PastTab> createState() => _PastTabState();
}

class _PastTabState extends State<_PastTab> {
  // Tracks which sessions the student has already rated this session
  // (keyed by session.id → score given, so the UI updates instantly).
  final Map<String, int> _ratedThisSession = {};

  @override
  Widget build(BuildContext context) {
    final sessions = widget.state.sessions.where((s) => s.isPast).toList();
    final myId = widget.state.currentUser?.id ?? '';
    final isStudent = widget.state.currentUser?.role == 'student';

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
          ...sessions.map((s) => _PastSessionCard(
                session: s,
                myId: myId,
                isStudent: isStudent,
                localRating: _ratedThisSession[s.id],
                onRated: (score) =>
                    setState(() => _ratedThisSession[s.id] = score),
              )),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Past session card (with inline rate-tutor for students) ───────────────────
class _PastSessionCard extends StatelessWidget {
  final StudySession session;
  final String myId;
  final bool isStudent;
  final int? localRating; // optimistic local value set right after rating
  final ValueChanged<int> onRated;

  const _PastSessionCard({
    required this.session,
    required this.myId,
    required this.isStudent,
    required this.localRating,
    required this.onRated,
  });

  String _month(int m) => const [
        '',
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
      ][m];

  @override
  Widget build(BuildContext context) {
    final otherName = session.otherName(myId);
    final initials = otherName.isNotEmpty ? otherName[0].toUpperCase() : 'U';
    final dt = session.scheduledAt.toLocal();
    final dateStr = '${_month(dt.month)} ${dt.day}, ${dt.year}';
    final timeStr =
        '${dt.hour % 12 == 0 ? 12 : dt.hour % 12}:${dt.minute.toString().padLeft(2, '0')} ${dt.hour < 12 ? 'AM' : 'PM'}';

    // Only students can rate completed sessions with a tutor
    final canRate = isStudent && session.isCompleted;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        children: [
          // ── Main info ──────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: session.isCompleted
                            ? AppTheme.primary.withValues(alpha: 0.08)
                            : AppTheme.error.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(initials,
                            style: TextStyle(
                                color: session.isCompleted
                                    ? AppTheme.primary
                                    : AppTheme.error,
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
              ],
            ),
          ),

          // ── Rate tutor section (students only, completed sessions) ─────
          if (canRate) ...[
            Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppTheme.borderLight)),
                borderRadius:
                    BorderRadius.vertical(bottom: Radius.circular(16)),
              ),
              child: _RateTutorRow(
                session: session,
                tutorName: otherName,
                localRating: localRating,
                onRated: onRated,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Inline rate-tutor row ─────────────────────────────────────────────────────
class _RateTutorRow extends StatefulWidget {
  final StudySession session;
  final String tutorName;
  final int? localRating;
  final ValueChanged<int> onRated;

  const _RateTutorRow({
    required this.session,
    required this.tutorName,
    required this.localRating,
    required this.onRated,
  });

  @override
  State<_RateTutorRow> createState() => _RateTutorRowState();
}

class _RateTutorRowState extends State<_RateTutorRow> {
  // null = not yet checked; populated after first fetch
  int? _existingRating;
  bool _loadingExisting = true;

  @override
  void initState() {
    super.initState();
    _fetchExisting();
  }

  Future<void> _fetchExisting() async {
    final me = context.read<AppState>().currentUser;
    if (me == null) {
      setState(() => _loadingExisting = false);
      return;
    }
    final result = await ApiService.getReviews(
      tutorId: widget.session.tutorUserId,
      raterId: me.id,
    );
    if (mounted) {
      setState(() {
        _existingRating = result.myRating;
        _loadingExisting = false;
      });
    }
  }

  void _openRateSheet() {
    final effectiveRating = widget.localRating ?? _existingRating;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RateSheet(
        tutorName: widget.tutorName,
        tutorId: widget.session.tutorUserId,
        existingRating: effectiveRating,
        onSubmitted: (score) {
          widget.onRated(score);
          setState(() => _existingRating = score);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveRating = widget.localRating ?? _existingRating;
    final hasRated = effectiveRating != null;

    if (_loadingExisting) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 14),
        child: Center(
            child: SizedBox(
                width: 18,
                height: 18,
                child:
                    CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Row(
        children: [
          // Star display / prompt
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hasRated
                      ? 'Your rating for ${widget.tutorName.split(' ').first}'
                      : 'Rate ${widget.tutorName.split(' ').first}',
                  style: const TextStyle(
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Row(
                  children: List.generate(5, (i) {
                    final filled = hasRated && i < effectiveRating!;
                    return Icon(
                      filled ? Icons.star_rounded : Icons.star_border_rounded,
                      color: filled ? AppTheme.warning : AppTheme.textMuted,
                      size: 20,
                    );
                  }),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // CTA button
          GestureDetector(
            onTap: _openRateSheet,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              decoration: BoxDecoration(
                gradient: hasRated
                    ? null
                    : const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.accent]),
                color: hasRated ? null : null,
                border: hasRated
                    ? Border.all(color: AppTheme.primary)
                    : null,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    hasRated ? Icons.edit_rounded : Icons.star_rounded,
                    color: hasRated ? AppTheme.primary : Colors.white,
                    size: 14,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    hasRated ? 'Edit Review' : 'Rate Now',
                    style: TextStyle(
                        color: hasRated ? AppTheme.primary : Colors.white,
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
    );
  }
}

// ── Rate sheet bottom modal ───────────────────────────────────────────────────
class _RateSheet extends StatefulWidget {
  final String tutorName;
  final String tutorId;
  final int? existingRating;
  final ValueChanged<int> onSubmitted;

  const _RateSheet({
    required this.tutorName,
    required this.tutorId,
    required this.existingRating,
    required this.onSubmitted,
  });

  @override
  State<_RateSheet> createState() => _RateSheetState();
}

class _RateSheetState extends State<_RateSheet> {
  late int _stars;
  final _reviewCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _stars = widget.existingRating ?? 0;
  }

  @override
  void dispose() {
    _reviewCtrl.dispose();
    super.dispose();
  }

  String _starLabel(int s) => switch (s) {
        1 => 'Poor',
        2 => 'Fair',
        3 => 'Good',
        4 => 'Very Good',
        5 => 'Excellent!',
        _ => 'Tap a star to rate',
      };

  Future<void> _submit() async {
    if (_stars == 0) return;
    setState(() => _submitting = true);
    final me = context.read<AppState>().currentUser;
    if (me == null) return;

    final result = await context.read<AppState>().rateUser(
          ratedId: widget.tutorId,
          score: _stars,
          review: _reviewCtrl.text.trim(),
        );

    if (!mounted) return;
    Navigator.pop(context);

    final ok = result['success'] == true;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        ok ? '⭐ Review submitted!' : result['message'] ?? 'Failed to submit',
        style: const TextStyle(fontFamily: 'Poppins'),
      ),
      backgroundColor: ok ? AppTheme.success : AppTheme.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));

    if (ok) widget.onSubmitted(_stars);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existingRating != null;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: AppTheme.borderLight,
                  borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 20),

            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [AppTheme.primary, AppTheme.accent]),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      widget.tutorName.isNotEmpty
                          ? widget.tutorName[0].toUpperCase()
                          : 'T',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                          fontFamily: 'Poppins'),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEdit ? 'Update Your Review' : 'Rate This Tutor',
                        style: const TextStyle(
                            color: AppTheme.textDark,
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                            fontFamily: 'Poppins'),
                      ),
                      Text(widget.tutorName,
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
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('How would you rate this tutor?',
                  style: TextStyle(
                      color: AppTheme.textBody,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w500)),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final filled = i < _stars;
                return GestureDetector(
                  onTap: () => setState(() => _stars = i + 1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(
                      filled
                          ? Icons.star_rounded
                          : Icons.star_border_rounded,
                      color: filled ? AppTheme.warning : AppTheme.borderLight,
                      size: 46,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 8),
            Text(
              _starLabel(_stars),
              style: TextStyle(
                  color:
                      _stars > 0 ? AppTheme.warning : AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 24),

            // Written review
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Write a review (optional)',
                  style: TextStyle(
                      color: AppTheme.textBody,
                      fontFamily: 'Poppins',
                      fontSize: 13,
                      fontWeight: FontWeight.w500)),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _reviewCtrl,
              maxLines: 4,
              maxLength: 500,
              style: const TextStyle(
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins',
                  fontSize: 14),
              decoration: InputDecoration(
                hintText:
                    'Share your experience — what did this tutor do well?',
                hintStyle: const TextStyle(
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins',
                    fontSize: 13,
                    height: 1.5),
                filled: true,
                fillColor: const Color(0xFFF5F5F8),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide:
                        const BorderSide(color: AppTheme.borderLight)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide:
                        const BorderSide(color: AppTheme.borderLight)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(
                        color: AppTheme.primary, width: 1.5)),
                counterStyle:
                    const TextStyle(color: AppTheme.textMuted),
              ),
            ),
            const SizedBox(height: 20),

            // Submit
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_submitting || _stars == 0) ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  disabledBackgroundColor:
                      AppTheme.primary.withValues(alpha: 0.3),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : Text(
                        isEdit ? 'Update Review' : 'Submit Review',
                        style: const TextStyle(
                            fontFamily: 'Poppins',
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
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
          Text(title,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 6),
          Text(subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  height: 1.4)),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 18),
            OutlinedButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.search, size: 16),
              label: Text(actionLabel!,
                  style: const TextStyle(
                      fontFamily: 'Poppins', fontSize: 13)),
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
        ],
      ),
    );
  }
}