import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../services/api_service.dart';
import 'edit_profile_screen.dart';
import 'help_center_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final user = state.currentUser;
    final unread = state.unreadMessageCount;

    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 0),
              child: Row(
                children: [
                  if (Navigator.canPop(context))
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new,
                          size: 18, color: AppTheme.textDark),
                      onPressed: () => Navigator.pop(context),
                    )
                  else
                    const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Settings',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F0F4),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.settings_outlined,
                        color: AppTheme.textDark, size: 20),
                  ),
                  const SizedBox(width: 8),
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F0F4),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.notifications_outlined,
                            color: AppTheme.textDark, size: 20),
                      ),
                      if (unread > 0)
                        Positioned(
                          right: 6,
                          top: 6,
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

            const SizedBox(height: 16),

            // ── Settings list ─────────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _SettingsSection(
                    title: 'Account',
                    children: [
                      _SettingsTile(
                        icon: Icons.person_outline_rounded,
                        label: 'Edit Profile',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const EditProfileScreen()),
                        ),
                      ),
                      _SettingsTile(
                        icon: Icons.lock_outline_rounded,
                        label: 'Change Password',
                        onTap: () => _showChangePasswordSheet(context),
                      ),
                      _SettingsTile(
                        icon: Icons.email_outlined,
                        label: 'Email',
                        subtitle: user?.email ?? '',
                        onTap: () => _showEmailInfo(context, user?.email),
                      ),
                      _SettingsTile(
                        icon: Icons.delete_outline_rounded,
                        label: 'Delete Account',
                        subtitle: 'Permanently remove your StudyMatch account',
                        onTap: () => _confirmDeleteAccount(context, state),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  _SettingsSection(
                    title: 'Preferences',
                    children: [
                      _SettingsTile(
                        icon: Icons.notifications_outlined,
                        label: 'Notifications',
                        onTap: () => _showNotificationsSheet(context),
                      ),
                      _SettingsTile(
                        icon: Icons.dark_mode_outlined,
                        label: 'Dark Mode',
                        subtitle: 'Coming soon',
                        onTap: () => _showComingSoon(context, 'Dark Mode'),
                      ),
                      _SettingsTile(
                        icon: Icons.shield_outlined,
                        label: 'Privacy',
                        onTap: () => _showPrivacySheet(context),
                      ),
                      _SettingsTile(
                        icon: Icons.palette_outlined,
                        label: 'Appearance',
                        onTap: () => _showAppearanceSheet(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  _SettingsSection(
                    title: 'Support',
                    children: [
                      _SettingsTile(
                        icon: Icons.help_outline_rounded,
                        label: 'Help & Support',
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const HelpCenterScreen())),
                      ),
                      _SettingsTile(
                        icon: Icons.chat_bubble_outline_rounded,
                        label: 'Send Feedback',
                        onTap: () => _showFeedbackSheet(context),
                      ),
                      _SettingsTile(
                        icon: Icons.info_outline_rounded,
                        label: 'About StudyMatch',
                        onTap: () => _showAboutDialog(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Log Out
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 4),
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppTheme.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.logout_rounded,
                            color: AppTheme.error, size: 20),
                      ),
                      title: const Text(
                        'Log Out',
                        style: TextStyle(
                          color: AppTheme.error,
                          fontFamily: 'Poppins',
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      onTap: () =>
                          _confirmSignOut(context, context.read<AppState>()),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Change Password ───────────────────────────────────────────────────────
  void _showChangePasswordSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _ChangePasswordSheet(),
    );
  }

  // ── Email info ────────────────────────────────────────────────────────────
  void _showEmailInfo(BuildContext context, String? email) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.surfaceLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Registered Email',
            style: TextStyle(
                color: Color(0xFF1A1A2E),
                fontFamily: 'Poppins',
                fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(10),
                border:
                    Border.all(color: AppTheme.primary.withValues(alpha: 0.15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.email_outlined,
                      color: AppTheme.primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      email ?? '—',
                      style: const TextStyle(
                          color: Color(0xFF1A1A2E),
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your email address is used for sign-in and notifications. To change it, please contact support.',
              style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  height: 1.5),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Got it',
                style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
          ),
        ],
      ),
    );
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  void _showNotificationsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _NotificationsSheet(),
    );
  }

  // ── Coming Soon snackbar ──────────────────────────────────────────────────
  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('$feature is coming soon!',
          style: const TextStyle(fontFamily: 'Poppins')),
      backgroundColor: AppTheme.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  // ── Privacy ───────────────────────────────────────────────────────────────
  void _showPrivacySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _PrivacySheet(),
    );
  }

  // ── Appearance ────────────────────────────────────────────────────────────
  void _showAppearanceSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _AppearanceSheet(),
    );
  }

  // ── Delete Account ────────────────────────────────────────────────────────
  void _showDeleteAccountDialog(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _DeleteAccountSheet(appState: state),
    );
  }

  // ── Feedback ──────────────────────────────────────────────────────────────
  void _showFeedbackSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _FeedbackSheet(),
    );
  }

  // ── About ─────────────────────────────────────────────────────────────────
  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.accent]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.school_rounded,
                  color: Colors.white, size: 38),
            ),
            const SizedBox(height: 16),
            const Text('StudyMatch',
                style: TextStyle(
                    color: Color(0xFF1A1A2E),
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 4),
            const Text('Version 1.0.0',
                style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontFamily: 'Poppins',
                    fontSize: 13)),
            const SizedBox(height: 16),
            const Text(
              'Connect with students who match your learning style, schedule, and goals.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontFamily: 'Poppins',
                  fontSize: 13,
                  height: 1.5),
            ),
            const SizedBox(height: 12),
            const Divider(color: Color(0xFFE8E8EF)),
            const SizedBox(height: 8),
            const Text('Made with ❤️ for students',
                style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontFamily: 'Poppins',
                    fontSize: 12)),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Close',
                  style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
            ),
          ),
        ],
      ),
    );
  }

  // ── Delete Account confirm ───────────────────────────────────────────────
  void _confirmDeleteAccount(BuildContext context, AppState state) {
    _showDeleteAccountDialog(context, state);
  }

  // ── Sign Out confirm ──────────────────────────────────────────────────────
  void _confirmSignOut(BuildContext context, AppState state) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Sign Out',
            style: TextStyle(
                color: AppTheme.textDark,
                fontFamily: 'Poppins',
                fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to sign out?',
            style: TextStyle(color: AppTheme.textBody, fontFamily: 'Poppins')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel',
                style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).popUntil((route) => route.isFirst);
              state.signOut();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: const Text('Sign Out',
                style: TextStyle(color: Colors.white, fontFamily: 'Poppins')),
          ),
        ],
      ),
    );
  }
}

