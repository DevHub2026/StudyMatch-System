import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import 'shell_scope.dart';

/// Top bar with working menu button (opens [StudentDrawer]).
class AppShellHeader extends StatelessWidget {
  final String? title;
  final bool showLogo;
  final List<Widget>? actions;
  final Color iconColor;
  final Color backgroundColor;

  const AppShellHeader({
    super.key,
    this.title,
    this.showLogo = true,
    this.actions,
    this.iconColor = AppTheme.textDark,
    this.backgroundColor = Colors.transparent,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(4, 4, 8, 4),
        child: Row(
          children: [
            IconButton(
              icon: Icon(Icons.menu_rounded, color: iconColor),
              tooltip: 'Menu',
              onPressed: () {
                final scope = ShellScope.maybeOf(context);
                if (scope != null) {
                  scope.openDrawer();
                } else {
                  Scaffold.of(context).openDrawer();
                }
              },
            ),
            if (showLogo && title == null) ...[
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.school_rounded, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 8),
              Text.rich(
                TextSpan(
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: iconColor,
                    fontFamily: 'Poppins',
                  ),
                  children: const [
                    TextSpan(text: 'Study'),
                    TextSpan(text: 'Match', style: TextStyle(color: AppTheme.primary)),
                  ],
                ),
              ),
            ] else if (title != null)
              Expanded(
                child: Text(
                  title!,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: iconColor,
                    fontFamily: 'Poppins',
                  ),
                ),
              )
            else
              const Spacer(),
            if (title != null) const Spacer(),
            ...?actions,
          ],
        ),
      ),
    );
  }
}
