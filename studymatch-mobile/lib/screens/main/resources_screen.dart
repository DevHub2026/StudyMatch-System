import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../utils/app_theme.dart';
import '../../services/app_state.dart';
import '../../models/models.dart';

class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});
  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  String _filter = 'All';
  final _searchCtrl = TextEditingController();
  final List<String> _filters = [
    'All',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'Statistics',
    'English',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().loadResources();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _search() {
    context.read<AppState>().loadResources(
          subject: _filter == 'All' ? null : _filter,
          search:
              _searchCtrl.text.trim().isEmpty ? null : _searchCtrl.text.trim(),
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Resource Library',
                            style: TextStyle(
                                color: Color(0xFF1A1A2E),
                                fontWeight: FontWeight.bold,
                                fontSize: 22,
                                fontFamily: 'Poppins'),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => _showUploadDialog(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                  colors: [AppTheme.primary, AppTheme.accent]),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(children: [
                              Icon(Icons.add, color: Colors.white, size: 16),
                              SizedBox(width: 4),
                              Text('Upload',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontFamily: 'Poppins',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600)),
                            ]),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Search bar
                    Row(children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F5F8),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: TextField(
                            controller: _searchCtrl,
                            style: const TextStyle(
                                color: Color.fromARGB(255, 255, 255, 255),
                                fontFamily: 'Poppins'),
                            decoration: const InputDecoration(
                              hintText: 'Search resources...',
                              hintStyle: TextStyle(
                                  color: Color(0xFF9CA3AF),
                                  fontFamily: 'Poppins'),
                              border: InputBorder.none,
                              icon: Icon(Icons.search,
                                  color: Color(0xFF9CA3AF), size: 20),
                            ),
                            onSubmitted: (_) => _search(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _search,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.search,
                              color: Colors.white, size: 20),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 16),

                    // Filter chips
                    SizedBox(
                      height: 36,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _filters.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) {
                          final f = _filters[i];
                          final sel = _filter == f;
                          return GestureDetector(
                            onTap: () {
                              setState(() => _filter = f);
                              context.read<AppState>().loadResources(
                                    subject: f == 'All' ? null : f,
                                    search: _searchCtrl.text.trim().isEmpty
                                        ? null
                                        : _searchCtrl.text.trim(),
                                  );
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 6),
                              decoration: BoxDecoration(
                                color: sel
                                    ? AppTheme.primary
                                    : const Color(0xFFF5F5F8),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: sel
                                        ? AppTheme.primary
                                        : AppTheme.borderLight),
                              ),
                              child: Text(f,
                                  style: TextStyle(
                                    color: sel
                                        ? Colors.white
                                        : const Color(0xFF6B7280),
                                    fontFamily: 'Poppins',
                                    fontSize: 12,
                                    fontWeight: sel
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                  )),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),

                    Text('${state.dbResources.length} Resources',
                        style: const TextStyle(
                            color: Color(0xFF9CA3AF),
                            fontSize: 13,
                            fontFamily: 'Poppins')),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // Loading / empty / list
            if (state.loadingResources)
              const SliverToBoxAdapter(
                child: Center(
                    child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppTheme.primary),
                )),
              )
            else if (state.dbResources.isEmpty)
              const SliverToBoxAdapter(
                child: Center(
                    child: Padding(
                  padding: EdgeInsets.all(40),
                  child: Column(children: [
                    Icon(Icons.library_books_outlined,
                        color: Color(0xFF9CA3AF), size: 48),
                    SizedBox(height: 16),
                    Text(
                      'No resources yet.\nBe the first to upload!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: Color(0xFF9CA3AF),
                          fontFamily: 'Poppins',
                          height: 1.5),
                    ),
                  ]),
                )),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _ResourceCard(resource: state.dbResources[i]),
                    ),
                    childCount: state.dbResources.length,
                  ),
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  // ── Upload dialog ──────────────────────────────────────────────────────────
  void _showUploadDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final authorCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    Uint8List? fileBytes;
    String? fileName;
    bool uploading = false;

    final subjectOptions = [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'History',
      'Statistics',
      'English',
    ];
    String? selectedSubject;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setS) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Sheet handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                        color: AppTheme.borderLight,
                        borderRadius: BorderRadius.circular(2)),
                  ),
                ),

                const Text('Upload Resource',
                    style: TextStyle(
                        color: Color(0xFF1A1A2E),
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        fontFamily: 'Poppins')),
                const SizedBox(height: 6),
                const Text(
                  'Please credit the original author to avoid plagiarism.',
                  style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontFamily: 'Poppins',
                      fontSize: 12,
                      height: 1.4),
                ),
                const SizedBox(height: 20),

                // ── Title ──────────────────────────────────────────────
                TextField(
                  controller: titleCtrl,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  decoration:
                      _uploadFieldDec(label: 'Title *', icon: Icons.title),
                ),
                const SizedBox(height: 12),

                // ── Subject dropdown ───────────────────────────────────
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F5F8),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: selectedSubject,
                      hint: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Row(children: [
                          Icon(Icons.book_outlined,
                              color: Color(0xFF9CA3AF), size: 20),
                          SizedBox(width: 8),
                          Text('Subject *',
                              style: TextStyle(
                                  color: Color(0xFF9CA3AF),
                                  fontFamily: 'Poppins')),
                        ]),
                      ),
                      isExpanded: true,
                      dropdownColor: AppTheme.surfaceLight,
                      style: const TextStyle(
                          color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      borderRadius: BorderRadius.circular(10),
                      items: subjectOptions
                          .map((s) => DropdownMenuItem(
                                value: s,
                                child: Text(s),
                              ))
                          .toList(),
                      onChanged: (val) => setS(() => selectedSubject = val),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // ── Author / Source ────────────────────────────────────
                TextField(
                  controller: authorCtrl,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  decoration: _uploadFieldDec(
                    label: 'Author / Source *',
                    hint: 'e.g. Juan dela Cruz, OpenStax, Khan Academy',
                    icon: Icons.person_outline,
                  ),
                ),
                const SizedBox(height: 12),

                // ── Description ────────────────────────────────────────
                TextField(
                  controller: descCtrl,
                  maxLines: 2,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  decoration: _uploadFieldDec(
                      label: 'Description (optional)', icon: Icons.notes),
                ),
                const SizedBox(height: 12),

                // ── File picker ────────────────────────────────────────
                GestureDetector(
                  onTap: () async {
                    final result = await FilePicker.platform.pickFiles(
                      type: FileType.custom,
                      allowedExtensions: [
                        'pdf',
                        'doc',
                        'docx',
                        'ppt',
                        'pptx',
                        'txt'
                      ],
                      withData: true,
                    );
                    if (result != null && result.files.single.bytes != null) {
                      setS(() {
                        fileBytes = result.files.single.bytes;
                        fileName = result.files.single.name;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: fileBytes != null
                          ? AppTheme.success.withValues(alpha: 0.08)
                          : const Color(0xFFF5F5F8),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: fileBytes != null
                              ? AppTheme.success
                              : AppTheme.borderLight),
                    ),
                    child: Row(children: [
                      Icon(
                        fileBytes != null
                            ? Icons.check_circle
                            : Icons.upload_file,
                        color: fileBytes != null
                            ? AppTheme.success
                            : const Color(0xFF9CA3AF),
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          fileName ??
                              'Tap to select file (PDF, DOC, DOCX, PPT, TXT)',
                          style: TextStyle(
                            color: fileBytes != null
                                ? AppTheme.success
                                : const Color(0xFF9CA3AF),
                            fontFamily: 'Poppins',
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 20),

                // ── Upload button ──────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (uploading ||
                            fileBytes == null ||
                            titleCtrl.text.trim().isEmpty ||
                            authorCtrl.text.trim().isEmpty ||
                            selectedSubject == null)
                        ? null
                        : () async {
                            setS(() => uploading = true);
                            final messenger = ScaffoldMessenger.of(context);
                            final result =
                                await context.read<AppState>().uploadResource(
                                      title: titleCtrl.text.trim(),
                                      subject: selectedSubject!,
                                      description: descCtrl.text.trim(),
                                      authorName: authorCtrl.text.trim(),
                                      fileBytes: fileBytes!,
                                      fileName: fileName!,
                                    );
                            if (ctx.mounted) Navigator.pop(ctx);
                            messenger.showSnackBar(SnackBar(
                              content: Text(result['success'] == true
                                  ? 'Resource uploaded!'
                                  : result['message'] ?? 'Upload failed'),
                              backgroundColor: result['success'] == true
                                  ? AppTheme.success
                                  : AppTheme.error,
                            ));
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      disabledBackgroundColor:
                          AppTheme.primary.withValues(alpha: 0.3),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: uploading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('Upload Resource',
                            style: TextStyle(
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static InputDecoration _uploadFieldDec({
    required String label,
    String? hint,
    IconData? icon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle:
          const TextStyle(color: Color(0xFF9CA3AF), fontFamily: 'Poppins'),
      hintStyle: const TextStyle(
          color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 12),
      filled: true,
      fillColor: const Color(0xFFF5F5F8),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppTheme.borderLight)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppTheme.borderLight)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
      prefixIcon: icon != null
          ? Icon(icon, color: const Color(0xFF9CA3AF), size: 20)
          : null,
    );
  }
}

// ── Resource Card ──────────────────────────────────────────────────────────────
class _ResourceCard extends StatelessWidget {
  final DBResource resource;
  const _ResourceCard({required this.resource});

  @override
  Widget build(BuildContext context) {
    final color = _subjectColor(resource.subject);
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          // File type icon block
          Container(
            width: 60,
            height: 74,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(_typeIcon(resource.fileType), color: color, size: 28),
                const SizedBox(height: 4),
                Text(
                  resource.fileType.toUpperCase(),
                  style: TextStyle(
                      color: color,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Poppins'),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  resource.title,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      fontFamily: 'Poppins'),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (resource.description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    resource.description,
                    style: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 12,
                        fontFamily: 'Poppins',
                        height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Row(children: [
                  if (resource.subject.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        resource.subject,
                        style: TextStyle(
                            color: color,
                            fontSize: 11,
                            fontFamily: 'Poppins',
                            fontWeight: FontWeight.w500),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text(
                      'by ${resource.uploaderName}',
                      style: const TextStyle(
                          color: Color(0xFF9CA3AF),
                          fontSize: 11,
                          fontFamily: 'Poppins'),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ]),
              ],
            ),
          ),

          const SizedBox(width: 8),
          if (resource.fileUrl != null)
            IconButton(
              icon: const Icon(Icons.download_outlined,
                  color: Color(0xFF9CA3AF), size: 22),
              onPressed: () => launchUrl(
                Uri.parse(resource.fileUrl!),
                mode: LaunchMode.externalApplication,
              ),
            ),
        ],
      ),
    );
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'pdf':
        return Icons.picture_as_pdf_outlined;
      case 'doc':
      case 'docx':
        return Icons.description_outlined;
      case 'ppt':
      case 'pptx':
        return Icons.slideshow_outlined;
      case 'txt':
        return Icons.text_snippet_outlined;
      default:
        return Icons.insert_drive_file_outlined;
    }
  }

  Color _subjectColor(String subject) {
    if (subject.isEmpty) return AppTheme.primary;
    const colors = [
      AppTheme.primary,
      AppTheme.accent,
      AppTheme.success,
      AppTheme.warning,
      Color(0xFF3B82F6),
      Color(0xFFEC4899),
    ];
    return colors[subject.hashCode % colors.length];
  }
}