// ── Section wrapper ───────────────────────────────────────────────────────────
class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SettingsSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textDark,
                  fontFamily: 'Poppins')),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Column(
            children: [
              for (int i = 0; i < children.length; i++) ...[
                children[i],
                if (i < children.length - 1)
                  const Divider(
                      height: 1,
                      indent: 56,
                      endIndent: 16,
                      color: Color(0xFFEEEEF4)),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ── Tappable row ──────────────────────────────────────────────────────────────
class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final bool danger;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.subtitle,
    required this.onTap,
    this.danger = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = danger ? AppTheme.error : AppTheme.primary;
    final textColor = danger ? AppTheme.error : AppTheme.textDark;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(label,
          style: TextStyle(
              color: textColor,
              fontFamily: 'Poppins',
              fontSize: 14,
              fontWeight: FontWeight.w500)),
      subtitle: subtitle != null
          ? Text(subtitle!,
              style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  fontSize: 12))
          : null,
      trailing: Icon(Icons.chevron_right_rounded,
          color: danger
              ? AppTheme.error.withValues(alpha: 0.5)
              : AppTheme.textMuted,
          size: 20),
      onTap: onTap,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Sheets
// ─────────────────────────────────────────────────────────────────────────────

// ── Change Password ───────────────────────────────────────────────────────────
class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();
  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final current = _currentCtrl.text.trim();
    final newPass = _newCtrl.text;
    final confirm = _confirmCtrl.text;

    if (current.isEmpty || newPass.isEmpty || confirm.isEmpty) {
      setState(() => _error = 'All fields are required.');
      return;
    }
    if (newPass.length < 8) {
      setState(() => _error = 'New password must be at least 8 characters.');
      return;
    }
    if (newPass != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    final err = await context.read<AppState>().changePassword(
          currentPassword: current,
          newPassword: newPass,
        );
    if (!mounted) return;
    setState(() => _saving = false);

    if (err != null) {
      setState(() => _error = err);
    } else {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Password updated successfully!',
            style: TextStyle(fontFamily: 'Poppins')),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sheetHandle(),
          const SizedBox(height: 8),
          const Text('Change Password',
              style: TextStyle(
                  color: Color(0xFF1A1A2E),
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 4),
          const Text('Enter your current password and choose a new one.',
              style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontFamily: 'Poppins',
                  fontSize: 13)),
          const SizedBox(height: 20),
          if (_error != null) ...[
            _errorBanner(_error!),
            const SizedBox(height: 12),
          ],
          _pwField('Current Password', _currentCtrl, _obscureCurrent,
              () => setState(() => _obscureCurrent = !_obscureCurrent)),
          const SizedBox(height: 12),
          _pwField('New Password', _newCtrl, _obscureNew,
              () => setState(() => _obscureNew = !_obscureNew)),
          const SizedBox(height: 12),
          _pwField('Confirm New Password', _confirmCtrl, _obscureConfirm,
              () => setState(() => _obscureConfirm = !_obscureConfirm)),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                disabledBackgroundColor:
                    AppTheme.primary.withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text('Update Password',
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pwField(String label, TextEditingController ctrl, bool obscure,
      VoidCallback toggle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Color(0xFF374151),
                fontSize: 13,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins')),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          obscureText: obscure,
          style:
              const TextStyle(color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF5F5F8),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            suffixIcon: IconButton(
              icon: Icon(obscure ? Icons.visibility_off : Icons.visibility,
                  color: const Color(0xFF9CA3AF), size: 20),
              onPressed: toggle,
            ),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: AppTheme.primary, width: 1.5)),
          ),
        ),
      ],
    );
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────
class _NotificationsSheet extends StatefulWidget {
  const _NotificationsSheet();
  @override
  State<_NotificationsSheet> createState() => _NotificationsSheetState();
}

