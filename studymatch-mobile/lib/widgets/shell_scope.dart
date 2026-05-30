import 'package:flutter/material.dart';
import '../navigation/student_nav.dart';

/// Provides drawer + tab navigation from [MainShell] to child screens.
class ShellScope extends InheritedWidget {
  const ShellScope({
    super.key,
    required this.current,
    required this.navigate,
    required this.openDrawer,
    required super.child,
  });

  final StudentNav current;
  final ValueChanged<StudentNav> navigate;
  final VoidCallback openDrawer;

  static ShellScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ShellScope>();
  }

  static ShellScope of(BuildContext context) {
    final scope = maybeOf(context);
    assert(scope != null, 'ShellScope not found — wrap screen in MainShell');
    return scope!;
  }

  @override
  bool updateShouldNotify(ShellScope oldWidget) => oldWidget.current != current;
}
