import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../widgets/profile_avatar.dart';
import '../../widgets/shell_scope.dart';
import '../../navigation/student_nav.dart';
import 'edit_profile_screen.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.currentUser;
    if (user == null) return const SizedBox.shrink();

    final isTutor = user.role == 'tutor';
    final unread = state.unreadMessageCount;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Header ──────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'My Profile',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textDark,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F0F4),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.settings_outlined,
                            color: AppTheme.textDark, size: 20),
                      ),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const SettingsScreen()),
                      ),
                    ),
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        IconButton(
                          icon: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F0F4),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.notifications_outlined,
                                color: AppTheme.textDark, size: 20),
                          ),
                          onPressed: () => ShellScope.of(context)
                              .navigate(StudentNav.notifications),
                        ),
                        if (unread > 0)
                          Positioned(
                            right: 8,
                            top: 8,
                            child: Container(
                              width: 16,
                              height: 16,
                              decoration: const BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle),
                              child: Center(
                                child: Text(
                                  unread > 9 ? '9+' : '$unread',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 8,
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
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // ── Profile info card ────────────────────────────────────────
            SliverToBoxAdapter(
              child: _ProfileInfoCard(user: user, isTutor: isTutor),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // ── Stats card ───────────────────────────────────────────────
            SliverToBoxAdapter(
              child: _StatsCard(state: state, isTutor: isTutor),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // ── My Sessions section ──────────────────────────────────────
            SliverToBoxAdapter(
              child: _MySessions(state: state),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // ── Navigation links ─────────────────────────────────────────
            SliverToBoxAdapter(
              child: _NavLinks(unread: unread),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // ── Profile attribute sections ───────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildListDelegate(
                  _buildAttributeSections(context, user, isTutor),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildAttributeSections(
      BuildContext context, dynamic user, bool isTutor) {
    final widgets = <Widget>[];

    if (user.subjects.isNotEmpty) {
      widgets.addAll([
        _LightSection(
          title: 'Subjects',
          child: _TagWrap(user.subjects, AppTheme.primary),
        ),
        const SizedBox(height: 10),
      ]);
    }

    if (user.strengths.isNotEmpty) {
      widgets.addAll([
        _LightSection(
          title: isTutor ? 'Can Tutor' : 'Strong Subjects',
          child: _TagWrap(user.strengths, AppTheme.success),
        ),
        const SizedBox(height: 10),
      ]);
    }

    if (user.weaknesses.isNotEmpty) {
      widgets.addAll([
        _LightSection(
          title: isTutor ? 'Still Learning' : 'Needs Help With',
          child: _TagWrap(user.weaknesses, AppTheme.error),
        ),
        const SizedBox(height: 10),
      ]);
    }

    if (user.learningStyles.isNotEmpty) {
      widgets.addAll([
        _LightSection(
          title: 'Learning Style',
          child: _TagWrap(user.learningStyles, AppTheme.accent),
        ),
        const SizedBox(height: 10),
      ]);
    }

    if (user.studyStyles.isNotEmpty) {
      widgets.addAll([
        _LightSection(
          title: 'Study Format',
          child: _TagWrap(user.studyStyles, AppTheme.warning),
        ),
        const SizedBox(height: 10),
      ]);
    }

    if (user.availability.isNotEmpty) {
      widgets.addAll([
        _LightSection(
          title: 'Availability',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: user.availability.entries.map<Widget>((e) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(e.key,
                        style: const TextStyle(
                            color: AppTheme.textBody,
                            fontFamily: 'Poppins',
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    _TagWrap(e.value, const Color(0xFF3B82F6)),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 10),
      ]);
    }

    if (widgets.isEmpty) {
      widgets.add(
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Column(
            children: [
              const Icon(Icons.person_add_outlined,
                  size: 36, color: AppTheme.primary),
              const SizedBox(height: 10),
              const Text('No profile details yet',
                  style: TextStyle(
                      color: AppTheme.textDark,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                      fontSize: 14)),
              const SizedBox(height: 6),
              const Text(
                  'Edit your profile to add your subjects,\nlearning style, and availability.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: AppTheme.textMuted,
                      fontFamily: 'Poppins',
                      fontSize: 12,
                      height: 1.5)),
              const SizedBox(height: 14),
              ElevatedButton.icon(
                onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const EditProfileScreen())),
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Edit Profile',
                    style: TextStyle(fontFamily: 'Poppins')),
                style:
                    ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              ),
            ],
          ),
        ),
      );
    }

    return widgets;
  }
}

/// Returns a human-readable bio string, or null if the bio is a JSON blob
/// (registration data stored by the tutor onboarding flow).
String? _readableBio(String? bio) {
  if (bio == null || bio.isEmpty) return null;
  final trimmed = bio.trim();
  // If it starts with '{' it's the JSON registration payload — not displayable as bio
  if (trimmed.startsWith('{')) {
    // Try to extract a personal_bio key if it exists
    try {
      final Map<String, dynamic> data = Map<String, dynamic>.from(
        (RegExp(r'"personal_bio"\s*:\s*"((?:[^"\\]|\\.)*)"')
                .firstMatch(trimmed)
                ?.group(1) != null)
            ? {'personal_bio': RegExp(r'"personal_bio"\s*:\s*"((?:[^"\\]|\\.)*)"')
                .firstMatch(trimmed)!
                .group(1)!}
            : {},
      );
      final personal = data['personal_bio'] as String?;
      return (personal != null && personal.isNotEmpty) ? personal : null;
    } catch (_) {
      return null;
    }
  }
  return trimmed;
}

// ── Profile info card ─────────────────────────────────────────────────────────
class _ProfileInfoCard extends StatelessWidget {
  final dynamic user;
  final bool isTutor;
  const _ProfileInfoCard({required this.user, required this.isTutor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar with edit button
                Stack(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const EditProfileScreen())),
                      child: ProfileAvatar(
                        photoUrl: user.profilePhotoUrl,
                        displayName: user.fullName,
                        size: 78,
                        borderColor: AppTheme.borderLight,
                        borderWidth: 2,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 24,
                        height: 24,
                        decoration: const BoxDecoration(
                            color: AppTheme.primary, shape: BoxShape.circle),
                        child: const Icon(Icons.edit,
                            color: Colors.white, size: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 14),
                // Name + role + location
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              user.fullName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textDark,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check,
                                color: Colors.white, size: 10),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user.department ?? (isTutor ? 'Tutor' : 'Student'),
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textBody,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      if (user.school != null && user.school!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined,
                                size: 13, color: AppTheme.textMuted),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                user.school!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textMuted,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const EditProfileScreen())),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primary),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text(
                    'Edit Profile',
                    style: TextStyle(
                        color: AppTheme.primary,
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            if (_readableBio(user.bio) != null) ...[
              const SizedBox(height: 12),
              const Divider(color: AppTheme.borderLight, height: 1),
              const SizedBox(height: 12),
              Text(
                _readableBio(user.bio)!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textBody,
                  fontFamily: 'Poppins',
                  height: 1.5,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Stats card ────────────────────────────────────────────────────────────────
class _StatsCard extends StatelessWidget {
  final AppState state;
  final bool isTutor;
  const _StatsCard({required this.state, required this.isTutor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Row(
          children: [
            Expanded(
              child: _StatItem(
                icon: Icons.calendar_month_rounded,
                iconColor: AppTheme.primary,
                value: '${state.matchedUsers.length}',
                label: 'Sessions',
              ),
            ),
            Container(width: 1, height: 48, color: AppTheme.borderLight),
            Expanded(
              child: const _StatItem(
                icon: Icons.star_rounded,
                iconColor: AppTheme.warning,
                value: '0.0',
                label: 'Rating',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;
  const _StatItem(
      {required this.icon,
      required this.iconColor,
      required this.value,
      required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 26),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins')),
        ],
      ),
    );
  }
}

// ── My Sessions ───────────────────────────────────────────────────────────────
class _MySessions extends StatelessWidget {
  final AppState state;
  const _MySessions({required this.state});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('My Sessions',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins')),
              TextButton(
                onPressed: () =>
                    ShellScope.of(context).navigate(StudentNav.studySessions),
                child: const Text('View all',
                    style: TextStyle(
                        color: AppTheme.primary,
                        fontFamily: 'Poppins',
                        fontSize: 13,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: state.matchedUsers.isEmpty
                ? Column(
                    children: [
                      Icon(Icons.calendar_today_outlined,
                          size: 32,
                          color: AppTheme.primary.withValues(alpha: 0.6)),
                      const SizedBox(height: 10),
                      const Text('No sessions yet',
                          style: TextStyle(
                              color: AppTheme.textDark,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                              fontSize: 13)),
                      const SizedBox(height: 4),
                      TextButton(
                        onPressed: () => ShellScope.of(context)
                            .navigate(StudentNav.findTutors),
                        child: const Text('Find a tutor to get started',
                            style: TextStyle(
                                color: AppTheme.primary,
                                fontFamily: 'Poppins',
                                fontSize: 12)),
                      ),
                    ],
                  )
                : Column(
                    children: state.matchedUsers.take(3).map((u) {
                      return _SessionRow(
                        name: u.fullName,
                        subject: u.department ?? 'Study Session',
                        icon: Icons.menu_book_rounded,
                        iconColor: AppTheme.primary,
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}

class _SessionRow extends StatelessWidget {
  final String name;
  final String subject;
  final IconData icon;
  final Color iconColor;
  const _SessionRow(
      {required this.name,
      required this.subject,
      required this.icon,
      required this.iconColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(subject,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins')),
                Text('with $name',
                    style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                        fontFamily: 'Poppins')),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded,
              color: AppTheme.textMuted, size: 18),
        ],
      ),
    );
  }
}

// ── Navigation links card ─────────────────────────────────────────────────────
class _NavLinks extends StatelessWidget {
  final int unread;
  const _NavLinks({required this.unread});

  @override
  Widget build(BuildContext context) {
    final shell = ShellScope.of(context);
    final links = [
      _NavLinkData(Icons.calendar_month_outlined, 'My Schedule',
          () => shell.navigate(StudentNav.schedule)),
      _NavLinkData(Icons.chat_bubble_outline_rounded, 'Messages',
          () => shell.navigate(StudentNav.messages),
          badge: unread > 0 ? (unread > 9 ? '9+' : '$unread') : null),
      _NavLinkData(Icons.folder_outlined, 'Resources',
          () => shell.navigate(StudentNav.resources)),
      _NavLinkData(Icons.show_chart_rounded, 'Activity', () {}),
      _NavLinkData(
          Icons.settings_outlined,
          'Settings',
          () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()))),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight),
        ),
        child: Column(
          children: [
            for (int i = 0; i < links.length; i++) ...[
              _NavLinkTile(link: links[i]),
              if (i < links.length - 1)
                const Divider(
                    height: 1,
                    indent: 56,
                    endIndent: 16,
                    color: Color(0xFFEEEEF4)),
            ],
          ],
        ),
      ),
    );
  }
}

class _NavLinkData {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? badge;
  _NavLinkData(this.icon, this.label, this.onTap, {this.badge});
}

class _NavLinkTile extends StatelessWidget {
  final _NavLinkData link;
  const _NavLinkTile({required this.link});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppTheme.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(link.icon, color: AppTheme.primary, size: 20),
      ),
      title: Text(link.label,
          style: const TextStyle(
              color: AppTheme.textDark,
              fontFamily: 'Poppins',
              fontSize: 14,
              fontWeight: FontWeight.w500)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (link.badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(link.badge!,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 6),
          ],
          const Icon(Icons.chevron_right_rounded,
              color: AppTheme.textMuted, size: 20),
        ],
      ),
      onTap: link.onTap,
    );
  }
}

// ── Light section card ────────────────────────────────────────────────────────
class _LightSection extends StatelessWidget {
  final String title;
  final Widget child;
  const _LightSection({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: AppTheme.textDark,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}

// ── Tag wrap ──────────────────────────────────────────────────────────────────
class _TagWrap extends StatelessWidget {
  final List<String> tags;
  final Color color;
  const _TagWrap(this.tags, this.color);

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: tags
          .map((t) => Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Text(t,
                    style: TextStyle(
                        color: color,
                        fontFamily: 'Poppins',
                        fontSize: 12,
                        fontWeight: FontWeight.w500)),
              ))
          .toList(),
    );
  }
}