class _NotificationsSheetState extends State<_NotificationsSheet> {
  bool _matchNotifs = true;
  bool _messageNotifs = true;
  bool _sessionNotifs = true;
  bool _emailNotifs = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sheetHandle(),
          const SizedBox(height: 8),
          const Text('Notifications',
              style: TextStyle(
                  color: Color(0xFF1A1A2E),
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 4),
          const Text('Choose which notifications you receive.',
              style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontFamily: 'Poppins',
                  fontSize: 13)),
          const SizedBox(height: 20),
          _notifToggle('New Matches', 'When someone likes your profile back',
              _matchNotifs, (v) => setState(() => _matchNotifs = v)),
          const Divider(color: Color(0xFFE8E8EF)),
          _notifToggle('Messages', 'When you receive a new message',
              _messageNotifs, (v) => setState(() => _messageNotifs = v)),
          const Divider(color: Color(0xFFE8E8EF)),
          _notifToggle('Study Sessions', 'Reminders for upcoming sessions',
              _sessionNotifs, (v) => setState(() => _sessionNotifs = v)),
          const Divider(color: Color(0xFFE8E8EF)),
          _notifToggle('Email Notifications', 'Receive updates via email',
              _emailNotifs, (v) => setState(() => _emailNotifs = v)),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                  content: Text('Notification preferences saved.',
                      style: TextStyle(fontFamily: 'Poppins')),
                  backgroundColor: AppTheme.success,
                  behavior: SnackBarBehavior.floating,
                ));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Save Preferences',
                  style: TextStyle(
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w600,
                      color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _notifToggle(
      String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title,
          style: const TextStyle(
              color: Color(0xFF1A1A2E),
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w500,
              fontSize: 14)),
      subtitle: Text(subtitle,
          style: const TextStyle(
              color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 12)),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeThumbColor: AppTheme.primary,
        activeTrackColor: AppTheme.primaryLight,
      ),
    );
  }
}

// ── Privacy ───────────────────────────────────────────────────────────────────
class _PrivacySheet extends StatelessWidget {
  const _PrivacySheet();

