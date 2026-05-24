import 'package:flutter/material.dart';
import '../../navigation/student_nav.dart';
import '../../utils/app_theme.dart';
import '../../widgets/shell_scope.dart';
import '../../widgets/student_drawer.dart';
import 'dashboard_screen.dart';
import 'match_screen.dart';
import 'messages_screen.dart';
import 'sessions_screen.dart';
import 'resources_screen.dart';
import 'profile_screen.dart';
import 'my_matches_screen.dart';
import 'placeholder_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  StudentNav _current = StudentNav.dashboard;

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _navigate(StudentNav dest) {
    setState(() => _current = dest);
    if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
      Navigator.of(context).pop();
    }
  }

  Widget _screenFor(StudentNav nav) {
    return switch (nav) {
      StudentNav.dashboard => const DashboardScreen(),
      StudentNav.findTutors => const MatchScreen(),
      StudentNav.myMatches => const MyMatchesScreen(),
      StudentNav.studySessions => const SessionsScreen(),
      StudentNav.mySubjects => const PlaceholderScreen(
          title: 'My Subjects',
          message: 'Manage your subjects from the web app or complete profile setup.',
          icon: Icons.bookmark_rounded,
        ),
      StudentNav.messages => const MessagesScreen(),
      StudentNav.assignments => const PlaceholderScreen(
          title: 'Assignments',
          icon: Icons.assignment_rounded,
        ),
      StudentNav.schedule => const PlaceholderScreen(
          title: 'My Schedule',
          icon: Icons.calendar_today_rounded,
        ),
      StudentNav.resources => const ResourcesScreen(),
      StudentNav.profile => const ProfileScreen(),
      StudentNav.settings => const PlaceholderScreen(
          title: 'Settings',
          message: 'Account, notifications, and privacy settings.',
          icon: Icons.settings_rounded,
        ),
      StudentNav.help => const PlaceholderScreen(
          title: 'Help Center',
          message: 'Get support and browse help articles.',
          icon: Icons.help_rounded,
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    return ShellScope(
      current: _current,
      navigate: _navigate,
      openDrawer: _openDrawer,
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: AppTheme.bgLight,
        drawer: const StudentDrawer(),
        body: _screenFor(_current),
      ),
    );
  }
}
