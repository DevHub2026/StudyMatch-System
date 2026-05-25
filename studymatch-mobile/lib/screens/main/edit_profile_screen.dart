import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../services/app_state.dart';
import '../../utils/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import 'profile_avatar.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _schoolCtrl;
  late final TextEditingController _bioCtrl;
  late final TextEditingController _programCtrl;

  String? _selectedTopic;
  DateTime? _dob;
  String? _selectedGender;
  String? _selectedDepartment;
  String? _selectedYearLevel;
  late final TextEditingController _degreeCtrl;

  late Set<String> _selectedSubjects;
  late Set<String> _selectedStrengths;
  late Set<String> _selectedWeaknesses;
  late Set<String> _selectedLearningStyles;
  late Set<String> _selectedStudyStyles;
  late Map<String, Set<String>> _availability;
  late Set<String> _selectedDays;
  bool _saving = false;

  Uint8List? _photoBytes;
  String? _photoFileName;
  bool _uploadingPhoto = false;

  static const _subjectList = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
    'History',
    'Geography',
    'Economics',
    'Psychology',
    'Literature',
    'Statistics',
    'Calculus',
    'Algebra',
    'Organic Chemistry',
    'Programming',
  ];
  static const _deptList = ['CTE', 'CAS', 'CET', 'CBE', 'CCJ', 'COAHS'];
  static const _dayList = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];
  static const _timeList = [
    'Morning (6am-12pm)',
    'Afternoon (12pm-6pm)',
    'Evening (6pm-9pm)',
    'Night (9pm-6am)',
  ];

  @override
  void initState() {
    super.initState();
    final user = context.read<AppState>().currentUser!;
    _nameCtrl = TextEditingController(text: user.fullName);
    _phoneCtrl = TextEditingController(text: user.phoneNumber ?? '');
    _schoolCtrl = TextEditingController(text: user.school ?? '');
    _bioCtrl = TextEditingController(text: user.bio ?? '');
    _programCtrl = TextEditingController(
        text: user.isStudent ? (user.department ?? '') : '');
    _degreeCtrl = TextEditingController(
        text: user.isTutor ? (user.department ?? '') : '');

    _selectedTopic = user.topic;
    _dob = user.dateOfBirth;
    _selectedGender = _genderFromDb(user.gender);
    _selectedDepartment = user.isStudent ? user.department : null;
    _selectedYearLevel = _yearLevelFromDb(user.yearLevel);

    _selectedSubjects = Set.from(user.subjects);
    _selectedStrengths = Set.from(user.strengths);
    _selectedWeaknesses = Set.from(user.weaknesses);
    _selectedLearningStyles = Set.from(user.learningStyles);
    _selectedStudyStyles = Set.from(user.studyStyles);
    _availability =
        user.availability.map((k, v) => MapEntry(k, Set<String>.from(v)));
    _selectedDays = Set.from(_availability.keys);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _schoolCtrl.dispose();
    _bioCtrl.dispose();
    _programCtrl.dispose();
    _degreeCtrl.dispose();
    super.dispose();
  }

  bool get _isTutor => context.read<AppState>().currentUser?.role == 'tutor';

  /// Converts a DB gender value (e.g. 'male', 'prefer_not_to_say') to the
  /// display label used by the dropdown items.
  static String? _genderFromDb(String? dbValue) {
    const map = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Non-Binary',
      'prefer_not_to_say': 'Prefer not to say',
    };
    if (dbValue == null) return null;
    return map[dbValue] ?? dbValue;
  }

  /// Normalises the DB year_level value (e.g. '1st') to the dropdown label.
  static String? _yearLevelFromDb(String? dbValue) {
    const valid = ['1st', '2nd', '3rd', '4th', '5th'];
    if (dbValue == null) return null;
    return valid.contains(dbValue) ? dbValue : null;
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: AppTheme.borderLight,
                  borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined,
                  color: AppTheme.primary),
              title: const Text('Take Photo',
                  style: TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins')),
              onTap: () async {
                Navigator.pop(context);
                final img = await picker.pickImage(
                    source: ImageSource.camera, imageQuality: 80);
                if (img != null) {
                  final bytes = await img.readAsBytes();
                  setState(() {
                    _photoBytes = bytes;
                    _photoFileName = img.name;
                  });
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined,
                  color: AppTheme.primary),
              title: const Text('Choose from Gallery',
                  style: TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins')),
              onTap: () async {
                Navigator.pop(context);
                final img = await picker.pickImage(
                    source: ImageSource.gallery, imageQuality: 80);
                if (img != null) {
                  final bytes = await img.readAsBytes();
                  setState(() {
                    _photoBytes = bytes;
                    _photoFileName = img.name;
                  });
                }
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final state = context.read<AppState>();

    final avail = <String, List<String>>{};
    for (final day in _selectedDays) {
      avail[day] = (_availability[day] ?? <String>{}).toList();
    }

    String? photoUrl;
    if (_photoBytes != null && _photoFileName != null) {
      setState(() => _uploadingPhoto = true);
      final uploadResult = await state.uploadProfilePhoto(
        photoBytes: _photoBytes!,
        fileName: _photoFileName!,
      );
      setState(() => _uploadingPhoto = false);
      if (uploadResult != null) {
        photoUrl = uploadResult;
      }
    }

    final fields = <String, dynamic>{
      'fullName': _nameCtrl.text.trim(),
      'phoneNumber':
          _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      'school': _schoolCtrl.text.trim(),
      'bio': _bioCtrl.text.trim(),
      'topic': _selectedTopic,
      'dateOfBirth': _dob?.toIso8601String(),
      'gender': _selectedGender,
      // For students: send 'program' (degree text) and keep 'department' for compatibility.
      // For tutors: send 'department' mapped to specialization.
      if (!_isTutor)
        'program':
            _programCtrl.text.trim().isEmpty ? null : _programCtrl.text.trim(),
      'department': _isTutor ? _degreeCtrl.text.trim() : _selectedDepartment,
      'yearLevel': _selectedYearLevel,
      'subjects': _selectedSubjects.toList(),
      'strengths': _selectedStrengths.toList(),
      'weaknesses': _selectedWeaknesses.toList(),
      'learningStyles': _selectedLearningStyles.toList(),
      'studyStyles': _selectedStudyStyles.toList(),
      'availability': avail,
    };

    if (photoUrl != null) {
      fields['profilePhotoUrl'] = photoUrl;
    }

    final error = await state.saveProfile(fields);

    if (!mounted) return;
    setState(() => _saving = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error ?? 'Profile updated!'),
        backgroundColor: error == null ? AppTheme.success : AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
    if (error == null) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Form(
        key: _formKey,
        child: CustomScrollView(
          slivers: [
            _buildAppBar(),
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildAvatarHeader(),
                  _buildSection(
                    icon: Icons.person_outline_rounded,
                    title: 'Personal Information',
                    child: _buildPersonalInfo(),
                  ),
                  _buildSection(
                    icon: Icons.school_outlined,
                    title: 'Academic Details',
                    child: _buildAcademicDetails(),
                  ),
                  _buildSection(
                    icon: Icons.menu_book_outlined,
                    title: 'Subjects',
                    child: _buildSubjects(),
                  ),
                  if (_isTutor)
                    _buildSection(
                      icon: Icons.emoji_events_outlined,
                      title: 'Expert Subjects (Can Tutor)',
                      child: _buildStrengths(),
                    ),
                  if (!_isTutor)
                    _buildSection(
                      icon: Icons.help_outline,
                      title: 'Needs Help With',
                      child: _buildWeaknesses(),
                    ),
                  _buildSection(
                    icon: Icons.psychology_outlined,
                    title: 'Study Style',
                    child: _buildStudyStyle(),
                  ),
                  _buildSection(
                    icon: Icons.calendar_month_outlined,
                    title: 'Availability',
                    child: _buildAvailability(),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 48),
                    child: GradientButton(
                      text: 'Save Changes',
                      onPressed: _save,
                      isLoading: _saving || _uploadingPhoto,
                      icon: Icons.check_rounded,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      pinned: true,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: AppTheme.borderLight),
      ),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded,
            color: Color(0xFF1A1A2E), size: 18),
        onPressed: () => Navigator.of(context).pop(),
      ),
      title: const Text('Edit Profile',
          style: TextStyle(
              color: Color(0xFF1A1A2E),
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w600,
              fontSize: 18)),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: (_saving || _uploadingPhoto)
              ? const Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AppTheme.primary),
                  ),
                )
              : TextButton(
                  onPressed: _save,
                  child: const Text('Save',
                      style: TextStyle(
                          color: AppTheme.primary,
                          fontFamily: 'Poppins',
                          fontWeight: FontWeight.w600,
                          fontSize: 15)),
                ),
        ),
      ],
    );
  }

  Widget _buildAvatarHeader() {
    final name = _nameCtrl.text;
    final existingPhotoUrl =
        context.read<AppState>().currentUser?.profilePhotoUrl;

    return GestureDetector(
      onTap: _pickPhoto,
      child: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF2D1F5E), Color(0xFF1A0A3A)],
          ),
        ),
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Column(
          children: [
            Stack(
              children: [
                _photoBytes != null
                    ? Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.success, width: 3),
                        ),
                        child: ClipOval(
                          child: Image.memory(_photoBytes!,
                              fit: BoxFit.cover, width: 88, height: 88),
                        ),
                      )
                    : ProfileAvatar(
                        photoUrl: existingPhotoUrl,
                        displayName: name,
                        size: 88,
                      ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _photoBytes != null
                          ? AppTheme.success
                          : AppTheme.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Icon(
                        _photoBytes != null
                            ? Icons.check_rounded
                            : Icons.camera_alt_rounded,
                        color: Colors.white,
                        size: 14),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              _photoBytes != null
                  ? 'Photo selected — tap Save to upload'
                  : 'Tap to change photo',
              style: TextStyle(
                  color: _photoBytes != null
                      ? AppTheme.success
                      : Colors.white.withValues(alpha: 0.7),
                  fontSize: 12,
                  fontFamily: 'Poppins'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
      {required IconData icon, required String title, required Widget child}) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: AppTheme.primary, size: 17),
                ),
                const SizedBox(width: 10),
                Text(title,
                    style: const TextStyle(
                        color: Color(0xFF1A1A2E),
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        fontFamily: 'Poppins')),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.borderLight),
          Padding(padding: const EdgeInsets.all(16), child: child),
        ],
      ),
    );
  }

  static InputDecoration _lightDec({String? hint, IconData? icon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle:
          const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
      prefixIcon: icon != null
          ? Icon(icon, color: const Color(0xFF9CA3AF), size: 20)
          : null,
      filled: true,
      fillColor: const Color(0xFFF5F5F8),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.borderLight)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.borderLight)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.error)),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.error, width: 1.5)),
    );
  }

  static const _inputTextStyle =
      TextStyle(color: Color(0xFF1A1A2E), fontFamily: 'Poppins', fontSize: 14);

  Widget _buildPersonalInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel('Full Name'),
        const SizedBox(height: 6),
        TextFormField(
          controller: _nameCtrl,
          style: _inputTextStyle,
          decoration:
              _lightDec(hint: 'Juan dela Cruz', icon: Icons.person_outline),
          validator: (v) => (v == null || v.trim().length < 2)
              ? 'Enter your full name'
              : null,
        ),
        const SizedBox(height: 14),
        _fieldLabel('Phone Number (Optional)'),
        const SizedBox(height: 6),
        TextFormField(
          controller: _phoneCtrl,
          style: _inputTextStyle,
          keyboardType: TextInputType.phone,
          decoration:
              _lightDec(hint: '+63 912 345 6789', icon: Icons.phone_outlined),
        ),
        const SizedBox(height: 14),
        _fieldLabel('Bio (Optional)'),
        const SizedBox(height: 6),
        TextField(
          controller: _bioCtrl,
          maxLines: 3,
          style: _inputTextStyle,
          decoration: InputDecoration(
            hintText: _isTutor
                ? 'Tell students about your teaching approach...'
                : 'Tell others about yourself...',
            hintStyle: const TextStyle(
                color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
            filled: true,
            fillColor: const Color(0xFFF5F5F8),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderLight)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderLight)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: AppTheme.primary, width: 1.5)),
          ),
        ),
        const SizedBox(height: 14),
        _DatePickerField(
            label: 'Date of Birth',
            value: _dob,
            onChanged: (v) => setState(() => _dob = v)),
        const SizedBox(height: 14),
        _DropdownField(
          label: 'Gender',
          hint: 'Select gender',
          value: _selectedGender,
          items: const ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
          onChanged: (v) => setState(() => _selectedGender = v),
        ),
      ],
    );
  }

  Widget _buildAcademicDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_isTutor) ...[
          _fieldLabel('College Degree'),
          const SizedBox(height: 6),
          TextField(
            controller: _degreeCtrl,
            style: _inputTextStyle,
            decoration: InputDecoration(
              hintText: 'e.g. BS Computer Science',
              hintStyle: const TextStyle(
                  color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
              prefixIcon: const Icon(Icons.workspace_premium_outlined,
                  color: Color(0xFF9CA3AF), size: 20),
              filled: true,
              fillColor: const Color(0xFFF5F5F8),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.borderLight)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.borderLight)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: AppTheme.primary, width: 1.5)),
            ),
          ),
        ] else ...[
          _fieldLabel('Program'),
          const SizedBox(height: 6),
          TextField(
            controller: _programCtrl,
            style: _inputTextStyle,
            decoration: InputDecoration(
              hintText: 'e.g. BS Computer Science',
              hintStyle: const TextStyle(
                  color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
              prefixIcon: const Icon(Icons.school_outlined,
                  color: Color(0xFF9CA3AF), size: 20),
              filled: true,
              fillColor: const Color(0xFFF5F5F8),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.borderLight)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.borderLight)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: AppTheme.primary, width: 1.5)),
            ),
          ),
          const SizedBox(height: 14),
          _fieldLabel('College Department'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _deptList
                .map((d) => _LightChip(
                      label: d,
                      selected: _selectedDepartment == d,
                      onTap: () => setState(() => _selectedDepartment =
                          _selectedDepartment == d ? null : d),
                    ))
                .toList(),
          ),
          const SizedBox(height: 14),
          _DropdownField(
            label: 'Year Level',
            hint: 'Select year level',
            value: _selectedYearLevel,
            items: const ['1st', '2nd', '3rd', '4th', '5th'],
            onChanged: (v) => setState(() => _selectedYearLevel = v),
          ),
        ],
        const SizedBox(height: 16),
        _DropdownField(
          label: 'Strand / Track (Optional)',
          hint: 'Select strand or track',
          value: _selectedTopic,
          items: const ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'],
          onChanged: (v) => setState(() => _selectedTopic = v),
        ),
      ],
    );
  }

  Widget _buildSubjects() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_selectedSubjects.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Text('${_selectedSubjects.length} selected',
                style: const TextStyle(
                    color: AppTheme.primary,
                    fontSize: 13,
                    fontFamily: 'Poppins')),
          ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _subjectList
              .map((s) => _LightChip(
                    label: s,
                    selected: _selectedSubjects.contains(s),
                    onTap: () => setState(() => _selectedSubjects.contains(s)
                        ? _selectedSubjects.remove(s)
                        : _selectedSubjects.add(s)),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildStrengths() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Students weak in these subjects will be matched with you',
            style: TextStyle(
                color: Color(0xFF9CA3AF), fontSize: 12, fontFamily: 'Poppins')),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _subjectList
              .map((s) => _LightChip(
                    label: s,
                    selected: _selectedStrengths.contains(s),
                    selectedColor: AppTheme.success,
                    onTap: () => setState(() => _selectedStrengths.contains(s)
                        ? _selectedStrengths.remove(s)
                        : _selectedStrengths.add(s)),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildWeaknesses() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
            'Tutors strong in these subjects will be prioritised in your matches',
            style: TextStyle(
                color: Color(0xFF9CA3AF), fontSize: 12, fontFamily: 'Poppins')),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _subjectList
              .map((s) => _LightChip(
                    label: s,
                    selected: _selectedWeaknesses.contains(s),
                    selectedColor: AppTheme.error,
                    onTap: () => setState(() => _selectedWeaknesses.contains(s)
                        ? _selectedWeaknesses.remove(s)
                        : _selectedWeaknesses.add(s)),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildStudyStyle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('LEARNING STYLE'),
        const SizedBox(height: 10),
        ...[
          ('Visual', Icons.visibility_outlined),
          ('Auditory', Icons.headphones_outlined),
          ('Kinesthetic', Icons.sports_handball_outlined),
          ('Reading/Writing', Icons.menu_book_outlined),
        ].map((pair) => _StyleOptionTile(
              icon: pair.$2,
              label: pair.$1,
              selected: _selectedLearningStyles.contains(pair.$1),
              onTap: () => setState(() =>
                  _selectedLearningStyles.contains(pair.$1)
                      ? _selectedLearningStyles.remove(pair.$1)
                      : _selectedLearningStyles.add(pair.$1)),
            )),
        const SizedBox(height: 20),
        _sectionLabel('STUDY FORMAT'),
        const SizedBox(height: 10),
        Row(
          children: ['Group', 'Individual']
              .map((s) => Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: s == 'Group' ? 8 : 0),
                      child: _LightChip(
                        label: s,
                        selected: _selectedStudyStyles.contains(s),
                        onTap: () => setState(() =>
                            _selectedStudyStyles.contains(s)
                                ? _selectedStudyStyles.remove(s)
                                : _selectedStudyStyles.add(s)),
                      ),
                    ),
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildAvailability() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionLabel('DAYS AVAILABLE'),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _dayList
              .map((day) => _LightChip(
                    label: day.substring(0, 3),
                    selected: _selectedDays.contains(day),
                    onTap: () => setState(() {
                      if (_selectedDays.contains(day)) {
                        _selectedDays.remove(day);
                        _availability.remove(day);
                      } else {
                        _selectedDays.add(day);
                        _availability[day] = {};
                      }
                    }),
                  ))
              .toList(),
        ),
        if (_selectedDays.isNotEmpty) ...[
          const SizedBox(height: 20),
          _sectionLabel('TIME BLOCKS'),
          const SizedBox(height: 10),
          ..._dayList.where((d) => _selectedDays.contains(d)).map(
                (day) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(day,
                          style: const TextStyle(
                              color: Color(0xFF6B7280),
                              fontWeight: FontWeight.w500,
                              fontFamily: 'Poppins',
                              fontSize: 13)),
                    ),
                    ..._timeList.map((time) {
                      final isSelected =
                          _availability[day]?.contains(time) ?? false;
                      return GestureDetector(
                        onTap: () => setState(() {
                          _availability.putIfAbsent(day, () => {});
                          if (_availability[day]!.contains(time)) {
                            _availability[day]!.remove(time);
                          } else {
                            _availability[day]!.add(time);
                          }
                        }),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.primary.withValues(alpha: 0.08)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: isSelected
                                    ? AppTheme.primary
                                    : AppTheme.borderLight),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected
                                    ? Icons.check_circle_rounded
                                    : Icons.circle_outlined,
                                color: isSelected
                                    ? AppTheme.primary
                                    : const Color(0xFF9CA3AF),
                                size: 18,
                              ),
                              const SizedBox(width: 12),
                              Text(time,
                                  style: TextStyle(
                                      color: isSelected
                                          ? AppTheme.primary
                                          : const Color(0xFF6B7280),
                                      fontSize: 13,
                                      fontFamily: 'Poppins')),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
        ],
      ],
    );
  }

  Widget _fieldLabel(String text) => Text(text,
      style: const TextStyle(
          color: Color(0xFF6B7280),
          fontSize: 13,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins'));

  Widget _sectionLabel(String text) => Text(text,
      style: const TextStyle(
          color: Color(0xFF9CA3AF),
          fontSize: 11,
          fontWeight: FontWeight.w500,
          fontFamily: 'Poppins',
          letterSpacing: 0.8));
}

// ── Light-themed selectable chip ───────────────────────────────────────────────
class _LightChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? selectedColor;

  const _LightChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.selectedColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = selectedColor ?? AppTheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color:
              selected ? color.withValues(alpha: 0.1) : const Color(0xFFF5F5F8),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? color : AppTheme.borderLight,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? color : const Color(0xFF6B7280),
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            fontFamily: 'Poppins',
          ),
        ),
      ),
    );
  }
}

