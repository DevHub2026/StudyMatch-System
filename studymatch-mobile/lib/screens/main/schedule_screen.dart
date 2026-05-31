import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/app_state.dart';
import '../../utils/app_theme.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});
  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  late DateTime _focusedMonth;
  late DateTime _selectedDay;

  static const _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  static const _dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _focusedMonth = DateTime(now.year, now.month);
    _selectedDay  = DateTime(now.year, now.month, now.day);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().loadSessions();
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  static bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  /// Groups non-cancelled sessions by their calendar day (midnight-normalised).
  Map<DateTime, List<StudySession>> _groupByDay(List<StudySession> sessions) {
    final map = <DateTime, List<StudySession>>{};
    for (final s in sessions) {
      if (s.isCancelled) continue;
      final key = DateTime(
          s.scheduledAt.year, s.scheduledAt.month, s.scheduledAt.day);
      (map[key] ??= []).add(s);
    }
    return map;
  }

  List<StudySession> _forDay(List<StudySession> sessions, DateTime day) =>
      sessions.where((s) => _sameDay(s.scheduledAt, day)).toList()
        ..sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));

  void _prevMonth() => setState(() {
        _focusedMonth =
            DateTime(_focusedMonth.year, _focusedMonth.month - 1);
      });

  void _nextMonth() => setState(() {
        _focusedMonth =
            DateTime(_focusedMonth.year, _focusedMonth.month + 1);
      });

  void _jumpToToday() {
    final now = DateTime.now();
    setState(() {
      _focusedMonth = DateTime(now.year, now.month);
      _selectedDay  = DateTime(now.year, now.month, now.day);
    });
  }

  String _selectedDayLabel() {
    final now    = DateTime.now();
    final today  = DateTime(now.year, now.month, now.day);
    final tmrw   = today.add(const Duration(days: 1));
    if (_sameDay(_selectedDay, today)) return 'Today';
    if (_sameDay(_selectedDay, tmrw))  return 'Tomorrow';
    return '${_monthNames[_selectedDay.month - 1]} ${_selectedDay.day}, ${_selectedDay.year}';
  }

  Color _statusColor(String status) => switch (status) {
        'scheduled' => AppTheme.primary,
        'pending'   => const Color(0xFFF59E0B),
        'completed' => AppTheme.success,
        _           => AppTheme.textMuted,
      };

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final state    = context.watch<AppState>();
    final sessions = state.sessions.toList();
    final grouped  = _groupByDay(sessions);
    final daySessions = _forDay(sessions, _selectedDay);
    final myId     = state.currentUser?.id ?? '';

    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(),
            _buildCalendar(grouped),
            const Divider(height: 1, color: AppTheme.borderLight),
            Expanded(child: _buildSessionList(daySessions, myId)),
          ],
        ),
      ),
    );
  }

  // ── Top bar ────────────────────────────────────────────────────────────────

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'My Schedule',
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins'),
            ),
          ),
          TextButton(
            onPressed: _jumpToToday,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              backgroundColor: AppTheme.primary.withValues(alpha: 0.08),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text(
              'Today',
              style: TextStyle(
                  fontFamily: 'Poppins',
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  // ── Calendar grid ──────────────────────────────────────────────────────────

  Widget _buildCalendar(Map<DateTime, List<StudySession>> grouped) {
    final year       = _focusedMonth.year;
    final month      = _focusedMonth.month;
    final firstDay   = DateTime(year, month, 1);
    final daysInMonth = DateTime(year, month + 1, 0).day;
    // weekday: Mon=1 … Sun=7 → convert to Sun=0 … Sat=6
    final startOffset = firstDay.weekday % 7;
    final now = DateTime.now();
    final todayKey = DateTime(now.year, now.month, now.day);

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Month navigation
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left_rounded,
                      color: AppTheme.textDark, size: 24),
                  onPressed: _prevMonth,
                ),
                Expanded(
                  child: Text(
                    '${_monthNames[month - 1]} $year',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: AppTheme.textDark),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right_rounded,
                      color: AppTheme.textDark, size: 24),
                  onPressed: _nextMonth,
                ),
              ],
            ),
          ),

          // Day-of-week header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: _dayLabels
                  .map((d) => Expanded(
                        child: Center(
                          child: Text(d,
                              style: const TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textMuted)),
                        ),
                      ))
                  .toList(),
            ),
          ),

          const SizedBox(height: 6),

          // Day cells
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                childAspectRatio: 1.05,
              ),
              itemCount: startOffset + daysInMonth,
              itemBuilder: (_, index) {
                // Empty leading cells
                if (index < startOffset) return const SizedBox();

                final day     = index - startOffset + 1;
                final date    = DateTime(year, month, day);
                final isToday = _sameDay(date, todayKey);
                final isSel   = _sameDay(date, _selectedDay);
                final daySess = grouped[date] ?? [];
                final hasSess = daySess.isNotEmpty;

                return GestureDetector(
                  onTap: () => setState(() => _selectedDay = date),
                  child: Container(
                    margin: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: isSel
                          ? AppTheme.primary
                          : isToday
                              ? AppTheme.primary.withValues(alpha: 0.1)
                              : null,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '$day',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontSize: 13,
                              fontWeight: (isToday || isSel)
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isSel
                                  ? Colors.white
                                  : isToday
                                      ? AppTheme.primary
                                      : AppTheme.textDark),
                        ),
                        if (hasSess) ...[
                          const SizedBox(height: 2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: daySess.take(3).map((s) {
                              final dotColor = isSel
                                  ? Colors.white.withValues(alpha: 0.85)
                                  : _statusColor(s.status);
                              return Container(
                                width: 5,
                                height: 5,
                                margin:
                                    const EdgeInsets.symmetric(horizontal: 1),
                                decoration: BoxDecoration(
                                    color: dotColor, shape: BoxShape.circle),
                              );
                            }).toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Session list for selected day ──────────────────────────────────────────

  Widget _buildSessionList(List<StudySession> sessions, String myId) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section heading
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _selectedDayLabel(),
                  style: const TextStyle(
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: AppTheme.textDark),
                ),
              ),
              if (sessions.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${sessions.length} session${sessions.length == 1 ? '' : 's'}',
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        color: AppTheme.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600),
                  ),
                ),
            ],
          ),
        ),

        if (sessions.isEmpty)
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.event_available_rounded,
                      color: AppTheme.textMuted.withValues(alpha: 0.5),
                      size: 44),
                  const SizedBox(height: 10),
                  const Text(
                    'No sessions scheduled',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        color: AppTheme.textMuted,
                        fontSize: 14,
                        fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Tap a highlighted day to see sessions',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        color: AppTheme.textMuted,
                        fontSize: 12),
                  ),
                ],
              ),
            ),
          )
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              itemCount: sessions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) =>
                  _SessionTile(session: sessions[i], myId: myId),
            ),
          ),
      ],
    );
  }
}