  @override
  Widget build(BuildContext context) {
    const items = [
      (
        'Profile Visibility',
        'Your profile is visible to potential study partners based on subject compatibility.'
      ),
      (
        'Data Usage',
        'Your academic preferences and availability are used solely for matching purposes.'
      ),
      (
        'Message Privacy',
        'Messages are only visible to you and the person you are chatting with.'
      ),
      (
        'Account Deletion',
        'You may request full account deletion by contacting our support team.'
      ),
    ];

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (_, ctrl) => SingleChildScrollView(
        controller: ctrl,
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _sheetHandle(),
            const SizedBox(height: 8),
            const Text('Privacy Settings',
                style: TextStyle(
                    color: Color(0xFF1A1A2E),
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 4),
            const Text('How StudyMatch handles your data.',
                style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontFamily: 'Poppins',
                    fontSize: 13)),
            const SizedBox(height: 20),
            for (final item in items) ...[
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F8FA),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE8E8EF)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.$1,
                        style: const TextStyle(
                            color: Color(0xFF1A1A2E),
                            fontFamily: 'Poppins',
                            fontWeight: FontWeight.w600,
                            fontSize: 14)),
                    const SizedBox(height: 6),
                    Text(item.$2,
                        style: const TextStyle(
                            color: Color(0xFF6B7280),
                            fontFamily: 'Poppins',
                            fontSize: 13,
                            height: 1.5)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Appearance ────────────────────────────────────────────────────────────────
class _AppearanceSheet extends StatefulWidget {
  const _AppearanceSheet();

  @override
  State<_AppearanceSheet> createState() => _AppearanceSheetState();
}

class _AppearanceSheetState extends State<_AppearanceSheet> {
  static const _options = [
    (
      ThemeMode.light,
      Icons.wb_sunny_outlined,
      'Light Mode',
      'Classic bright interface'
    ),
    (
      ThemeMode.dark,
      Icons.dark_mode_outlined,
      'Dark Mode',
      'Easy on the eyes at night'
    ),
    (
      ThemeMode.system,
      Icons.phone_android_outlined,
      'System Default',
      'Follows your device setting'
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final currentMode = context.watch<AppState>().themeMode;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sheetHandle(),
          const SizedBox(height: 8),
          const Text('Appearance',
              style: TextStyle(
                  color: AppTheme.textDark,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 4),
          const Text('Choose how StudyMatch looks on your device.',
              style: TextStyle(
                  color: AppTheme.textMuted,
                  fontFamily: 'Poppins',
                  fontSize: 13)),
          const SizedBox(height: 20),
          for (final opt in _options) ...[
            _AppearanceOption(
              icon: opt.$2,
              label: opt.$3,
              subtitle: opt.$4,
              selected: currentMode == opt.$1,
              onTap: () => context.read<AppState>().setThemeMode(opt.$1),
            ),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _AppearanceOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _AppearanceOption({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primary.withValues(alpha: 0.06)
              : const Color(0xFFF8F8FA),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected ? AppTheme.primary : const Color(0xFFE8E8EF)),
        ),
        child: Row(
          children: [
            Icon(icon,
                color: selected ? AppTheme.primary : const Color(0xFF9CA3AF),
                size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          color: selected
                              ? AppTheme.primary
                              : const Color(0xFF1A1A2E),
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w500,
                          fontSize: 14)),
                  Text(subtitle,
                      style: const TextStyle(
                          color: Color(0xFF9CA3AF),
                          fontFamily: 'Poppins',
                          fontSize: 12)),
                ],
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle_rounded,
                  color: AppTheme.primary, size: 20),
          ],
        ),
      ),
    );
  }
}

// ── Feedback ──────────────────────────────────────────────────────────────────
class _FeedbackSheet extends StatefulWidget {
  const _FeedbackSheet();
  @override
  State<_FeedbackSheet> createState() => _FeedbackSheetState();
}

class _FeedbackSheetState extends State<_FeedbackSheet> {
  final _ctrl = TextEditingController();
  String _category = 'General';
  bool _sent = false;
  bool _sending = false;

