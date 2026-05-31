import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../navigation/student_nav.dart';
import '../../services/app_state.dart';
import '../../utils/app_theme.dart';
import '../../widgets/shell_scope.dart';
import '../../widgets/student_drawer.dart';
import 'dashboard_screen.dart';
import 'match_screen.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';
import 'sessions_screen.dart';
import 'resources_screen.dart';
import 'profile_screen.dart';
import 'my_matches_screen.dart';
import 'placeholder_screen.dart';
import 'settings_screen.dart';
import 'find_students_screen.dart';
import 'complaints_screen.dart';
import 'schedule_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  StudentNav _current = StudentNav.dashboard;

  // ── 4 tabs — Profile removed ─────────────────────────────────────────────
  static const List<StudentNav> _bottomNavItems = [
    StudentNav.dashboard,
    StudentNav.findTutors,
    StudentNav.studySessions,
    StudentNav.messages,
  ];

  int get _bottomIndex {
    final i = _bottomNavItems.indexOf(_current);
    return i >= 0 ? i : 0;
  }

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _navigate(StudentNav dest) {
    setState(() => _current = dest);
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.of(context).pop();
    }
  }

  void _onBottomNavTap(int index) {
    _navigate(_bottomNavItems[index]);
  }

  Widget _screenFor(StudentNav nav, {bool isTutor = false}) {
    return switch (nav) {
      StudentNav.dashboard     => const DashboardScreen(),
      StudentNav.findTutors    => isTutor ? const FindStudentsScreen() : const MatchScreen(),
      StudentNav.myMatches     => const MyMatchesScreen(),
      StudentNav.studySessions => const SessionsScreen(),
      StudentNav.messages      => const MessagesScreen(),
      StudentNav.notifications => const NotificationsScreen(),
      StudentNav.schedule      => const ScheduleScreen(),
      StudentNav.resources     => const ResourcesScreen(),
      StudentNav.profile       => const ProfileScreen(),
      StudentNav.settings      => const SettingsScreen(),
      StudentNav.help          => const PlaceholderScreen(
          title: 'Help Center',
          message: 'Get support and browse help articles.',
          icon: Icons.help_rounded,
        ),
      StudentNav.complaints    => const ComplaintsScreen(),
      StudentNav.feedback      => const PlaceholderScreen(
          title: 'Feedback',
          message: 'Share your thoughts to help us improve StudyMatch.',
          icon: Icons.chat_bubble_outline_rounded,
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final state   = context.watch<AppState>();
    final unread  = state.unreadMessageCount;
    final isTutor = state.currentUser?.role == 'tutor';

    return ShellScope(
      current: _current,
      navigate: _navigate,
      openDrawer: _openDrawer,
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: AppTheme.bgLight,
        drawer: const StudentDrawer(),
        body: _screenFor(_current, isTutor: isTutor),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 12,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: _bottomIndex,
            onTap: _onBottomNavTap,
            backgroundColor: AppTheme.surfaceLight,
            elevation: 0,
            selectedItemColor: AppTheme.primary,
            unselectedItemColor: AppTheme.textMuted,
            type: BottomNavigationBarType.fixed,
            selectedLabelStyle: const TextStyle(
                fontFamily: 'Poppins',
                fontSize: 11,
                fontWeight: FontWeight.w600),
            unselectedLabelStyle:
                const TextStyle(fontFamily: 'Poppins', fontSize: 11),
            items: [
              const BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home_rounded),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.search),
                activeIcon: const Icon(Icons.search),
                label: isTutor ? 'Find Student' : 'Find Tutor',
              ),
              const BottomNavigationBarItem(
                icon: Icon(Icons.calendar_today_outlined),
                activeIcon: Icon(Icons.calendar_today_rounded),
                label: 'Sessions',
              ),
              BottomNavigationBarItem(
                icon: _MessageIcon(count: unread, active: false),
                activeIcon: _MessageIcon(count: unread, active: true),
                label: 'Messages',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageIcon extends StatelessWidget {
  final int count;
  final bool active;
  const _MessageIcon({required this.count, required this.active});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(active
            ? Icons.chat_bubble_rounded
            : Icons.chat_bubble_outline_rounded),
        if (count > 0)
          Positioned(
            right: -6,
            top: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                count > 9 ? '9+' : '$count',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.bold),
              ),
            ),
          ),
      ],
    );
  }
}