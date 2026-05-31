import 'package:flutter/material.dart';
import '../../utils/app_theme.dart';
import '../../services/api_service.dart';

class ComplaintsScreen extends StatefulWidget {
  const ComplaintsScreen({super.key});

  @override
  State<ComplaintsScreen> createState() => _ComplaintsScreenState();
}

class _ComplaintsScreenState extends State<ComplaintsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<Map<String, dynamic>> _complaints = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final list = await ApiService.getMyComplaints();
    if (mounted)
      setState(() {
        _complaints = list;
        _loading = false;
      });
  }

  void _openSubmit() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _SubmitComplaintSheet(onSubmitted: _load),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 12, 16, 0),
              child: Row(
                children: [
                  if (Navigator.canPop(context))
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new,
                          size: 18, color: AppTheme.textDark),
                      onPressed: () => Navigator.pop(context),
                    ),
                  const Expanded(
                    child: Text('Complaints',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                            fontFamily: 'Poppins')),
                  ),
                  FilledButton.icon(
                    onPressed: _openSubmit,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Report',
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 13)),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F0F6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: TabBar(
                controller: _tabs,
                indicator: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 4)
                  ],
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: AppTheme.primary,
                unselectedLabelColor: AppTheme.textMuted,
                labelStyle: const TextStyle(
                    fontFamily: 'Poppins',
                    fontWeight: FontWeight.w600,
                    fontSize: 13),
                unselectedLabelStyle:
                    const TextStyle(fontFamily: 'Poppins', fontSize: 13),
                tabs: const [Tab(text: 'My Reports')],
              ),
            ),

            const SizedBox(height: 12),

            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  // My Reports
                  _loading
                      ? const Center(child: CircularProgressIndicator())
                      : _complaints.isEmpty
                          ? _empty('No complaints filed yet.',
                              'Use the Submit Report tab to report an issue.')
                          : RefreshIndicator(
                              onRefresh: _load,
                              child: ListView.builder(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: _complaints.length,
                                itemBuilder: (_, i) =>
                                    _ComplaintCard(data: _complaints[i]),
                              ),
                            ),

                  // Inline submit form
                  SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _InlineSubmitForm(onSubmitted: () {
                      _load();
                      _tabs.animateTo(0);
                    }),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _empty(String title, String sub) => Center(
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
                child: const Icon(Icons.flag_outlined,
                    color: AppTheme.primary, size: 32),
              ),
              const SizedBox(height: 16),
              Text(title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins')),
              const SizedBox(height: 6),
              Text(sub,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.textMuted,
                      fontFamily: 'Poppins')),
            ],
          ),
        ),
      );
}

// ── Complaint card ─────────────────────────────────────────────────────────────

class _ComplaintCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _ComplaintCard({required this.data});

  static const _statusColors = {
    'open': Color(0xFF3B82F6),
    'reviewing': Color(0xFFF59E0B),
    'resolved': Color(0xFF10B981),
    'dismissed': Color(0xFF9CA3AF),
  };

  static const _priorityColors = {
    'low': Color(0xFF10B981),
    'medium': Color(0xFFF59E0B),
    'high': Color(0xFFEF4444),
  };

  @override
  Widget build(BuildContext context) {
    final status = data['status'] as String? ?? 'open';
    final priority = data['priority'] as String? ?? 'medium';
    final statusColor = _statusColors[status] ?? const Color(0xFF9CA3AF);
    final priorityColor = _priorityColors[priority] ?? const Color(0xFFF59E0B);
    final date = data['created_at'] as String? ?? '';

    // Reported user name (nested object from backend eager-load)
    final reportedUser = data['reported_user'] as Map<String, dynamic>?;
    final reportedName = reportedUser?['name'] as String?;

    // Resolution notes shown only when a final status is set
    final notes = data['resolution_notes'] as String?;
    final showNotes = notes != null &&
        notes.trim().isNotEmpty &&
        (status == 'resolved' || status == 'dismissed');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Subject + badges row ─────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(data['subject'] as String? ?? '—',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppTheme.textDark,
                        fontFamily: 'Poppins')),
              ),
              const SizedBox(width: 8),
              // Priority badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: priorityColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(priority.toUpperCase(),
                    style: TextStyle(
                        color: priorityColor,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins')),
              ),
              const SizedBox(width: 6),
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(status.toUpperCase(),
                    style: TextStyle(
                        color: statusColor,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Poppins')),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // ── Description ──────────────────────────────────────────────────
          Text(data['description'] as String? ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textBody,
                  fontFamily: 'Poppins',
                  height: 1.4)),

          // ── Reported user ────────────────────────────────────────────────
          if (reportedName != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.person_outline_rounded,
                    size: 12, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Text('Reported: $reportedName',
                    style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                        fontFamily: 'Poppins')),
              ],
            ),
          ],

          // ── Resolution notes ─────────────────────────────────────────────
          if (showNotes) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: statusColor.withValues(alpha: 0.2)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.admin_panel_settings_outlined,
                      size: 13, color: statusColor),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(notes,
                        style: TextStyle(
                            fontSize: 12,
                            color: statusColor,
                            fontFamily: 'Poppins',
                            height: 1.4)),
                  ),
                ],
              ),
            ),
          ],

          // ── Date ─────────────────────────────────────────────────────────
          if (date.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(_fmtDate(date),
                style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                    fontFamily: 'Poppins')),
          ],
        ],
      ),
    );
  }

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}

