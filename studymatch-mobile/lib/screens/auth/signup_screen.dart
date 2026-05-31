import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import 'otp_verification_screen.dart';
import 'login_screen.dart';
import 'tutor_pending_screen.dart'; // ← NEW: import the pending screen

// ─────────────────────────────────────────────────────────────────────────────
// SignupScreen — Student (1 step) and Tutor (6 steps) flows.
//
// _step:
//   -1 = role selection
//    0 = account (name/email/password)
//    1 = OTP email verification         [tutor only — sends OTP immediately]
//    2 = academic                        [tutor only]
//    3 = verification documents          [tutor only]
//    4 = tutoring details                [tutor only]
//    5 = review & submit                 [tutor only]
// ─────────────────────────────────────────────────────────────────────────────

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  int _step = -1;
  String _selectedRole = '';

  // ── Step 0: Account ───────────────────────────────────────────────────────
  final _accountFormKey  = GlobalKey<FormState>();
  final _nameCtrl        = TextEditingController();
  final _emailCtrl       = TextEditingController();
  final _passCtrl        = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _loading     = false;
  bool _agreed      = false;
  bool _obscurePass = true;
  bool _obscureConf = true;

  // ── Step 2: Academic ──────────────────────────────────────────────────────
  final _academicFormKey   = GlobalKey<FormState>();
  String? _department;
  String? _position;
  final _employeeIdCtrl    = TextEditingController();
  final _licenseNumberCtrl = TextEditingController();
  String? _experience;
  String? _education;
  final List<String> _academicSubjects = [];

  // ── Step 3: Verification documents ───────────────────────────────────────
  final Map<String, _DocSlot> _docs = {
    'faculty_id':       _DocSlot('Faculty ID',                     isRequired: true),
    'employment':       _DocSlot('Employment Verification',         isRequired: true),
    'teaching_license': _DocSlot('Teaching License'),
    'certificates':     _DocSlot('Certificates'),
    'awards':           _DocSlot('Awards'),
    'seminar':          _DocSlot('Seminar / Training Certificates'),
  };

  // ── Step 4: Tutoring details ──────────────────────────────────────────────
  final List<String> _tutorSubjects = [];
  final Set<String>  _gradeLevels   = {};
  String? _teachingStyle;
  String? _teachingMode;
  final Set<String>  _availableDays = {};
  String _fromTime = '08:00 AM';
  String _toTime   = '05:00 PM';

  // ── Step 5: Review ────────────────────────────────────────────────────────
  bool _confirmed  = false;
  bool _submitting = false;

  // ── Static options ────────────────────────────────────────────────────────
  static const _departments = [
    'College of Education', 'College of Engineering', 'College of Arts & Sciences',
    'College of Business', 'College of Nursing', 'College of Information Technology', 'Others'
  ];
  static const _positions = [
    'Instructor I', 'Instructor II', 'Instructor III',
    'Assistant Professor I', 'Assistant Professor II',
    'Associate Professor', 'Full Professor', 'Department Chair'
  ];
  static const _experienceOptions = [
    'Less than 1 year', '1 - 3 years', '3 - 5 years', '5 - 10 years', 'More than 10 years'
  ];
  static const _educationOptions = [
    'Bachelor\'s Degree', 'Master\'s Degree', 'Doctoral Degree (PhD)',
    'Post-Doctoral', 'Professional Degree'
  ];
  static const _styleOptions = [
    'Lecture-based', 'Discussion-based', 'Hands-on / Practical',
    'Socratic / Inquiry', 'Blended'
  ];
  static const _subjectOptions = [
    'Mathematics', 'Science', 'English', 'Filipino', 'History',
    'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'Economics', 'Statistics', 'Engineering', 'Accounting', 'Others'
  ];
  static const _days      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _timeSlots = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM'
  ];

  // 6-step tutor flow
  static const _tutorLabels   = ['Account', 'Verify', 'Academic', 'Docs', 'Tutoring', 'Review'];
  static const _studentLabels = ['Account', 'Verify', 'Done'];

  bool get _isTutor => _selectedRole == 'tutor';

  @override
  void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose();
    _passCtrl.dispose(); _confirmPassCtrl.dispose();
    _employeeIdCtrl.dispose(); _licenseNumberCtrl.dispose();
    super.dispose();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  void _next() {
    if (_step == 0) {
      if (!_accountFormKey.currentState!.validate()) return;
      if (!_agreed) { _snack('Please accept the Terms of Service', error: true); return; }
      if (!_isTutor) { _doStudentSignup(); return; }
      // Tutor: register account then go to OTP step
      _doTutorAccountAndOtp();
      return;
    }
    // Step 1 = OTP screen (handled by OtpVerificationScreen navigation return)
    if (_step == 2 && !_academicFormKey.currentState!.validate()) return;
    if (_step == 5) { _submitTutor(); return; }
    if (_step < 5) setState(() => _step++);
  }

  void _back() {
    if (_step <= 0) setState(() => _step = -1);
    else setState(() => _step--);
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? Colors.redAccent : AppTheme.primary,
    ));
  }

  // Student: register → OTP screen
  Future<void> _doStudentSignup() async {
    setState(() => _loading = true);
    final err = await context.read<AppState>().signUp(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (err != null) { _snack(err, error: true); return; }
    Navigator.of(context).pushReplacement(MaterialPageRoute(
      builder: (_) => OtpVerificationScreen(
        email: _emailCtrl.text.trim(),
        name: _nameCtrl.text.trim(),
        role: _selectedRole,
      ),
    ));
  }

  // Tutor step 0→1: register account, then navigate to OTP inline
  Future<void> _doTutorAccountAndOtp() async {
    setState(() => _loading = true);
    final err = await context.read<AppState>().signUp(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (err != null) { _snack(err, error: true); return; }
    // Move to OTP step inside the stepper
    setState(() => _step = 1);
  }

  // Tutor final submit after OTP already verified
  Future<void> _submitTutor() async {
    if (!_confirmed) {
      _snack('Please confirm that all information is true and correct.', error: true);
      return;
    }
    setState(() => _submitting = true);

    // Save tutor profile data
    await context.read<AppState>().saveProfile({
      'role': 'tutor',
      'department': _department,
      'position': _position,
      'employeeId': _employeeIdCtrl.text.trim(),
      'licenseNumber': _licenseNumberCtrl.text.trim(),
      'experience': _experience,
      'education': _education,
      'subjects': _academicSubjects,
      'tutorSubjects': _tutorSubjects,
      'gradeLevels': _gradeLevels.toList(),
      'teachingStyle': _teachingStyle,
      'teachingMode': _teachingMode,
      'availableDays': _availableDays.toList(),
      'consultationFrom': _fromTime,
      'consultationTo': _toTime,
    });

    if (!mounted) return;
    setState(() => _submitting = false);

    // Show success dialog, then go to pending approval screen
    _showSuccessDialog();
  }

  void _showSuccessDialog() {
    showDialog(
      context: context, barrierDismissible: false,
      builder: (_) => Dialog(
        backgroundColor: const Color(0xFF1A1A2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _dot(AppTheme.primary), const SizedBox(width: 6),
            _dot(const Color(0xFFFBBF24)), const SizedBox(width: 6),
            _dot(const Color(0xFFF87171)), const SizedBox(width: 6),
            _dot(const Color(0xFF34D399)),
          ]),
          const SizedBox(height: 20),
          Container(width: 64, height: 64,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
              border: Border.all(color: AppTheme.primary, width: 2),
            ),
            child: const Icon(Icons.check_rounded, color: AppTheme.primary, size: 32)),
          const SizedBox(height: 20),
          const Text("You're all set!", style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, fontFamily: 'Poppins')),
          const SizedBox(height: 10),
          const Text(
            'Your tutor profile has been submitted.\nAn admin will review and approve your account shortly.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontFamily: 'Poppins'),
          ),
          const SizedBox(height: 20),
          Container(width: double.infinity, padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: const Color(0xFF111827), borderRadius: BorderRadius.circular(12)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Status', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 13)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.4)),
                ),
                child: const Text('Pending Review', style: TextStyle(color: Colors.orange, fontSize: 12, fontFamily: 'Poppins', fontWeight: FontWeight.w600))),
            ])),
          const SizedBox(height: 8),
          Container(width: double.infinity, padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: const Color(0xFF111827), borderRadius: BorderRadius.circular(12)),
            child: const Text(
              'You will be notified once your account has been approved by an admin.',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 12, fontFamily: 'Poppins'),
            )),
          const SizedBox(height: 24),
          SizedBox(width: double.infinity, height: 48,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(); // close dialog
                // Navigate to pending approval screen
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const TutorPendingScreen()),
                  (_) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: const Text('View Approval Status', style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 15)))),
        ])),
      ),
    );
  }

  Widget _dot(Color c) => Container(width: 10, height: 10, decoration: BoxDecoration(color: c, shape: BoxShape.circle));

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    if (_step == -1) return _buildRoleSelection();
    // Step 1 for tutor = inline OTP widget inside stepper
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: SafeArea(child: Column(children: [
        _buildHeader(),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox(height: 20),
            _buildStepContent(),
            const SizedBox(height: 24),
            // Hide nav buttons on OTP step — OTP screen has its own buttons
            if (_step != 1) _buildNavButtons(),
            const SizedBox(height: 16),
            Center(child: TextButton(
              onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
              child: Text.rich(TextSpan(
                text: 'Already have an account? ',
                style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 13),
                children: [TextSpan(text: 'Log in', style: TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.w600))],
              )),
            )),
            const SizedBox(height: 24),
          ]),
        )),
      ])),
    );
  }

  // ── Role selection ────────────────────────────────────────────────────────
  Widget _buildRoleSelection() => Scaffold(
    backgroundColor: const Color(0xFF0F0F1A),
    body: SafeArea(child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(children: [
        const SizedBox(height: 40),
        _logo(),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
          ),
          child: const Text('Welcome to StudyMatch!', style: TextStyle(color: AppTheme.primaryLight, fontSize: 12, fontFamily: 'Poppins', fontWeight: FontWeight.w500))),
        const SizedBox(height: 24),
        const Text('Create your account', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold, fontFamily: 'Poppins')),
        const SizedBox(height: 8),
        const Text('Join our learning community and start your journey.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF6B7280), fontSize: 13, fontFamily: 'Poppins')),
        const SizedBox(height: 32),
        const Text('I want to register as', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14, fontFamily: 'Poppins')),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _BigRoleCard(
            icon: Icons.school_rounded, label: "I'm a Student", sublabel: 'Learn and connect with tutors',
            selected: _selectedRole == 'student', onTap: () => setState(() => _selectedRole = 'student'))),
          const SizedBox(width: 16),
          Expanded(child: _BigRoleCard(
            icon: Icons.co_present_rounded, label: "I'm a Tutor", sublabel: 'Teach and help students succeed',
            selected: _selectedRole == 'tutor', onTap: () => setState(() => _selectedRole = 'tutor'))),
        ]),
        const Spacer(),
        SizedBox(width: double.infinity, height: 52,
          child: ElevatedButton(
            onPressed: _selectedRole.isEmpty ? null : () => setState(() => _step = 0),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              disabledBackgroundColor: AppTheme.primary.withValues(alpha: 0.3),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: const Text('Continue', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600, fontFamily: 'Poppins')))),
        const SizedBox(height: 20),
        Center(child: TextButton(
          onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
          child: Text.rich(TextSpan(
            text: 'Already have an account? ',
            style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 13),
            children: [TextSpan(text: 'Log in', style: TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.w600))],
          )),
        )),
        const SizedBox(height: 24),
      ]),
    )),
  );

  // ── Header ────────────────────────────────────────────────────────────────
  Widget _buildHeader() => Container(
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
    decoration: const BoxDecoration(
      color: Color(0xFF0F0F1A),
      border: Border(bottom: BorderSide(color: Color(0xFF1F2937))),
    ),
    child: Column(children: [
      _logo(),
      const SizedBox(height: 14),
      _WebStyleStepper(labels: _isTutor ? _tutorLabels : _studentLabels, currentIndex: _step),
    ]),
  );

  Widget _logo() => Row(mainAxisAlignment: MainAxisAlignment.center, children: [
    Container(width: 30, height: 30,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppTheme.primary, AppTheme.accent]),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Icon(Icons.school_rounded, color: Colors.white, size: 17)),
    const SizedBox(width: 8),
    RichText(text: const TextSpan(style: TextStyle(fontSize: 19, fontWeight: FontWeight.bold, fontFamily: 'Poppins'), children: [
      TextSpan(text: 'Study', style: TextStyle(color: Colors.white)),
      TextSpan(text: 'Match', style: TextStyle(color: AppTheme.primaryLight)),
    ])),
  ]);

  // ── Step content router ───────────────────────────────────────────────────
  Widget _buildStepContent() {
    switch (_step) {
      case 0: return _buildAccountStep();
      case 1: return _buildOtpStep();        // ← Inline OTP for tutor
      case 2: return _buildAcademicStep();
      case 3: return _buildVerificationStep();
      case 4: return _buildTutoringStep();
      case 5: return _buildReviewStep();
      default: return const SizedBox.shrink();
    }
  }

  Widget _buildNavButtons() {
    final isLast = _isTutor ? _step == 5 : _step == 0;
    return Row(children: [
      SizedBox(width: 90, height: 50,
        child: OutlinedButton(
          onPressed: _back,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFF374151)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Back', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 14)))),
      const SizedBox(width: 12),
      Expanded(child: SizedBox(height: 50,
        child: ElevatedButton(
          onPressed: (_loading || _submitting) ? null : _next,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            disabledBackgroundColor: AppTheme.primary.withValues(alpha: 0.4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: (_loading || _submitting)
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(
                isLast ? 'Submit Application' : 'Next',
                style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 15),
              )))),
    ]);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 0 – Account
  // ════════════════════════════════════════════════════════════════════════════
  Widget _buildAccountStep() => Form(key: _accountFormKey, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _stepTitle('Create your account', 'Step 1 of ${_isTutor ? 6 : 1}'),
    const SizedBox(height: 20),
    _DarkField(controller: _nameCtrl, hint: 'Full name', icon: Icons.person_outline,
      validator: (v) => (v == null || v.trim().length < 2) ? 'Enter your full name' : null),
    const SizedBox(height: 14),
    _DarkField(controller: _emailCtrl, hint: 'Email address', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress,
      validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null),
    const SizedBox(height: 14),
    _DarkField(
      controller: _passCtrl, hint: 'Password', icon: Icons.lock_outline, obscureText: _obscurePass,
      suffixIcon: IconButton(
        icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF6B7280), size: 20),
        onPressed: () => setState(() => _obscurePass = !_obscurePass)),
      validator: (v) => (v == null || v.length < 8) ? 'At least 8 characters' : null),
    const SizedBox(height: 14),
    _DarkField(
      controller: _confirmPassCtrl, hint: 'Confirm password', icon: Icons.lock_outline, obscureText: _obscureConf,
      suffixIcon: IconButton(
        icon: Icon(_obscureConf ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF6B7280), size: 20),
        onPressed: () => setState(() => _obscureConf = !_obscureConf)),
      validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null),
    const SizedBox(height: 18),
    Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
      SizedBox(width: 24, height: 24, child: Checkbox(
        value: _agreed, onChanged: (v) => setState(() => _agreed = v ?? false),
        activeColor: AppTheme.primary, checkColor: Colors.white,
        side: const BorderSide(color: Color(0xFF374151)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)))),
      const SizedBox(width: 10),
      Expanded(child: Text.rich(TextSpan(
        text: 'I agree to the ',
        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, fontFamily: 'Poppins'),
        children: [
          TextSpan(text: 'Terms of Service', style: TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.w600)),
          const TextSpan(text: ' and '),
          TextSpan(text: 'Privacy Policy', style: TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.w600)),
        ],
      ))),
    ]),
  ]));

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 – OTP Email Verification (inline, tutor only)
  // ════════════════════════════════════════════════════════════════════════════
  Widget _buildOtpStep() => _InlineOtpWidget(
    email: _emailCtrl.text.trim(),
    name: _nameCtrl.text.trim(),
    onVerified: () => setState(() => _step = 2), // on success → go to Academic
    onBack: () => setState(() => _step = 0),
  );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 – Academic (tutor only)
  // ════════════════════════════════════════════════════════════════════════════
  Widget _buildAcademicStep() => Form(key: _academicFormKey, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _stepTitle('Academic Information', 'Step 3 of 6'),
    const SizedBox(height: 20),
    _SectionLabel('Department / Faculty'), const SizedBox(height: 6),
    _DarkDropdown(
      value: _department, hint: 'Select department', items: _departments,
      onChanged: (v) => setState(() => _department = v),
      validator: (v) => v == null ? 'Please select department' : null),
    const SizedBox(height: 14),
    _SectionLabel('Position'), const SizedBox(height: 6),
    _DarkDropdown(
      value: _position, hint: 'Select position', items: _positions,
      onChanged: (v) => setState(() => _position = v),
      validator: (v) => v == null ? 'Please select position' : null),
    const SizedBox(height: 16),
    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SectionLabel('Professional Information'), const SizedBox(height: 8),
        _SectionLabel('Employee ID'), const SizedBox(height: 6),
        _DarkTextField(controller: _employeeIdCtrl, hint: 'Employee ID / Faculty ID'),
      ])),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SectionLabel('Optional'), const SizedBox(height: 8),
        _SectionLabel('Teaching License Number'), const SizedBox(height: 6),
        _DarkTextField(controller: _licenseNumberCtrl, hint: 'Teaching license number'),
      ])),
    ]),
    const SizedBox(height: 14),
    _SectionLabel('Years of Teaching Experience'), const SizedBox(height: 6),
    _DarkDropdown(
      value: _experience, hint: 'Select experience', items: _experienceOptions,
      onChanged: (v) => setState(() => _experience = v)),
    const SizedBox(height: 14),
    _SectionLabel('Highest Educational Attainment'), const SizedBox(height: 6),
    _DarkDropdown(
      value: _education, hint: 'Select attainment', items: _educationOptions,
      onChanged: (v) => setState(() => _education = v)),
    const SizedBox(height: 14),
    _SectionLabel('Subjects Handled'), const SizedBox(height: 4),
    const Text('You can select multiple subjects', style: TextStyle(color: Color(0xFF4B5563), fontSize: 11, fontFamily: 'Poppins')),
    const SizedBox(height: 8),
    _SubjectChips(
      subjects: _subjectOptions, selected: _academicSubjects,
      onToggle: (s) => setState(() {
        _academicSubjects.contains(s) ? _academicSubjects.remove(s) : _academicSubjects.add(s);
      })),
  ]));

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 – Verification Documents (tutor only)
  // ════════════════════════════════════════════════════════════════════════════
  Widget _buildVerificationStep() {
    final req = _docs.entries.where((e) => e.value.isRequired).toList();
    final opt = _docs.entries.where((e) => !e.value.isRequired).toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _stepTitle('Verification Documents', 'Step 4 of 6'),
      const SizedBox(height: 6),
      const Text(
        'Upload your documents for admin review. Required docs must be uploaded.',
        style: TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 13),
      ),
      const SizedBox(height: 20),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _SectionLabel('Required Documents'), const SizedBox(height: 10),
          ...req.map((e) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _DocUploadCard(slot: e.value, onUpload: () => _pickFile(e.value)))),
        ])),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _SectionLabel('Optional Documents'), const SizedBox(height: 10),
          ...opt.map((e) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _DocUploadCard(slot: e.value, onUpload: () => _pickFile(e.value)))),
        ])),
      ]),
      const SizedBox(height: 16),
      GestureDetector(
        onTap: () => _pickFile(null),
        child: Container(
          width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 28),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF374151)),
          ),
          child: Column(children: [
            const Icon(Icons.cloud_upload_outlined, color: Color(0xFF6B7280), size: 32),
            const SizedBox(height: 8),
            RichText(text: TextSpan(
              text: 'Drag and drop files here, or ',
              style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 13),
              children: [TextSpan(text: 'click to browse', style: TextStyle(color: AppTheme.primaryLight, fontWeight: FontWeight.w600))])),
            const SizedBox(height: 4),
            const Text('PDF, JPG, PNG. Max 10MB each', style: TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 11)),
          ])),
      ),
    ]);
  }

  Future<void> _pickFile(_DocSlot? slot) async {
    final r = await FilePicker.platform.pickFiles(
      type: FileType.custom, allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png']);
    if (r != null && mounted) setState(() {
      if (slot != null) {
        slot.filePath = r.files.single.path;
        slot.fileName = r.files.single.name;
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4 – Tutoring Details (tutor only)
  // ════════════════════════════════════════════════════════════════════════════
  Widget _buildTutoringStep() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _stepTitle('Tutoring Details', 'Step 5 of 6'),
    const SizedBox(height: 20),
    _SectionLabel('Subjects'), const SizedBox(height: 8),
    _SubjectChips(
      subjects: _subjectOptions, selected: _tutorSubjects,
      onToggle: (s) => setState(() {
        _tutorSubjects.contains(s) ? _tutorSubjects.remove(s) : _tutorSubjects.add(s);
      })),
    const SizedBox(height: 16),
    _SectionLabel('Grade Levels Taught'), const SizedBox(height: 8),
    ...['Junior High School', 'Senior High School', 'College / University'].map((lvl) => Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: _gradeLevels.contains(lvl) ? AppTheme.primary.withValues(alpha: 0.08) : const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _gradeLevels.contains(lvl) ? AppTheme.primary : const Color(0xFF1F2937)),
      ),
      child: CheckboxListTile(
        dense: true,
        title: Text(lvl, style: TextStyle(
          color: _gradeLevels.contains(lvl) ? Colors.white : const Color(0xFF9CA3AF),
          fontFamily: 'Poppins', fontSize: 13)),
        value: _gradeLevels.contains(lvl),
        onChanged: (v) => setState(() { v! ? _gradeLevels.add(lvl) : _gradeLevels.remove(lvl); }),
        activeColor: AppTheme.primary, checkColor: Colors.white,
        side: const BorderSide(color: Color(0xFF374151)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4))))),
    const SizedBox(height: 16),
    _SectionLabel('Teaching Style'), const SizedBox(height: 8),
    _DarkDropdown(
      value: _teachingStyle, hint: 'Select approach', items: _styleOptions,
      onChanged: (v) => setState(() => _teachingStyle = v)),
    const SizedBox(height: 16),
    _SectionLabel('Teaching Mode'), const SizedBox(height: 8),
    Row(children: ['Onsite', 'Online', 'Both'].map((mode) {
      final sel = _teachingMode == mode;
      return Expanded(child: GestureDetector(
        onTap: () => setState(() => _teachingMode = mode),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: EdgeInsets.only(right: mode == 'Both' ? 0 : 8),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: sel ? AppTheme.primary.withValues(alpha: 0.15) : const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: sel ? AppTheme.primary : const Color(0xFF1F2937), width: sel ? 1.5 : 1),
          ),
          child: Text(mode, textAlign: TextAlign.center, style: TextStyle(
            color: sel ? Colors.white : const Color(0xFF9CA3AF),
            fontFamily: 'Poppins', fontSize: 13,
            fontWeight: sel ? FontWeight.w600 : FontWeight.normal)))));
    }).toList()),
    const SizedBox(height: 20),
    _SectionLabel('Consultation Hours'), const SizedBox(height: 10),
    _SectionLabel('Days'), const SizedBox(height: 8),
    Wrap(spacing: 8, runSpacing: 8, children: _days.map((day) {
      final sel = _availableDays.contains(day);
      return GestureDetector(
        onTap: () => setState(() { sel ? _availableDays.remove(day) : _availableDays.add(day); }),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150), width: 44, height: 36,
          decoration: BoxDecoration(
            color: sel ? AppTheme.primary.withValues(alpha: 0.15) : const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: sel ? AppTheme.primary : const Color(0xFF1F2937), width: sel ? 1.5 : 1),
          ),
          child: Center(child: Text(day, style: TextStyle(
            color: sel ? Colors.white : const Color(0xFF9CA3AF),
            fontFamily: 'Poppins', fontSize: 12,
            fontWeight: sel ? FontWeight.w600 : FontWeight.normal)))));
    }).toList()),
    const SizedBox(height: 14),
    Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SectionLabel('From'), const SizedBox(height: 6),
        _DarkDropdown(value: _fromTime, hint: '', items: _timeSlots, onChanged: (v) => setState(() => _fromTime = v!), compact: true),
      ])),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _SectionLabel('To'), const SizedBox(height: 6),
        _DarkDropdown(value: _toTime, hint: '', items: _timeSlots, onChanged: (v) => setState(() => _toTime = v!), compact: true),
      ])),
    ]),
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 5 – Review & Submit (tutor only)
  // ════════════════════════════════════════════════════════════════════════════
  Widget _buildReviewStep() {
    final docsUploaded = _docs.values.where((d) => d.filePath != null).length;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _stepTitle('Review and Submit', 'Step 6 of 6'),
      const SizedBox(height: 6),
      const Text('Please review your information before submitting.',
        style: TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 13)),
      const SizedBox(height: 20),
      _ReviewCard(
        icon: Icons.person_outline, title: 'Account Information',
        onEdit: () => setState(() => _step = 0),
        rows: [
          _nameCtrl.text.isEmpty ? 'Not set' : _nameCtrl.text,
          _emailCtrl.text.isEmpty ? 'Not set' : _emailCtrl.text,
        ]),
      const SizedBox(height: 12),
      _ReviewCard(
        icon: Icons.school_outlined, title: 'Academic Information',
        onEdit: () => setState(() => _step = 2),
        rows: [
          _department ?? 'Not set',
          _position ?? 'Not set',
          'Employee ID: ${_employeeIdCtrl.text.isEmpty ? 'Not set' : _employeeIdCtrl.text}',
          'Experience: ${_experience ?? 'Not set'}',
        ]),
      const SizedBox(height: 12),
      _ReviewCard(
        icon: Icons.folder_outlined, title: 'Verification Documents',
        onEdit: () => setState(() => _step = 3),
        rows: ['$docsUploaded document(s) uploaded']),
      const SizedBox(height: 12),
      _ReviewCard(
        icon: Icons.menu_book_outlined, title: 'Teaching Details',
        onEdit: () => setState(() => _step = 4),
        rows: [
          'Subjects: ${_tutorSubjects.isEmpty ? 'Not set' : _tutorSubjects.join(', ')}',
          'Mode: ${_teachingMode ?? 'Not set'}',
          'Style: ${_teachingStyle ?? 'Not set'}',
        ]),
      const SizedBox(height: 20),
      // Admin approval notice
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.orange.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
        ),
        child: Row(children: [
          Icon(Icons.info_outline, color: Colors.orange.shade300, size: 18),
          const SizedBox(width: 10),
          const Expanded(child: Text(
            'After submission, an admin will review your documents and approve your account before you can start tutoring.',
            style: TextStyle(color: Color(0xFFD97706), fontFamily: 'Poppins', fontSize: 12),
          )),
        ])),
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF1F2937)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 20, height: 20, child: Checkbox(
            value: _confirmed, onChanged: (v) => setState(() => _confirmed = v ?? false),
            activeColor: AppTheme.primary, checkColor: Colors.white,
            side: const BorderSide(color: Color(0xFF374151)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)))),
          const SizedBox(width: 12),
          const Expanded(child: Text(
            'I confirm that all information provided is true and correct.',
            style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 13))),
        ])),
    ]);
  }

  Widget _stepTitle(String title, String sub) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Poppins')),
    const SizedBox(height: 2),
    Text(sub, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 12, fontFamily: 'Poppins')),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline OTP Widget (step 1 inside the stepper for tutors)