// ── Dropdown field ─────────────────────────────────────────────────────────────
class _DropdownField extends StatelessWidget {
  final String label, hint;
  final String? value;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  const _DropdownField({
    required this.label,
    required this.hint,
    this.value,
    required this.items,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 13,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins')),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF5F5F8),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: (value != null && items.contains(value)) ? value : null,
              hint: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(hint,
                    style: const TextStyle(
                        color: Color(0xFF9CA3AF), fontFamily: 'Poppins')),
              ),
              isExpanded: true,
              dropdownColor: AppTheme.surfaceLight,
              style: const TextStyle(
                  color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              borderRadius: BorderRadius.circular(12),
              items: items
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Date picker field ──────────────────────────────────────────────────────────
class _DatePickerField extends StatelessWidget {
  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?> onChanged;

  const _DatePickerField(
      {required this.label, this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 13,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins')),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: value ?? DateTime(2000),
              firstDate: DateTime(1950),
              lastDate: DateTime.now(),
              builder: (ctx, child) => Theme(
                data: ThemeData.light().copyWith(
                    colorScheme: const ColorScheme.light(
                        primary: AppTheme.primary, surface: Colors.white)),
                child: child!,
              ),
            );
            if (picked != null) onChanged(picked);
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined,
                    color: Color(0xFF9CA3AF), size: 18),
                const SizedBox(width: 10),
                Text(
                  value != null
                      ? '${value!.month.toString().padLeft(2, '0')}/'
                          '${value!.day.toString().padLeft(2, '0')}/'
                          '${value!.year}'
                      : 'Select date',
                  style: TextStyle(
                      color: value != null
                          ? const Color(0xFF1A1A2E)
                          : const Color(0xFF9CA3AF),
                      fontFamily: 'Poppins',
                      fontSize: 14),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Style option tile ──────────────────────────────────────────────────────────
class _StyleOptionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _StyleOptionTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primary.withValues(alpha: 0.08)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: selected ? AppTheme.primary : AppTheme.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon,
                color: selected ? AppTheme.primary : const Color(0xFF9CA3AF),
                size: 20),
            const SizedBox(width: 14),
            Text(label,
                style: TextStyle(
                    color:
                        selected ? AppTheme.primary : const Color(0xFF6B7280),
                    fontWeight: FontWeight.w500,
                    fontFamily: 'Poppins',
                    fontSize: 14)),
            const Spacer(),
            AnimatedOpacity(
              duration: const Duration(milliseconds: 180),
              opacity: selected ? 1 : 0,
              child: const Icon(Icons.check_circle_rounded,
                  color: AppTheme.primary, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
