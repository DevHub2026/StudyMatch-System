import 'package:flutter/material.dart';

/// Student app destinations — aligned with studymatch-web StudentSidebar.
enum StudentNav {
  dashboard,
  findTutors,
  myMatches,
  studySessions,
  mySubjects,
  messages,
  assignments,
  schedule,
  resources,
  profile,
  settings,
  help,
}

extension StudentNavX on StudentNav {
  String get label => switch (this) {
        StudentNav.dashboard => 'Dashboard',
        StudentNav.findTutors => 'Find Tutors',
        StudentNav.myMatches => 'My Matches',
        StudentNav.studySessions => 'Study Sessions',
        StudentNav.mySubjects => 'My Subjects',
        StudentNav.messages => 'Messages',
        StudentNav.assignments => 'Assignments',
        StudentNav.schedule => 'My Schedule',
        StudentNav.resources => 'Resources',
        StudentNav.profile => 'Profile',
        StudentNav.settings => 'Settings',
        StudentNav.help => 'Help Center',
      };

  IconData get icon => switch (this) {
        StudentNav.dashboard => Icons.home_outlined,
        StudentNav.findTutors => Icons.search,
        StudentNav.myMatches => Icons.handshake_outlined,
        StudentNav.studySessions => Icons.calendar_month_outlined,
        StudentNav.mySubjects => Icons.bookmark_outline_rounded,
        StudentNav.messages => Icons.chat_bubble_outline_rounded,
        StudentNav.assignments => Icons.assignment_outlined,
        StudentNav.schedule => Icons.calendar_today_outlined,
        StudentNav.resources => Icons.library_books_outlined,
        StudentNav.profile => Icons.person_outline_rounded,
        StudentNav.settings => Icons.settings_outlined,
        StudentNav.help => Icons.help_outline_rounded,
      };

  IconData get activeIcon => switch (this) {
        StudentNav.dashboard => Icons.home_rounded,
        StudentNav.findTutors => Icons.search,
        StudentNav.myMatches => Icons.handshake_rounded,
        StudentNav.studySessions => Icons.calendar_month_rounded,
        StudentNav.mySubjects => Icons.bookmark_rounded,
        StudentNav.messages => Icons.chat_bubble_rounded,
        StudentNav.assignments => Icons.assignment_rounded,
        StudentNav.schedule => Icons.calendar_today_rounded,
        StudentNav.resources => Icons.library_books_rounded,
        StudentNav.profile => Icons.person_rounded,
        StudentNav.settings => Icons.settings_rounded,
        StudentNav.help => Icons.help_rounded,
      };

  bool get showMessageBadge => this == StudentNav.messages;
}

/// Primary nav items shown in the drawer (matches web order).
const List<StudentNav> studentPrimaryNav = [
  StudentNav.dashboard,
  StudentNav.findTutors,
  StudentNav.myMatches,
  StudentNav.studySessions,
  StudentNav.mySubjects,
  StudentNav.messages,
  StudentNav.assignments,
  StudentNav.schedule,
  StudentNav.resources,
  StudentNav.profile,
];
