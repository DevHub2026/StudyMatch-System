import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
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
  bool _obscure = true;
  bool _remember = false;
  String _selectedRole = 'student'; // 'student' or 'tutor'

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _login() async {
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
      SnackBar(content: Text(error), backgroundColor: Colors.redAccent),
    );
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 40),

                // Logo
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                              colors: [AppTheme.primary, AppTheme.accent]),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.school_rounded,
                            color: Colors.white, size: 30),
                      ),
                      const SizedBox(height: 12),
                      RichText(
                        text: const TextSpan(
                          style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins'),
                          children: [
                            TextSpan(text: 'Study',
                                style: TextStyle(color: Colors.white)),
                            TextSpan(text: 'Match',
                                style: TextStyle(color: AppTheme.primaryLight)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text('LEARNING PLATFORM',
                          style: TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 11,
                              letterSpacing: 2,
                              fontFamily: 'Poppins')),
                    ],
                  ),
                ),

                const SizedBox(height: 36),

                const Text('Welcome back',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Poppins')),
                const SizedBox(height: 4),
                const Text('Sign in to your StudyMatch account',
                    style: TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                        fontFamily: 'Poppins')),

                const SizedBox(height: 28),

                // Role selector
                const Text('Sign in as',
                    style: TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 13,
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _RoleCard(
                        icon: Icons.school_rounded,
                        label: 'Student',
                        sublabel: 'Find tutors & study partners',
                        selected: _selectedRole == 'student',
                        onTap: () => setState(() => _selectedRole = 'student'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _RoleCard(
                        icon: Icons.co_present_rounded,
                        label: 'Tutor',
                        sublabel: 'Teach & help students',
                        selected: _selectedRole == 'tutor',
                        onTap: () => setState(() => _selectedRole = 'tutor'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Email
                _DarkField(
                  controller: _emailCtrl,
                  hint: 'you@example.com',
                  label: 'Email',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => (v == null || !v.contains('@'))
                      ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: 14),

                // Password
                _DarkField(
                  controller: _passCtrl,
                  hint: '••••••••',
                  label: 'Password',
                  icon: Icons.lock_outline,
                  obscureText: _obscure,
                  suffixIcon: IconButton(
                    icon: Icon(
                        _obscure ? Icons.visibility_off : Icons.visibility,
                        color: const Color(0xFF6B7280), size: 20),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                  validator: (v) => (v == null || v.isEmpty)
                      ? 'Enter your password' : null,
                ),

                const SizedBox(height: 14),

                // Remember me + Forgot password
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        SizedBox(
                          width: 20, height: 20,
                          child: Checkbox(
                            value: _remember,
                            onChanged: (v) =>
                                setState(() => _remember = v ?? false),
                            activeColor: AppTheme.primary,
                            checkColor: Colors.white,
                            side: const BorderSide(color: Color(0xFF374151)),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text('Remember me',
                            style: TextStyle(
                                color: Color(0xFF9CA3AF),
                                fontSize: 13,
                                fontFamily: 'Poppins')),
                      ],
                    ),
                    TextButton(
                      onPressed: () {},
                      style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                      child: Text('Forgot password?',
                          style: TextStyle(
                              color: AppTheme.primaryLight,
                              fontSize: 13,
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w500)),
                    ),
                  ],
                ),

                const SizedBox(height: 28),

                // Sign in button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(width: 20, height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('Sign in',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Poppins')),
                  ),
                ),

                const SizedBox(height: 24),

                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pushReplacement(context,
                        MaterialPageRoute(
                            builder: (_) => const SignupScreen())),
                    child: Text.rich(TextSpan(
                      text: "Don't have an account? ",
                      style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontFamily: 'Poppins',
                          fontSize: 13),
                      children: [
                        TextSpan(text: 'Create Account',
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

// ── Role card ───────────────────────────────────────────────────────────────
class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final bool selected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.primary.withValues(alpha: 0.12)
              : const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.primary : const Color(0xFF1F2937),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: selected
                    ? AppTheme.primary.withValues(alpha: 0.2)
                    : const Color(0xFF111827),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon,
                  color: selected ? AppTheme.primaryLight
                      : const Color(0xFF6B7280),
                  size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          color: selected ? Colors.white
                              : const Color(0xFF9CA3AF),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Poppins')),
                  Text(sublabel,
                      style: const TextStyle(
                          color: Color(0xFF4B5563),
                          fontSize: 10,
                          fontFamily: 'Poppins')),
                ],
              ),
            ),
            if (selected)
              Icon(Icons.radio_button_checked,
                  color: AppTheme.primary, size: 16)
            else
              const Icon(Icons.radio_button_unchecked,
                  color: Color(0xFF374151), size: 16),
          ],
        ),
      ),
    );
  }
}

// ── Dark input field ────────────────────────────────────────────────────────
class _DarkField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final String label;
  final IconData icon;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _DarkField({
    required this.controller,
    required this.hint,
    required this.label,
    required this.icon,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Color(0xFF9CA3AF),
                fontSize: 13,
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          style: const TextStyle(
              color: Colors.white, fontFamily: 'Poppins', fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
                color: Color(0xFF4B5563), fontFamily: 'Poppins', fontSize: 14),
            prefixIcon: Icon(icon, color: const Color(0xFF6B7280), size: 20),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: const Color(0xFF1A1A2E),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF1F2937)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF1F2937)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.redAccent),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.redAccent),
            ),
            errorStyle: const TextStyle(
                color: Colors.redAccent,
                fontFamily: 'Poppins',
                fontSize: 11),
          ),
        ),
      ],
    );
  }
}