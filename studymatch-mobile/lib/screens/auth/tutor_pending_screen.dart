import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';

// ─────────────────────────────────────────────────────────────────────────────
// TutorPendingScreen — shown after tutor submits application.
// Polls/checks approval status. Admin can approve or reject from AdminReviewScreen.
// ─────────────────────────────────────────────────────────────────────────────

class TutorPendingScreen extends StatefulWidget {
  const TutorPendingScreen({super.key});
  @override
  State<TutorPendingScreen> createState() => _TutorPendingScreenState();
}

class _TutorPendingScreenState extends State<TutorPendingScreen>
    with TickerProviderStateMixin {
  bool _checking = false;
  String _status = 'pending'; // 'pending' | 'approved' | 'rejected'
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _checkStatus();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _checkStatus() async {
    setState(() => _checking = true);
    // Re-fetch the profile from the API. If the admin has approved this tutor
    // the backend will return profile_completed=1, which sets onboardingComplete
    // to true in AppState. AppRouter then automatically navigates away from
    // this screen to the authenticated flow.
    await context.read<AppState>().refreshUserProfile();
    if (!mounted) return;
    setState(() => _checking = false);
  }

  Future<void> _signOut() async {
    // signOut() sets authState → unauthenticated; AppRouter handles navigation.
    await context.read<AppState>().signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(children: [
            const SizedBox(height: 32),
            _buildLogo(),
            const SizedBox(height: 40),
            _buildStatusCard(),
            const SizedBox(height: 20),
            _buildStepsCard(),
            const SizedBox(height: 20),
            _buildHelpCard(),
            const SizedBox(height: 28),
            _buildCheckButton(),
            const SizedBox(height: 12),
            _buildSignOutButton(),
            const SizedBox(height: 32),
          ]),
        ),
      ),
    );
  }

  Widget _buildLogo() => Row(mainAxisAlignment: MainAxisAlignment.center, children: [
    Container(
      width: 30, height: 30,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.accent]),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(Icons.school_rounded, color: Colors.white, size: 17)),
    const SizedBox(width: 8),
    RichText(text: const TextSpan(
      style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, fontFamily: 'Poppins'),
      children: [
        TextSpan(text: 'Study', style: TextStyle(color: Colors.white)),
        TextSpan(text: 'Match', style: TextStyle(color: AppTheme.primaryLight)),
      ])),
  ]);

  Widget _buildStatusCard() => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(28),
    decoration: BoxDecoration(
      color: const Color(0xFF1A1A2E),
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFF1F2937)),
    ),
    child: Column(children: [
      // Animated clock icon
      AnimatedBuilder(
        animation: _pulseAnim,
        builder: (_, __) => Opacity(
          opacity: _status == 'pending' ? _pulseAnim.value : 1.0,
          child: Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: _statusColor().withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(color: _statusColor().withValues(alpha: 0.4), width: 2),
            ),
            child: Icon(_statusIcon(), color: _statusColor(), size: 32)),
        )),
      const SizedBox(height: 20),
      Text(
        _statusTitle(),
        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'Poppins'),
        textAlign: TextAlign.center),
      const SizedBox(height: 10),
      Text(
        _statusSubtitle(),
        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontFamily: 'Poppins', height: 1.5),
        textAlign: TextAlign.center),
      const SizedBox(height: 20),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Account Status', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 13)),
          _StatusBadge(status: _status),
        ])),
    ]),
  );

  Widget _buildStepsCard() => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: const Color(0xFF1A1A2E),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFF1F2937)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Application Progress',
        style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 14, fontWeight: FontWeight.w600)),
      const SizedBox(height: 16),
      _ProgressStep(
        icon: Icons.person_outline,
        label: 'Account created',
        isDone: true),
      _ProgressStep(
        icon: Icons.mark_email_read_outlined,
        label: 'Email verified',
        isDone: true),
      _ProgressStep(
        icon: Icons.admin_panel_settings_outlined,
        label: 'Admin approval',
        isDone: _status == 'approved',
        isPending: _status == 'pending',
        isRejected: _status == 'rejected',
        isLast: true),
    ]),
  );

  Widget _buildHelpCard() => Container(
    width: double.infinity,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: BoxDecoration(
      color: const Color(0xFF1A1A2E),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF1F2937)),
    ),
    child: Row(children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: AppTheme.primary.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.mail_outline_rounded, color: AppTheme.primaryLight, size: 18)),
      const SizedBox(width: 12),
      const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Need help?', style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 13, fontWeight: FontWeight.w600)),
        Text('support@studymatch.app', style: TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 12)),
      ]),
    ]),
  );

  Widget _buildCheckButton() => SizedBox(
    width: double.infinity, height: 52,
    child: ElevatedButton.icon(
      onPressed: _checking ? null : _checkStatus,
      icon: _checking
          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Icon(Icons.refresh_rounded, size: 18, color: Colors.white),
      label: Text(
        _checking ? 'Checking...' : 'Check Approval Status',
        style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 15)),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.primary,
        disabledBackgroundColor: AppTheme.primary.withValues(alpha: 0.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
      )),
  );

  Widget _buildSignOutButton() => SizedBox(
    width: double.infinity, height: 50,
    child: OutlinedButton.icon(
      onPressed: _signOut,
      icon: const Icon(Icons.logout_rounded, size: 18, color: Color(0xFF9CA3AF)),
      label: const Text('Sign Out',
        style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 14)),
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: Color(0xFF374151)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      )),
  );

  Color _statusColor() {
    switch (_status) {
      case 'approved': return const Color(0xFF34D399);
      case 'rejected': return const Color(0xFFF87171);
      default: return Colors.orange;
    }
  }

  IconData _statusIcon() {
    switch (_status) {
      case 'approved': return Icons.check_circle_outline_rounded;
      case 'rejected': return Icons.cancel_outlined;
      default: return Icons.access_time_rounded;
    }
  }

  String _statusTitle() {
    switch (_status) {
      case 'approved': return 'Account Approved!';
      case 'rejected': return 'Application Rejected';
      default: return 'Pending Admin Approval';
    }
  }

  String _statusSubtitle() {
    switch (_status) {
      case 'approved': return 'Your tutor account is now active.\nYou can start accepting students.';
      case 'rejected': return 'Your application was not approved.\nPlease contact support for more details.';
      default: return 'Your tutor account is currently under review.\nAn admin will verify your credentials\nand approve your account shortly.';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminTutorReviewScreen — Admin-side screen to list and review pending tutors.
// Route: /admin/tutor-reviews
// ─────────────────────────────────────────────────────────────────────────────

class AdminTutorReviewScreen extends StatefulWidget {
  const AdminTutorReviewScreen({super.key});
  @override
  State<AdminTutorReviewScreen> createState() => _AdminTutorReviewScreenState();
}

class _AdminTutorReviewScreenState extends State<AdminTutorReviewScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  bool _loading = true;
  List<_TutorApplication> _applications = [];
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _loadApplications();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadApplications() async {
    setState(() => _loading = true);
    // TODO: Replace with real AppState call
    // final apps = await context.read<AppState>().getPendingTutors();
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    setState(() {
      _applications = _mockApplications();
      _loading = false;
    });
  }

  List<_TutorApplication> _mockApplications() => [
    _TutorApplication(
      id: '1', name: 'Dr. Maria Santos', email: 'msantos@edu.ph',
      department: 'College of Education', position: 'Associate Professor',
      experience: '5 - 10 years', education: "Master's Degree",
      subjects: ['Mathematics', 'Statistics'], submittedAt: DateTime.now().subtract(const Duration(hours: 3)),
      docsCount: 4, status: 'pending'),
    _TutorApplication(
      id: '2', name: 'Prof. Juan dela Cruz', email: 'jdelacruz@edu.ph',
      department: 'College of Engineering', position: 'Instructor II',
      experience: '3 - 5 years', education: "Bachelor's Degree",
      subjects: ['Physics', 'Engineering'], submittedAt: DateTime.now().subtract(const Duration(days: 1)),
      docsCount: 2, status: 'pending'),
    _TutorApplication(
      id: '3', name: 'Ms. Anna Reyes', email: 'areyes@edu.ph',
      department: 'College of Arts & Sciences', position: 'Instructor I',
      experience: '1 - 3 years', education: "Bachelor's Degree",
      subjects: ['English', 'Filipino'], submittedAt: DateTime.now().subtract(const Duration(days: 2)),
      docsCount: 3, status: 'approved'),
    _TutorApplication(
      id: '4', name: 'Mr. Carlos Bautista', email: 'cbautista@edu.ph',
      department: 'College of Business', position: 'Instructor III',
      experience: 'Less than 1 year', education: "Bachelor's Degree",
      subjects: ['Economics', 'Accounting'], submittedAt: DateTime.now().subtract(const Duration(days: 3)),
      docsCount: 1, status: 'rejected'),
  ];

  List<_TutorApplication> get _filtered {
    var list = _applications;
    final tab = _tabCtrl.index;
    if (tab == 1) list = list.where((a) => a.status == 'pending').toList();
    if (tab == 2) list = list.where((a) => a.status != 'pending').toList();
    if (_searchQuery.isNotEmpty) {
      list = list.where((a) =>
        a.name.toLowerCase().contains(_searchQuery) ||
        a.email.toLowerCase().contains(_searchQuery) ||
        a.department.toLowerCase().contains(_searchQuery)).toList();
    }
    return list;
  }

  Future<void> _approve(_TutorApplication app) async {
    final confirm = await _showConfirmDialog(
      'Approve Tutor',
      'Are you sure you want to approve ${app.name}? They will be able to accept students immediately.',
      confirmLabel: 'Approve',
      confirmColor: const Color(0xFF34D399),
    );
    if (confirm != true || !mounted) return;
    // TODO: await context.read<AppState>().approveTutor(app.id);
    setState(() => app.status = 'approved');
    _snack('${app.name} has been approved!');
  }

  Future<void> _reject(_TutorApplication app) async {
    final reason = await _showRejectDialog(app.name);
    if (reason == null || !mounted) return;
    // TODO: await context.read<AppState>().rejectTutor(app.id, reason: reason);
    setState(() => app.status = 'rejected');
    _snack('${app.name} has been rejected.', error: true);
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(fontFamily: 'Poppins')),
      backgroundColor: error ? const Color(0xFFF87171) : const Color(0xFF34D399),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  Future<bool?> _showConfirmDialog(String title, String body,
      {required String confirmLabel, required Color confirmColor}) {
    return showDialog<bool>(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text(body, style: const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 13, height: 1.5)),
            const SizedBox(height: 24),
            Row(children: [
              Expanded(child: OutlinedButton(
                onPressed: () => Navigator.pop(context, false),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF374151)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12)),
                child: const Text('Cancel', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins')))),
              const SizedBox(width: 12),
              Expanded(child: ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: confirmColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 12)),
                child: Text(confirmLabel, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600)))),
            ]),
          ]),
        ),
      ),
    );
  }

  Future<String?> _showRejectDialog(String name) {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Reject Application', style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 17, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Provide a reason for rejecting $name\'s application.',
              style: const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 13)),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl, maxLines: 3,
              style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 13),
              decoration: InputDecoration(
                hintText: 'e.g. Incomplete documents, insufficient credentials...',
                hintStyle: const TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 12),
                filled: true, fillColor: const Color(0xFF111827),
                contentPadding: const EdgeInsets.all(14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF374151))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF374151))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFF87171), width: 1.5)),
              )),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF374151)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12)),
                child: const Text('Cancel', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins')))),
              const SizedBox(width: 12),
              Expanded(child: ElevatedButton(
                onPressed: () => Navigator.pop(context, ctrl.text.trim().isEmpty ? 'No reason provided' : ctrl.text.trim()),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF87171),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 12)),
                child: const Text('Reject', style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600)))),
            ]),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pending = _applications.where((a) => a.status == 'pending').length;

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F1A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.pop(context)),
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Tutor Applications',
            style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.bold, fontSize: 16)),
          Text('$pending pending review',
            style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 11)),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF9CA3AF)),
            onPressed: _loadApplications),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: TabBar(
            controller: _tabCtrl,
            onTap: (_) => setState(() {}),
            indicatorColor: AppTheme.primary,
            indicatorWeight: 2,
            labelColor: AppTheme.primaryLight,
            unselectedLabelColor: const Color(0xFF6B7280),
            labelStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 12),
            tabs: [
              Tab(text: 'All (${_applications.length})'),
              Tab(text: 'Pending ($pending)'),
              const Tab(text: 'Resolved'),
            ],
          ),
        ),
      ),
      body: Column(children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (v) => setState(() => _searchQuery = v.toLowerCase()),
            style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search by name, email, department...',
              hintStyle: const TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 13),
              prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6B7280), size: 20),
              suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF6B7280), size: 18),
                    onPressed: () { _searchCtrl.clear(); setState(() => _searchQuery = ''); })
                : null,
              filled: true, fillColor: const Color(0xFF1A1A2E),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1F2937))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1F2937))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
            )),
        ),
        // List
        Expanded(child: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _filtered.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.inbox_rounded, color: Color(0xFF374151), size: 48),
                const SizedBox(height: 12),
                const Text('No applications found',
                  style: TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 14)),
              ]))
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                itemCount: _filtered.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => _TutorApplicationCard(
                  app: _filtered[i],
                  onApprove: () => _approve(_filtered[i]),
                  onReject: () => _reject(_filtered[i]),
                  onView: () => _showDetailSheet(_filtered[i]),
                ))),
      ]),
    );
  }

  void _showDetailSheet(_TutorApplication app) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1A1A2E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.4,
        builder: (_, scrollCtrl) => _TutorDetailSheet(
          app: app, scrollCtrl: scrollCtrl,
          onApprove: app.status == 'pending' ? () { Navigator.pop(context); _approve(app); } : null,
          onReject: app.status == 'pending' ? () { Navigator.pop(context); _reject(app); } : null,
        )),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Application Card