// ─────────────────────────────────────────────────────────────────────────────
class _InlineOtpWidget extends StatefulWidget {
  final String email;
  final String name;
  final VoidCallback onVerified;
  final VoidCallback onBack;
  const _InlineOtpWidget({required this.email, required this.name, required this.onVerified, required this.onBack});

  @override
  State<_InlineOtpWidget> createState() => _InlineOtpWidgetState();
}

class _InlineOtpWidgetState extends State<_InlineOtpWidget> {
  final List<TextEditingController> _ctrs = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _foci = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  int _resendSeconds = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  void _startResendTimer() {
    setState(() { _resendSeconds = 60; _canResend = false; });
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _resendSeconds--);
      if (_resendSeconds <= 0) { setState(() => _canResend = true); return false; }
      return true;
    });
  }

  String get _code => _ctrs.map((c) => c.text).join();

  Future<void> _verify() async {
    if (_code.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Please enter the 6-digit code'),
        backgroundColor: Colors.redAccent));
      return;
    }
    setState(() => _loading = true);
    final err = await context.read<AppState>().verifyOtp(
      email: widget.email, otp: _code);
    if (!mounted) return;
    setState(() => _loading = false);
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(err), backgroundColor: Colors.redAccent));
      return;
    }
    widget.onVerified();
  }

  @override
  void dispose() {
    for (final c in _ctrs) c.dispose();
    for (final f in _foci) f.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Verify your email', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Poppins')),
      const SizedBox(height: 2),
      const Text('Step 2 of 6', style: TextStyle(color: Color(0xFF6B7280), fontSize: 12, fontFamily: 'Poppins')),
      const SizedBox(height: 24),
      Center(child: Column(children: [
        const Text('We sent a 6-digit code to', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 14)),
        const SizedBox(height: 4),
        Text(widget.email, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 15, fontWeight: FontWeight.w600)),
      ])),
      const SizedBox(height: 28),
      // OTP boxes
      Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(6, (i) {
        return Container(
          width: 46, height: 54, margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFF374151)),
          ),
          child: Center(child: TextField(
            controller: _ctrs[i],
            focusNode: _foci[i],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Poppins'),
            decoration: const InputDecoration(counterText: '', border: InputBorder.none),
            onChanged: (v) {
              if (v.isNotEmpty && i < 5) _foci[i + 1].requestFocus();
              if (v.isEmpty && i > 0) _foci[i - 1].requestFocus();
            },
          )),
        );
      })),
      const SizedBox(height: 20),
      Center(child: _canResend
        ? TextButton(
            onPressed: () {
              context.read<AppState>().resendOtp(email: widget.email);
              _startResendTimer();
            },
            child: Text('Resend code', style: TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontSize: 13, fontWeight: FontWeight.w600)))
        : Text("Didn't receive it? Resend in ${_resendSeconds}s",
            style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 13))),
      const SizedBox(height: 28),
      Row(children: [
        SizedBox(width: 90, height: 50,
          child: OutlinedButton(
            onPressed: widget.onBack,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF374151)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Back', style: TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 14)))),
        const SizedBox(width: 12),
        Expanded(child: SizedBox(height: 50,
          child: ElevatedButton(
            onPressed: _loading ? null : _verify,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              disabledBackgroundColor: AppTheme.primary.withValues(alpha: 0.4),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Verify', style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.w600, fontSize: 15))))),
      ]),
    ]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared models & widgets
// ─────────────────────────────────────────────────────────────────────────────

class _DocSlot {
  final String label;
  final bool isRequired;
  String? filePath;
  String? fileName;
  _DocSlot(this.label, {this.isRequired = false});
}

class _WebStyleStepper extends StatelessWidget {
  final List<String> labels;
  final int currentIndex;
  const _WebStyleStepper({required this.labels, required this.currentIndex});

  @override
  Widget build(BuildContext context) => Row(
    children: List.generate(labels.length * 2 - 1, (i) {
      if (i.isOdd) {
        final done = (i ~/ 2) < currentIndex;
        return Expanded(child: Container(height: 2, color: done ? AppTheme.primary : const Color(0xFF1F2937)));
      }
      final step = i ~/ 2;
      final active = step == currentIndex;
      final done = step < currentIndex;
      return Column(children: [
        Container(width: 26, height: 26,
          decoration: BoxDecoration(
            color: active || done ? AppTheme.primary : const Color(0xFF1F2937),
            shape: BoxShape.circle,
            border: Border.all(color: active || done ? AppTheme.primary : const Color(0xFF374151), width: 2),
          ),
          child: Center(child: done
            ? const Icon(Icons.check, color: Colors.white, size: 13)
            : Text('${step + 1}', style: TextStyle(
                color: active ? Colors.white : const Color(0xFF6B7280),
                fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Poppins')))),
        const SizedBox(height: 4),
        Text(labels[step], style: TextStyle(
          color: active ? AppTheme.primaryLight : done ? const Color(0xFF9CA3AF) : const Color(0xFF4B5563),
          fontSize: 9, fontFamily: 'Poppins')),
      ]);
    }),
  );
}

class _BigRoleCard extends StatelessWidget {
  final IconData icon; final String label, sublabel; final bool selected; final VoidCallback onTap;
  const _BigRoleCard({required this.icon, required this.label, required this.sublabel, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(onTap: onTap, child: AnimatedContainer(
    duration: const Duration(milliseconds: 200),
    padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
    decoration: BoxDecoration(
      color: selected ? AppTheme.primary.withValues(alpha: 0.12) : const Color(0xFF1A1A2E),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: selected ? AppTheme.primary : const Color(0xFF1F2937), width: selected ? 2 : 1),
    ),
    child: Column(children: [
      Container(width: 56, height: 56,
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary.withValues(alpha: 0.2) : const Color(0xFF111827),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: selected ? AppTheme.primaryLight : const Color(0xFF6B7280), size: 28)),
      const SizedBox(height: 14),
      Text(label, textAlign: TextAlign.center, style: TextStyle(
        color: selected ? Colors.white : const Color(0xFF9CA3AF),
        fontSize: 15, fontWeight: FontWeight.w600, fontFamily: 'Poppins')),
      const SizedBox(height: 6),
      Text(sublabel, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF4B5563), fontSize: 11, fontFamily: 'Poppins')),
    ]),
  ));
}

class _SectionLabel extends StatelessWidget {
  final String text; const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
    style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, fontFamily: 'Poppins', fontWeight: FontWeight.w500));
}

class _DarkDropdown extends StatelessWidget {
  final String? value; final String hint; final List<String> items;
  final ValueChanged<String?> onChanged; final String? Function(String?)? validator; final bool compact;
  const _DarkDropdown({required this.value, required this.hint, required this.items, required this.onChanged, this.validator, this.compact = false});

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    value: value,
    decoration: InputDecoration(
      hintText: hint.isEmpty ? null : hint,
      hintStyle: const TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 13),
      filled: true, fillColor: const Color(0xFF1A1A2E),
      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: compact ? 10 : 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1F2937))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1F2937))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Colors.redAccent)),
      errorStyle: const TextStyle(color: Colors.redAccent, fontFamily: 'Poppins', fontSize: 11)),
    dropdownColor: const Color(0xFF1A1A2E),
    style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 13),
    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6B7280)),
    validator: validator,
    items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
    onChanged: onChanged);
}

