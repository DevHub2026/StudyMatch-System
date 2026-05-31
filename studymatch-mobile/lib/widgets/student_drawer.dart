import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../navigation/student_nav.dart';
import '../services/app_state.dart';
import '../utils/app_theme.dart';
import 'shell_scope.dart';
import '../screens/main/help_center_screen.dart';

class StudentDrawer extends StatefulWidget {
  const StudentDrawer({super.key});

  @override
  State<StudentDrawer> createState() => _StudentDrawerState();
}

class _StudentDrawerState extends State<StudentDrawer> {
  // bool _settingsOpen = false;

  @override
  Widget build(BuildContext context) {
    final scope = ShellScope.of(context);
    final state = context.watch<AppState>();
    final user = state.currentUser;
    final unread = state.unreadMessageCount;

    final initials = user?.fullName.isNotEmpty == true
        ? user!.fullName
            .trim()
            .split(' ')
            .map((e) => e[0])
            .take(2)
            .join()
            .toUpperCase()
        : 'SM';

    return Drawer(
      width: 280,
      backgroundColor: AppTheme.surfaceLight,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.school_rounded,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text.rich(
                      TextSpan(
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins',
                        ),
                        children: [
                          TextSpan(text: 'Study'),
                          TextSpan(
                              text: 'Match',
                              style: TextStyle(color: AppTheme.primary)),
                        ],
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded,
                        color: AppTheme.textMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.borderLight),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.15),
                      child: Text(
                        initials,
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Student',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: AppTheme.textDark,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          Text(
                            user?.role ?? 'student',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                children: [
                  ...studentPrimaryNav.map((dest) => _NavTile(
                        dest: dest,
                        selected: scope.current == dest,
                        badge: dest.showMessageBadge && unread > 0
                            ? (unread > 9 ? '9+' : '$unread')
                            : null,
                        onTap: () => scope.navigate(dest),
                      )),
                  const SizedBox(height: 4),
                  _NavTile(
                    dest: StudentNav.settings,
                    selected: scope.current == StudentNav.settings,
                    onTap: () =>
                        setState(() => scope.navigate(StudentNav.settings)),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
              child: Material(
                color: const Color(0xFFF3F0FF),
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const HelpCenterScreen())),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        Icon(Icons.help_outline_rounded,
                            color: AppTheme.primary, size: 20),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Need Help?',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13,
                                  color: AppTheme.textDark,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              Text(
                                'Visit our Help Center',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.textMuted,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.chevron_right_rounded,
                            color: AppTheme.primary, size: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final StudentNav dest;
  final bool selected;
  final String? badge;
  final VoidCallback onTap;
  final Widget? trailing;

  const _NavTile({
    required this.dest,
    required this.selected,
    required this.onTap,
    this.badge,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Material(
        color: selected ? const Color(0xFFF3F0FF) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            child: Row(
              children: [
                Icon(
                  selected ? dest.activeIcon : dest.icon,
                  size: 20,
                  color: selected ? AppTheme.primary : AppTheme.textBody,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    dest.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                      color: selected ? AppTheme.primary : AppTheme.textBody,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
                if (badge != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badge!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SubNav extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _SubNav(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 44, bottom: 2),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textBody,
              fontFamily: 'Poppins',
            ),
          ),
        ),
      ),
    );
  }
}
