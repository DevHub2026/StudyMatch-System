import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:studymatch/screens/auth/login_screen.dart';
import 'services/app_state.dart';
import 'utils/app_theme.dart';
import 'screens/landing_screen.dart';
import 'screens/onboarding/onboarding_flow.dart';
import 'screens/main/main_shell.dart';
import 'screens/auth/tutor_pending_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations(
      [DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: AppTheme.surfaceLight,
    systemNavigationBarIconBrightness: Brightness.dark,
  ));
  runApp(const StudyMatchApp());
}

class StudyMatchApp extends StatelessWidget {
  const StudyMatchApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: Consumer<AppState>(
        builder: (_, state, __) => MaterialApp(
          title: 'StudyMatch',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: state.themeMode,
          home: const AppRouter(),
        ),
      ),
    );
  }
}

class AppRouter extends StatelessWidget {
  const AppRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    // switch (state.authState) {
    //   case AuthState.unauthenticated:
    //     return const LandingScreen();
    //   case AuthState.onboarding:
    //     return const OnboardingFlow();
    //   case AuthState.authenticated:
    //     return const MainShell();
    switch (state.authState) {
      case AuthState.unauthenticated:
        return const LoginScreen();
      case AuthState.onboarding:
        return const OnboardingFlow();
      case AuthState.tutorPending:
        return const TutorPendingScreen();
      case AuthState.authenticated:
        return state.landingSeen ? const MainShell() : const LandingScreen();
    }
  }
}