class _DarkTextField extends StatelessWidget {
  final TextEditingController controller; final String hint;
  const _DarkTextField({required this.controller, required this.hint});

  @override
  Widget build(BuildContext context) => TextFormField(
    controller: controller,
    style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 13),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 13),
      filled: true, fillColor: const Color(0xFF1A1A2E),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1F2937))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF1F2937))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5))));
}

class _DarkField extends StatelessWidget {
  final TextEditingController controller; final String hint; final IconData icon;
  final bool obscureText; final Widget? suffixIcon; final TextInputType? keyboardType; final String? Function(String?)? validator;
  const _DarkField({required this.controller, required this.hint, required this.icon, this.obscureText = false, this.suffixIcon, this.keyboardType, this.validator});

  @override
  Widget build(BuildContext context) => TextFormField(
    controller: controller, obscureText: obscureText, keyboardType: keyboardType, validator: validator,
    style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 14),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 14),
      prefixIcon: Icon(icon, color: const Color(0xFF6B7280), size: 20), suffixIcon: suffixIcon,
      filled: true, fillColor: const Color(0xFF1A1A2E),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1F2937))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1F2937))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.redAccent)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.redAccent)),
      errorStyle: const TextStyle(color: Colors.redAccent, fontFamily: 'Poppins', fontSize: 11)));
}