// ─────────────────────────────────────────────────────────────────────────────

class _TutorApplicationCard extends StatelessWidget {
  final _TutorApplication app;
  final VoidCallback onApprove, onReject, onView;
  const _TutorApplicationCard({
    required this.app, required this.onApprove,
    required this.onReject, required this.onView,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = app.status == 'pending';
    return GestureDetector(
      onTap: onView,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isPending ? AppTheme.primary.withValues(alpha: 0.25) : const Color(0xFF1F2937)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header row
          Row(children: [
            // Avatar
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(child: Text(
                app.name.isNotEmpty ? app.name[0].toUpperCase() : '?',
                style: const TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontWeight: FontWeight.bold, fontSize: 18)))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(app.name, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 14)),
              Text(app.email, style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 12)),
            ])),
            _StatusBadge(status: app.status),
          ]),
          const SizedBox(height: 12),
          // Info chips
          Wrap(spacing: 8, runSpacing: 6, children: [
            _InfoChip(icon: Icons.school_outlined, label: app.department),
            _InfoChip(icon: Icons.work_outline_rounded, label: app.position),
            _InfoChip(icon: Icons.folder_outlined, label: '${app.docsCount} docs'),
          ]),
          const SizedBox(height: 10),
          // Subjects
          Wrap(spacing: 6, runSpacing: 6, children: app.subjects.map((s) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF374151)),
            ),
            child: Text(s, style: const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 11)))).toList()),
          if (isPending) ...[
            const SizedBox(height: 14),
            const Divider(color: Color(0xFF1F2937), height: 1),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: _ActionButton(
                label: 'Reject', icon: Icons.close_rounded,
                color: const Color(0xFFF87171), onTap: onReject)),
              const SizedBox(width: 10),
              Expanded(child: _ActionButton(
                label: 'Approve', icon: Icons.check_rounded,
                color: const Color(0xFF34D399), onTap: onApprove, filled: true)),
            ]),
          ],
          const SizedBox(height: 4),
          Text(
            'Submitted ${_timeAgo(app.submittedAt)} • Tap to view details',
            style: const TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 10)),
        ]),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tutor Detail Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────