// ── Inline submit form ─────────────────────────────────────────────────────────

class _InlineSubmitForm extends StatefulWidget {
  final VoidCallback onSubmitted;
  const _InlineSubmitForm({required this.onSubmitted});

  @override
  State<_InlineSubmitForm> createState() => _InlineSubmitFormState();
}

class _InlineSubmitFormState extends State<_InlineSubmitForm> {
  final _subjectCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _priority = 'medium';
  bool _submitting = false;
  bool _done = false;
  String? _error;

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final subject = _subjectCtrl.text.trim();
    final desc = _descCtrl.text.trim();
    if (subject.isEmpty || desc.isEmpty) {
      setState(() => _error = 'Subject and description are required.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    final res = await ApiService.submitComplaint(
      subject: subject,
      description: desc,
      priority: _priority,
    );
    if (!mounted) return;
    if (res['success'] == true) {
      setState(() {
        _done = true;
        _submitting = false;
      });
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        setState(() => _done = false);
        _reset();
        widget.onSubmitted();
      }
    } else {
      setState(() {
        _error = res['message'] as String? ?? 'Failed to submit complaint.';
        _submitting = false;
      });
    }
  }

  void _reset() {
    _subjectCtrl.clear();
    _descCtrl.clear();
    setState(() {
      _priority = 'medium';
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_done) {
      return Container(
        margin: const EdgeInsets.only(top: 40),
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppTheme.success.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.success.withValues(alpha: 0.2)),
        ),
        child: const Column(
          children: [
            Icon(Icons.check_circle_outline, color: AppTheme.success, size: 48),
            SizedBox(height: 12),
            Text('Report Submitted',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.success,
                    fontFamily: 'Poppins')),
            SizedBox(height: 6),
            Text('Our team will review your report and take action.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.success,
                    fontFamily: 'Poppins')),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 4),
        if (_error != null) ...[
          _errBanner(_error!),
          const SizedBox(height: 12),
        ],
        _label('Subject *'),
        const SizedBox(height: 6),
        _field(_subjectCtrl, 'Brief title of your complaint', maxLines: 1),
        const SizedBox(height: 14),
        _label('Description *'),
        const SizedBox(height: 6),
        _field(_descCtrl, 'Describe the issue in detail...', maxLines: 5),
        const SizedBox(height: 14),
        _label('Priority'),
        const SizedBox(height: 8),
        Row(
          children: ['low', 'medium', 'high'].map((p) {
            final sel = _priority == p;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _priority = p),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: sel ? AppTheme.primary : const Color(0xFFF8F8FA),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: sel ? AppTheme.primary : AppTheme.borderLight),
                  ),
                  child: Text(p[0].toUpperCase() + p.substring(1),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: sel ? Colors.white : AppTheme.textMuted,
                          fontFamily: 'Poppins',
                          fontSize: 13,
                          fontWeight:
                              sel ? FontWeight.w600 : FontWeight.normal)),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _submitting ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              disabledBackgroundColor: AppTheme.primary.withValues(alpha: 0.5),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2))
                : const Text('Submit Report',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _label(String t) => Text(t,
      style: const TextStyle(
          color: Color(0xFF374151),
          fontSize: 13,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins'));

  Widget _field(TextEditingController ctrl, String hint, {int maxLines = 1}) =>
      TextField(
        controller: ctrl,
        maxLines: maxLines,
        style: const TextStyle(color: AppTheme.textDark, fontFamily: 'Poppins'),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
              color: AppTheme.textMuted, fontFamily: 'Poppins', fontSize: 13),
          filled: true,
          fillColor: const Color(0xFFF5F5F8),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
      );

  Widget _errBanner(String msg) => Container(
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
              child: Text(msg,
                  style: const TextStyle(
                      color: AppTheme.error,
                      fontFamily: 'Poppins',
                      fontSize: 12)),
            ),
          ],
        ),
      );
}

// ── Modal sheet version (from floating button) ────────────────────────────────

class _SubmitComplaintSheet extends StatelessWidget {
  final VoidCallback onSubmitted;
  const _SubmitComplaintSheet({required this.onSubmitted});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (_, ctrl) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 16,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          controller: ctrl,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                      color: const Color(0xFFE8E8EF),
                      borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const Text('Submit Report',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textDark,
                      fontFamily: 'Poppins')),
              const SizedBox(height: 16),
              _InlineSubmitForm(onSubmitted: () {
                Navigator.pop(context);
                onSubmitted();
              }),
            ],
          ),
        ),
      ),
    );
  }
}