class _SubjectChips extends StatelessWidget {
  final List<String> subjects; final List<String> selected; final void Function(String) onToggle;
  const _SubjectChips({required this.subjects, required this.selected, required this.onToggle});

  @override
  Widget build(BuildContext context) => Wrap(spacing: 8, runSpacing: 8, children: [
    ...selected.map((s) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.4)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(s, style: const TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontSize: 12)),
        const SizedBox(width: 4),
        GestureDetector(onTap: () => onToggle(s), child: const Icon(Icons.close, size: 14, color: AppTheme.primaryLight)),
      ]))),
    GestureDetector(onTap: () => _showPicker(context), child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: const Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.add, color: AppTheme.primaryLight, size: 14), SizedBox(width: 4),
        Text('Add', style: TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w500)),
      ]))),
  ]);

  void _showPicker(BuildContext ctx) => showModalBottomSheet(
    context: ctx, backgroundColor: const Color(0xFF1A1A2E),
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (_) => StatefulBuilder(builder: (c, set) => Padding(
      padding: const EdgeInsets.all(20),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Select Subjects', style: TextStyle(color: Colors.white, fontFamily: 'Poppins', fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 16),
        Wrap(spacing: 8, runSpacing: 8, children: subjects.map((s) {
          final isSel = selected.contains(s);
          return GestureDetector(
            onTap: () { onToggle(s); set(() {}); },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSel ? AppTheme.primary.withValues(alpha: 0.2) : const Color(0xFF111827),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isSel ? AppTheme.primary : const Color(0xFF374151)),
              ),
              child: Text(s, style: TextStyle(
                color: isSel ? AppTheme.primaryLight : const Color(0xFF9CA3AF),
                fontFamily: 'Poppins', fontSize: 13,
                fontWeight: isSel ? FontWeight.w600 : FontWeight.normal))));
        }).toList()),
        const SizedBox(height: 20),
      ]))));
}