class _TutorDetailSheet extends StatelessWidget {
  final _TutorApplication app;
  final ScrollController scrollCtrl;
  final VoidCallback? onApprove, onReject;
  const _TutorDetailSheet({
    required this.app, required this.scrollCtrl,
    required this.onApprove, required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      // Handle
      Center(child: Container(
        margin: const EdgeInsets.only(top: 12, bottom: 8),
        width: 36, height: 4,
        decoration: BoxDecoration(color: const Color(0xFF374151), borderRadius: BorderRadius.circular(2)))),
      Expanded(child: ListView(
        controller: scrollCtrl,
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        children: [
          // Avatar + Name
          Row(children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.15), shape: BoxShape.circle),
              child: Center(child: Text(app.name[0],
                style: const TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontWeight: FontWeight.bold, fontSize: 22)))),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(app.name, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.bold, fontSize: 16)),
              Text(app.email, style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 12)),
            ])),
            _StatusBadge(status: app.status),
          ]),
          const SizedBox(height: 20),
          _DetailSection(title: 'Academic Information', children: [
            _DetailRow('Department', app.department),
            _DetailRow('Position', app.position),
            _DetailRow('Experience', app.experience),
            _DetailRow('Education', app.education),
          ]),
          const SizedBox(height: 14),
          _DetailSection(title: 'Subjects', children: [
            Wrap(spacing: 8, runSpacing: 6, children: app.subjects.map((s) =>
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: Text(s, style: const TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontSize: 12)))
            ).toList()),
          ]),
          const SizedBox(height: 14),
          _DetailSection(title: 'Uploaded Documents', children: [
            _DetailRow('Documents', '${app.docsCount} file(s) uploaded'),
            // In production: list each doc with a view/download button
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF111827), borderRadius: BorderRadius.circular(10)),
              child: Row(children: [
                const Icon(Icons.info_outline, color: Color(0xFF6B7280), size: 16),
                const SizedBox(width: 8),
                const Expanded(child: Text(
                  'Integrate with AppState to display and download individual documents.',
                  style: TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 11))),
              ])),
          ]),
          if (onApprove != null || onReject != null) ...[
            const SizedBox(height: 24),
            if (onReject != null)
              SizedBox(width: double.infinity, height: 50,
                child: OutlinedButton.icon(
                  onPressed: onReject,
                  icon: const Icon(Icons.close_rounded, color: Color(0xFFF87171), size: 18),
                  label: const Text('Reject Application',
                    style: TextStyle(color: Color(0xFFF87171), fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFF87171)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))))),
            const SizedBox(height: 10),
            if (onApprove != null)
              SizedBox(width: double.infinity, height: 50,
                child: ElevatedButton.icon(
                  onPressed: onApprove,
                  icon: const Icon(Icons.check_rounded, color: Colors.white, size: 18),
                  label: const Text('Approve Application',
                    style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF34D399),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0))),
          ],
          const SizedBox(height: 12),
        ],
      )),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final Color color;
    final String label;
    switch (status) {
      case 'approved': color = const Color(0xFF34D399); label = 'Approved'; break;
      case 'rejected': color = const Color(0xFFF87171); label = 'Rejected'; break;
      default:         color = Colors.orange;            label = 'Pending';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(label,
        style: TextStyle(color: color, fontFamily: 'Poppins', fontSize: 11, fontWeight: FontWeight.w600)));
  }
}