// ── Session tile ───────────────────────────────────────────────────────────────

class _SessionTile extends StatelessWidget {
  final StudySession session;
  final String myId;

  const _SessionTile({required this.session, required this.myId});

  Color _statusColor(String s) => switch (s) {
        'scheduled' => AppTheme.primary,
        'pending'   => const Color(0xFFF59E0B),
        'completed' => AppTheme.success,
        _           => AppTheme.textMuted,
      };

  String _formatTime(DateTime dt) {
    final h  = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final m  = dt.minute.toString().padLeft(2, '0');
    final ap = dt.hour < 12 ? 'AM' : 'PM';
    return '$h:$m $ap';
  }

  String _endTime(DateTime start, int minutes) =>
      _formatTime(start.add(Duration(minutes: minutes)));

  @override
  Widget build(BuildContext context) {
    final status      = session.status;
    final color       = _statusColor(status);
    final partner     = session.otherName(myId);
    final startTime   = _formatTime(session.scheduledAt);
    final endTime     = _endTime(session.scheduledAt, session.durationMinutes);
    final statusLabel =
        '${status[0].toUpperCase()}${status.substring(1)}';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Coloured accent bar
          Container(
            width: 4,
            height: 52,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),

          // Time column
          SizedBox(
            width: 70,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(startTime,
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppTheme.textDark)),
                Text(endTime,
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 11,
                        color: AppTheme.textMuted)),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Session info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  partner,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: AppTheme.textDark),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: color),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${session.durationMinutes} min',
                      style: const TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 11,
                          color: AppTheme.textMuted),
                    ),
                  ],
                ),
                if (session.notes?.isNotEmpty == true) ...[
                  const SizedBox(height: 4),
                  Text(
                    session.notes!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 11,
                        color: AppTheme.textMuted),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