class _DocUploadCard extends StatelessWidget {
  final _DocSlot slot; final VoidCallback onUpload;
  const _DocUploadCard({required this.slot, required this.onUpload});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: BoxDecoration(
      color: slot.filePath != null ? AppTheme.primary.withValues(alpha: 0.08) : const Color(0xFF1A1A2E),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: slot.filePath != null ? AppTheme.primary.withValues(alpha: 0.4) : const Color(0xFF1F2937)),
    ),
    child: Row(children: [
      Icon(
        slot.filePath != null ? Icons.check_circle_outline : Icons.description_outlined,
        color: slot.filePath != null ? AppTheme.primaryLight : const Color(0xFF6B7280), size: 18),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(slot.label, style: TextStyle(
          color: slot.filePath != null ? Colors.white : const Color(0xFF9CA3AF),
          fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w500)),
        if (slot.filePath != null)
          Text(slot.fileName ?? '', style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 10), overflow: TextOverflow.ellipsis)
        else
          Text(
            slot.isRequired ? 'Required' : 'Optional',
            style: TextStyle(color: slot.isRequired ? Colors.redAccent.withValues(alpha: 0.7) : const Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 10)),
      ])),
      const SizedBox(width: 8),
      GestureDetector(onTap: onUpload, child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.primary.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
        ),
        child: const Text('Upload', style: TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontSize: 11, fontWeight: FontWeight.w600)))),
    ]));
}

class _ReviewCard extends StatelessWidget {
  final IconData icon; final String title; final VoidCallback onEdit; final List<String> rows;
  const _ReviewCard({required this.icon, required this.title, required this.onEdit, required this.rows});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFF1A1A2E),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFF1F2937)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Row(children: [
          Icon(icon, color: const Color(0xFF6B7280), size: 18),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: Colors.white, fontFamily: 'Poppins', fontSize: 14, fontWeight: FontWeight.w600)),
        ]),
        GestureDetector(onTap: onEdit, child: Text('Edit',
          style: TextStyle(color: AppTheme.primaryLight, fontFamily: 'Poppins', fontSize: 13, fontWeight: FontWeight.w500))),
      ]),
      const SizedBox(height: 10),
      ...rows.map((r) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(r, style: const TextStyle(color: Color(0xFF6B7280), fontFamily: 'Poppins', fontSize: 12)))),
    ]));
}