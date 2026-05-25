import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/app_state.dart';
import 'signup_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _obscurePass = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _signIn() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final error = await context.read<AppState>().signIn(
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppTheme.error),
      );
    } else {
      Navigator.of(context).pop();
    }
  }

  void _forgotPassword() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceLight,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _ForgotPasswordSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new,
                      color: Color(0xFF1A1A2E)),
                  onPressed: () => Navigator.pop(context),
                ),
                const SizedBox(height: 32),
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                              colors: [AppTheme.primary, AppTheme.accent]),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: const Icon(Icons.school_rounded,
                            color: Colors.white, size: 34),
                      ),
                      const SizedBox(height: 16),
                      const Text('Welcome Back',
                          style: TextStyle(
                              color: Color(0xFF1A1A2E),
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins')),
                      const SizedBox(height: 6),
                      const Text('Sign in to continue your learning journey',
                          style: TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 14,
                              fontFamily: 'Poppins')),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                const _FieldLabel('Email'),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  validator: (v) => (v == null || !v.contains('@'))
                      ? 'Enter a valid email'
                      : null,
                  decoration: lightInputDecoration(
                      hint: 'your@email.com', icon: Icons.email_outlined),
                ),
                const SizedBox(height: 20),
                const _FieldLabel('Password'),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscurePass,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  validator: (v) => (v == null || v.length < 6)
                      ? 'Password must be at least 6 characters'
                      : null,
                  decoration: lightInputDecoration(
                    hint: '••••••••',
                    icon: Icons.lock_outline,
                  ).copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(
                          _obscurePass
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: const Color(0xFF9CA3AF),
                          size: 20),
                      onPressed: () =>
                          setState(() => _obscurePass = !_obscurePass),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _forgotPassword,
                    child: const Text('Forgot Password?',
                        style: TextStyle(
                            color: AppTheme.primaryLight,
                            fontFamily: 'Poppins')),
                  ),
                ),
                const SizedBox(height: 16),
                GradientButton(
                  text: 'Sign In',
                  onPressed: _signIn,
                  isLoading: _loading,
                ),
                const SizedBox(height: 40),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const SignupScreen()),
                    ),
                    child: const Text.rich(TextSpan(
                      text: "Don't have an account? ",
                      style: TextStyle(
                          color: Color(0xFF6B7280), fontFamily: 'Poppins'),
                      children: [
                        TextSpan(
                            text: 'Sign Up',
                            style: TextStyle(
                                color: AppTheme.primaryLight,
                                fontWeight: FontWeight.w600)),
                      ],
                    )),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Shared light-theme input helpers ─────────────────────────────────────────

InputDecoration lightInputDecoration({required String hint, IconData? icon}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(
        color: Color(0xFF9CA3AF), fontFamily: 'Poppins', fontSize: 14),
    prefixIcon: icon != null
        ? Icon(icon, color: const Color(0xFF9CA3AF), size: 20)
        : null,
    filled: true,
    fillColor: const Color(0xFFF5F5F8),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
    enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE8E8EF))),
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

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
            color: Color(0xFF374151),
            fontSize: 13,
            fontWeight: FontWeight.w500,
            fontFamily: 'Poppins'),
      );
}

// ── Forgot Password Bottom Sheet ──────────────────────────────────────────────
class _ForgotPasswordSheet extends StatefulWidget {
  const _ForgotPasswordSheet();
  @override
  State<_ForgotPasswordSheet> createState() => _ForgotPasswordSheetState();
}

class _ForgotPasswordSheetState extends State<_ForgotPasswordSheet> {
  final _emailCtrl = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Please enter a valid email address.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      final result = await context.read<AppState>().forgotPassword(email);
      if (mounted) {
        setState(() {
          _sending = false;
          if (result['success'] == true) {
            _sent = true;
          } else {
            _error = result['message'] as String? ?? 'Something went wrong.';
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _sending = false;
          _error = 'Network error: $e';
        });
      }
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
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE8E8EF),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
                border:
                    Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
              ),
              child: const Icon(Icons.lock_reset_rounded,
                  color: AppTheme.primary, size: 30),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text('Forgot Password?',
                style: TextStyle(
                    color: Color(0xFF1A1A2E),
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Poppins')),
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text("Enter your email and we'll send you a reset link.",
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Color(0xFF6B7280),
                    fontFamily: 'Poppins',
                    fontSize: 13)),
          ),
          const SizedBox(height: 24),
          if (_sent) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border:
                    Border.all(color: AppTheme.success.withValues(alpha: 0.25)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle_outline,
                      color: AppTheme.success, size: 22),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Reset link sent! Check your inbox and follow the instructions.',
                      style: TextStyle(
                          color: AppTheme.success,
                          fontFamily: 'Poppins',
                          fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Done',
                    style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w600,
                        color: Colors.white)),
              ),
            ),
          ] else ...[
            if (_error != null) ...[
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.error.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border:
                      Border.all(color: AppTheme.error.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppTheme.error, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_error!,
                          style: const TextStyle(
                              color: AppTheme.error,
                              fontFamily: 'Poppins',
                              fontSize: 12)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            const _FieldLabel('Email Address'),
            const SizedBox(height: 6),
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              style: const TextStyle(
                  color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
              decoration: lightInputDecoration(
                  hint: 'your@email.com', icon: Icons.email_outlined),
            ),
            const SizedBox(height: 20),
            GradientButton(
              text: 'Send Reset Link',
              onPressed: _send,
              isLoading: _sending,
              icon: Icons.send_rounded,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel',
                    style: TextStyle(
                        color: Color(0xFF9CA3AF), fontFamily: 'Poppins')),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
