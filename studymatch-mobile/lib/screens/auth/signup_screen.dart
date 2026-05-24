import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/app_state.dart';
import 'login_screen.dart';
import 'otp_verification_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey         = GlobalKey<FormState>();
  final _nameCtrl        = TextEditingController();
  final _emailCtrl       = TextEditingController();
  final _passCtrl        = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _loading      = false;
  bool _agreed       = false;
  bool _obscurePass  = true;
  bool _obscureConf  = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  void _signUp() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the Terms of Service'),
          backgroundColor: AppTheme.error,
        ),
      );
      return;
    }
    setState(() => _loading = true);
    final error = await context.read<AppState>().signUp(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppTheme.error),
      );
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => OtpVerificationScreen(
          email: _emailCtrl.text.trim(),
          name: _nameCtrl.text.trim(),
        ),
      ),
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
                const SizedBox(height: 24),
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
                      const Text(
                        'Create Account',
                        style: TextStyle(
                          color: Color(0xFF1A1A2E),
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Join thousands of students on their learning journey',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 13,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 36),

                const _FieldLabel('Full Name'),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nameCtrl,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  validator: (v) => (v == null || v.trim().length < 2)
                      ? 'Enter your full name'
                      : null,
                  decoration: lightInputDecoration(
                      hint: 'Juan dela Cruz',
                      icon: Icons.person_outline),
                ),
                const SizedBox(height: 16),

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
                      hint: 'your@email.com',
                      icon: Icons.email_outlined),
                ),
                const SizedBox(height: 16),

                const _FieldLabel('Password'),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscurePass,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  validator: (v) => (v == null || v.length < 8)
                      ? 'Password must be at least 8 characters'
                      : null,
                  decoration: lightInputDecoration(
                    hint: 'At least 8 characters',
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
                const SizedBox(height: 16),

                const _FieldLabel('Confirm Password'),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _confirmPassCtrl,
                  obscureText: _obscureConf,
                  style: const TextStyle(
                      color: Color(0xFF1A1A2E), fontFamily: 'Poppins'),
                  validator: (v) =>
                      v != _passCtrl.text ? 'Passwords do not match' : null,
                  decoration: lightInputDecoration(
                    hint: 'Re-enter password',
                    icon: Icons.lock_outline,
                  ).copyWith(
                    suffixIcon: IconButton(
                      icon: Icon(
                          _obscureConf
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: const Color(0xFF9CA3AF),
                          size: 20),
                      onPressed: () =>
                          setState(() => _obscureConf = !_obscureConf),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _agreed,
                      onChanged: (v) =>
                          setState(() => _agreed = v ?? false),
                      activeColor: AppTheme.primary,
                      checkColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: const Text.rich(
                          TextSpan(
                            text: 'I agree to the ',
                            style: TextStyle(
                              color: Color(0xFF6B7280),
                              fontFamily: 'Poppins',
                              fontSize: 13,
                            ),
                            children: [
                              TextSpan(
                                text: 'Terms of Service',
                                style: TextStyle(
                                  color: AppTheme.primaryLight,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              TextSpan(text: ' and '),
                              TextSpan(
                                text: 'Privacy Policy',
                                style: TextStyle(
                                  color: AppTheme.primaryLight,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                GradientButton(
                  text: 'Create Account',
                  onPressed: _signUp,
                  isLoading: _loading,
                ),
                const SizedBox(height: 32),

                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    ),
                    child: const Text.rich(
                      TextSpan(
                        text: 'Already have an account? ',
                        style: TextStyle(
                          color: Color(0xFF6B7280),
                          fontFamily: 'Poppins',
                        ),
                        children: [
                          TextSpan(
                            text: 'Sign In',
                            style: TextStyle(
                              color: AppTheme.primaryLight,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
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
