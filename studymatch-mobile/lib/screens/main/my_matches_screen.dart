import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/app_state.dart';
import '../../utils/app_theme.dart';
import '../../models/models.dart';
import 'user_profile_screen.dart';
import 'messages_screen.dart';

class MyMatchesScreen extends StatefulWidget {
  const MyMatchesScreen({super.key});

  @override
  State<MyMatchesScreen> createState() => _MyMatchesScreenState();
}

class _MyMatchesScreenState extends State<MyMatchesScreen> {
  int _selectedTab = 0; // 0=All, 1=New, 2=Favorites
  bool _bannerDismissed = false;
  final Set<int> _favorites = {};

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final matches = state.matchedUsers;

    final newMatches = matches.take(2).toList(); // mock "new" matches
    final displayedMatches = _selectedTab == 1
        ? newMatches
        : _selectedTab == 2
            ? matches
                .where((_, ) => false) // favorites not persisted yet — show empty
                .toList()
            : matches;

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new,
                        size: 18, color: AppTheme.textDark),
                    onPressed: () => Navigator.maybePop(context),
                  ),
                  const Expanded(
                    child: Text(
                      'My Matches',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F0F4),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.tune_rounded,
                        color: AppTheme.textDark, size: 18),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Search bar ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: const Row(
                  children: [
                    SizedBox(width: 14),
                    Icon(Icons.search, color: AppTheme.textMuted, size: 18),
                    SizedBox(width: 8),
                    Text('Search your matches...',
                        style: TextStyle(
                            color: AppTheme.textMuted,
                            fontFamily: 'Poppins',
                            fontSize: 13)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // ── Filter tabs ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _FilterChip(
                    label: 'All Matches',
                    selected: _selectedTab == 0,
                    onTap: () => setState(() => _selectedTab = 0),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'New Matches',
                    badge: matches.isNotEmpty ? '${newMatches.length}' : null,
                    selected: _selectedTab == 1,
                    onTap: () => setState(() => _selectedTab = 1),
                  ),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: 'Favorites',
                    selected: _selectedTab == 2,
                    onTap: () => setState(() => _selectedTab = 2),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Content ────────────────────────────────────────────────
            Expanded(
              child: matches.isEmpty
                  ? _EmptyState()
                  : ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        // Info banner
                        if (!_bannerDismissed && _selectedTab == 0) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color:
                                      AppTheme.primary.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary
                                        .withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.favorite_rounded,
                                      color: AppTheme.primary, size: 16),
                                ),
                                const SizedBox(width: 10),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('These are tutors who liked you back!',
                                          style: TextStyle(
                                              color: AppTheme.textDark,
                                              fontFamily: 'Poppins',
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600)),
                                      Text(
                                          'Start a conversation and schedule your first session.',
                                          style: TextStyle(
                                              color: AppTheme.textBody,
                                              fontFamily: 'Poppins',
                                              fontSize: 11)),
                                    ],
                                  ),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      setState(() => _bannerDismissed = true),
                                  style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap),
                                  child: const Text('Got it',
                                      style: TextStyle(
                                          color: AppTheme.primary,
                                          fontFamily: 'Poppins',
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],

                        if (displayedMatches.isEmpty && _selectedTab == 2)
                          _FavoritesEmpty()
                        else
                          ...displayedMatches.asMap().entries.map((e) {
                            final i = e.key;
                            final u = e.value;
                            return _MatchCard(
                              user: u,
                              isFavorite: _favorites.contains(i),
                              onFavoriteToggle: () => setState(() {
                                if (_favorites.contains(i)) {
                                  _favorites.remove(i);
                                } else {
                                  _favorites.add(i);
                                }
                              }),
                              matchedLabel: i == 0
                                  ? 'Matched 2 days ago'
                                  : 'Matched 1 week ago',
                            );
                          }),
                        const SizedBox(height: 24),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Filter chip ───────────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    this.badge,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.borderLight),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : AppTheme.textBody,
                fontFamily: 'Poppins',
                fontSize: 13,
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            if (badge != null) ...[
              const SizedBox(width: 5),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.3)
                      : AppTheme.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    color: selected ? Colors.white : Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Match card ────────────────────────────────────────────────────────────────