class _ProgressStep extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDone;
  final bool isPending;
  final bool isRejected;
  final bool isLast;
  const _ProgressStep({
    required this.icon, required this.label,
    this.isDone = false, this.isPending = false,
    this.isRejected = false, this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final Color iconColor = isRejected
        ? const Color(0xFFF87171)
        : isDone ? const Color(0xFF34D399) : Colors.orange;
    final Color lineColor = isDone ? const Color(0xFF34D399) : const Color(0xFF1F2937);
    final IconData displayIcon = isRejected
        ? Icons.cancel_outlined
        : isDone ? Icons.check_circle_outline_rounded
        : isPending ? Icons.radio_button_unchecked_rounded : icon;

    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Column(children: [
        Icon(displayIcon, color: iconColor, size: 20),
        if (!isLast) Container(width: 2, height: 24, color: lineColor),
      ]),
      const SizedBox(width: 12),
      Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Text(label, style: TextStyle(
          color: isDone || isPending || isRejected ? Colors.white : const Color(0xFF6B7280),
          fontFamily: 'Poppins', fontSize: 13,
          fontWeight: isDone || isPending ? FontWeight.w500 : FontWeight.normal))),
    ]);
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon; final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: const Color(0xFF111827),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: const Color(0xFF1F2937)),
    ),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, color: const Color(0xFF6B7280), size: 12),
      const SizedBox(width: 5),
      Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 11)),
    ]));
}

class _ActionButton extends StatelessWidget {
  final String label; final IconData icon; final Color color;
  final VoidCallback onTap; final bool filled;
  const _ActionButton({required this.label, required this.icon, required this.color, required this.onTap, this.filled = false});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: filled ? color.withValues(alpha: 0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: filled ? 0.4 : 0.5)),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 15),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(color: color, fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w600)),
      ])));
}

class _DetailSection extends StatelessWidget {
  final String title; final List<Widget> children;
  const _DetailSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFF111827),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF1F2937)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 13)),
      const SizedBox(height: 12),
      ...children,
    ]));
}

class _DetailRow extends StatelessWidget {
  final String key_, value;
  const _DetailRow(this.key_, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 110, child: Text(key_,
        style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 12))),
      Expanded(child: Text(value,
        style: const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 12))),
    ]));
}

// ─────────────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────────────

class _TutorApplication {
  final String id, name, email, department, position, experience, education;
  final List<String> subjects;
  final DateTime submittedAt;
  final int docsCount;
  String status;

  _TutorApplication({
    required this.id, required this.name, required this.email,
    required this.department, required this.position,
    required this.experience, required this.education,
    required this.subjects, required this.submittedAt,
    required this.docsCount, required this.status,
  });
}