  static const _categories = [
    'General',
    'Bug Report',
    'Feature Request',
    'Matching',
    'Messaging'
  ];

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sheetHandle(),
          const SizedBox(height: 8),
          const Text('Send Feedback',
              style: TextStyle(
                  color: Color(0xFF1A1A2E),
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins')),
          const SizedBox(height: 4),
          const Text('Help us improve StudyMatch.',
              style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontFamily: 'Poppins',
                  fontSize: 13)),
          const SizedBox(height: 20),
          if (_sent) ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border:
                    Border.all(color: AppTheme.success.withValues(alpha: 0.25)),
              ),
              child: const Column(
                children: [
                  Icon(Icons.check_circle_outline,
                      color: AppTheme.success, size: 40),
                  SizedBox(height: 10),
                  Text('Thank you for your feedback!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: AppTheme.success,
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          fontSize: 15)),
                  SizedBox(height: 6),
                  Text('Your input helps us make StudyMatch better.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: AppTheme.success,
                          fontFamily: 'Poppins',
                          fontSize: 13)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Close',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
              ),
            ),
          ] else ...[
            const Text('Category',
                style: TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 6),
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final sel = _category == _categories[i];
                  return GestureDetector(
                    onTap: () => setState(() => _category = _categories[i]),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: sel ? AppTheme.primary : const Color(0xFFF8F8FA),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: sel
                                ? AppTheme.primary
                                : const Color(0xFFE8E8EF)),
                      ),
                      child: Text(_categories[i],
                          style: TextStyle(
                              color:
                                  sel ? Colors.white : const Color(0xFF6B7280),
                              fontFamily: 'Poppins',
                              fontSize: 12,
                              fontWeight:
                                  sel ? FontWeight.w600 : FontWeight.normal)),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 14),
            const Text('Your Feedback',
                style: TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    fontFamily: 'Poppins')),
            const SizedBox(height: 6),
            TextField(
              controller: _ctrl,
              maxLines: 4,
              style: const TextStyle(
                  color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
              decoration: InputDecoration(
                hintText: 'Tell us what you think...',
                hintStyle: const TextStyle(
                    color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
                filled: true,
                fillColor: const Color(0xFFF5F5F8),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide:
                        const BorderSide(color: AppTheme.primary, width: 1.5)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_ctrl.text.trim().isEmpty || _sending)
                    ? null
                    : () async {
                        setState(() => _sending = true);
                        final res = await ApiService.submitFeedback(
                          category: _category,
                          message: _ctrl.text.trim(),
                        );
                        if (!mounted) return;
                        setState(() {
                          _sending = false;
                          _sent = res['success'] == true;
                        });
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  disabledBackgroundColor:
                      AppTheme.primary.withValues(alpha: 0.4),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Submit Feedback',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

Widget _sheetHandle() => Center(
      child: Container(
        width: 40,
        height: 4,
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
            color: const Color(0xFFE8E8EF),
            borderRadius: BorderRadius.circular(2)),
      ),
    );

Widget _errorBanner(String message) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.error.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppTheme.error, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message,
                style: const TextStyle(
                    color: AppTheme.error,
                    fontFamily: 'Poppins',
                    fontSize: 12)),
          ),
        ],
      ),
    );

// ── Delete Account Sheet ──────────────────────────────────────────────────────
class _DeleteAccountSheet extends StatefulWidget {
  final AppState appState;
  const _DeleteAccountSheet({required this.appState});

  @override
  State<_DeleteAccountSheet> createState() => _DeleteAccountSheetState();
}

class _DeleteAccountSheetState extends State<_DeleteAccountSheet> {
  final _pwCtrl = TextEditingController();
  bool _obscure = true;
  bool _deleting = false;
  String? _error;

  @override
  void dispose() {
    _pwCtrl.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    final pw = _pwCtrl.text.trim();
    if (pw.isEmpty) {
      setState(() => _error = 'Please enter your password.');
      return;
    }
    setState(() {
      _deleting = true;
      _error = null;
    });
    final res = await ApiService.deleteAccount(pw);
    if (!mounted) return;
    if (res['success'] == true) {
      Navigator.of(context).pop();
      widget.appState.signOut();
    } else {
      setState(() {
        _error = res['message'] as String? ?? 'Incorrect password.';
        _deleting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sheetHandle(),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.delete_outline_rounded,
                    color: AppTheme.error, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text('Delete Account',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins')),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.error.withValues(alpha: 0.2)),
            ),
            child: const Text(
              'This action is permanent and cannot be undone. All your data including sessions, messages, and matches will be deleted.',
              style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.error,
                  fontFamily: 'Poppins',
                  height: 1.5),
            ),
          ),
          const SizedBox(height: 20),
          if (_error != null) ...[
            _errorBanner(_error!),
            const SizedBox(height: 12),
          ],
          const Text('Confirm your password',
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF374151),
                  fontFamily: 'Poppins')),
          const SizedBox(height: 8),
          TextField(
            controller: _pwCtrl,
            obscureText: _obscure,
            style: const TextStyle(
                color: AppTheme.textDark, fontFamily: 'Poppins'),
            decoration: InputDecoration(
              hintText: 'Enter your password',
              hintStyle: const TextStyle(
                  color: AppTheme.textMuted, fontFamily: 'Poppins'),
              filled: true,
              fillColor: const Color(0xFFF5F5F8),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              suffixIcon: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility,
                    color: AppTheme.textMuted, size: 20),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: AppTheme.error, width: 1.5)),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.borderLight),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Cancel',
                      style: TextStyle(
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textBody)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _deleting ? null : _delete,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error,
                    disabledBackgroundColor:
                        AppTheme.error.withValues(alpha: 0.5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _deleting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Delete Account',
                          style: TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                              color: Colors.white)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