class _MatchCard extends StatelessWidget {
  final RealUser user;
  final bool isFavorite;
  final VoidCallback onFavoriteToggle;
  final String matchedLabel;

  const _MatchCard({
    required this.user,
    required this.isFavorite,
    required this.onFavoriteToggle,
    required this.matchedLabel,
  });

  @override
  Widget build(BuildContext context) {
    final isTutor = user.role == 'tutor';
    final isOnline = user.id.hashCode % 2 == 0;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => UserProfileScreen(user: user)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
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
                // Avatar with online indicator
                Stack(
                  children: [
                    Container(
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(user.initials,
                            style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                                fontFamily: 'Poppins')),
                      ),
                    ),
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color:
                              isOnline ? AppTheme.success : AppTheme.textMuted,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(user.fullName,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                    color: AppTheme.textDark,
                                    fontFamily: 'Poppins')),
                          ),
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle),
                            child: const Icon(Icons.check,
                                color: Colors.white, size: 9),
                          ),
                          const SizedBox(width: 6),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: isOnline
                                      ? AppTheme.success
                                      : AppTheme.textMuted,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 3),
                              Text(
                                isOnline ? 'Online' : 'Offline',
                                style: TextStyle(
                                    color: isOnline
                                        ? AppTheme.success
                                        : AppTheme.textMuted,
                                    fontFamily: 'Poppins',
                                    fontSize: 11),
                              ),
                            ],
                          ),
                        ],
                      ),
                      if (user.department != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          '${isTutor ? "Tutor" : "Student"} · ${user.department}',
                          style: const TextStyle(
                              color: AppTheme.textBody,
                              fontFamily: 'Poppins',
                              fontSize: 12),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              color: AppTheme.warning, size: 14),
                          const SizedBox(width: 2),
                          Text(
                            '${user.rating.toStringAsFixed(1)} (${user.ratingCount})',
                            style: const TextStyle(
                                color: AppTheme.textBody,
                                fontFamily: 'Poppins',
                                fontSize: 12),
                          ),
                          if (user.school != null) ...[
                            const SizedBox(width: 8),
                            const Text('·',
                                style: TextStyle(color: AppTheme.textMuted)),
                            const SizedBox(width: 8),
                            const Icon(Icons.school_outlined,
                                size: 12, color: AppTheme.textMuted),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                user.school!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontFamily: 'Poppins',
                                    fontSize: 11),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                // Action buttons
                Column(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => ChatScreen(participant: user)),
                      ),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.chat_bubble_outline_rounded,
                            color: AppTheme.primary, size: 16),
                      ),
                    ),
                    const SizedBox(height: 6),
                    GestureDetector(
                      onTap: onFavoriteToggle,
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          Icons.calendar_today_outlined,
                          color: AppTheme.primary,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            if (user.subjects.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: user.subjects
                    .take(3)
                    .map((s) => Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(s,
                              style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontFamily: 'Poppins',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500)),
                        ))
                    .toList(),
              ),
            ],

            const SizedBox(height: 8),
            Text(
              matchedLabel,
              style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Empty states ──────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.people_alt_outlined,
                  color: AppTheme.primary, size: 32),
            ),
            const SizedBox(height: 16),
            const Text('No matches yet',
                style: TextStyle(
                    color: AppTheme.textDark,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 8),
            const Text(
                'Use Find Tutors to connect\nwith study partners.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins',
                    height: 1.5)),
          ],
        ),
      ),
    );
  }
}

class _FavoritesEmpty extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: const Column(
        children: [
          Icon(Icons.star_outline_rounded, color: AppTheme.textMuted, size: 36),
          SizedBox(height: 10),
          Text('No favorites yet',
              style: TextStyle(
                  color: AppTheme.textDark,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins',
                  fontSize: 14)),
          SizedBox(height: 4),
          Text('Tap the calendar icon on a match\nto save them here.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppTheme.textMuted, fontFamily: 'Poppins', fontSize: 12)),
        ],
      ),
    );
  }
}
