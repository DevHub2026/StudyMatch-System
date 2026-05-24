<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        if ($request->filled('fullName') && !$request->filled('name')) {
            $request->merge(['name' => $request->input('fullName')]);
        }

        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'sometimes|same:password',
            'role'     => 'sometimes|in:student,tutor',
        ]);

        $role = $request->input('role', 'student');

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $role,
        ]);

        if ($role === 'tutor') {
            Tutor::create(['user_id' => $user->id]);
        } else {
            Student::create(['user_id' => $user->id]);
        }

        // Generate and cache a 6-digit OTP for 10 minutes
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('otp_' . $user->email, $otp, now()->addMinutes(10));

        // Send OTP email
        Mail::raw("Your StudyMatch verification code is: $otp\n\nThis code expires in 10 minutes.", function ($m) use ($user) {
            $m->to($user->email)
              ->subject('StudyMatch - Email Verification Code');
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => [
                'id'    => (string) $user->id,
                'token' => $token,
                'user'  => $user->load(['student', 'tutor']),
            ],
            'user'    => $user->load(['student', 'tutor']),
            'token'   => $token,
        ], 201);
    }

    /**
     * POST /auth/send-otp — public (mobile legacy: send_otp)
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name'  => 'nullable|string|max:255',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found for this email.',
            ], 404);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'success' => true,
                'message' => 'Email is already verified.',
            ]);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('otp_' . $user->email, $otp, now()->addMinutes(10));

        Mail::raw("Your StudyMatch verification code is: $otp\n\nThis code expires in 10 minutes.", function ($m) use ($user) {
            $m->to($user->email)->subject('StudyMatch - Email Verification Code');
        });

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully',
        ]);
    }

    /**
     * POST /auth/verify-otp — public (mobile legacy: verify_otp)
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No account found for this email.',
            ], 404);
        }

        $cachedOtp = Cache::get('otp_' . $user->email);
        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP',
            ], 401);
        }

        $user->email_verified_at = now();
        $user->save();
        Cache::forget('otp_' . $user->email);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully',
        ]);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $cachedOtp = Cache::get('otp_' . $user->email);

        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        // Mark email as verified
        $user->email_verified_at = now();
        $user->save();

        // Clear OTP from cache
        Cache::forget('otp_' . $user->email);

        return response()->json([
            'message' => 'Email verified successfully.',
        ]);
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 422);
        }

        // Generate new OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('otp_' . $user->email, $otp, now()->addMinutes(10));

        Mail::raw("Your StudyMatch verification code is: $otp\n\nThis code expires in 10 minutes.", function ($m) use ($user) {
            $m->to($user->email)
              ->subject('StudyMatch - Email Verification Code');
        });

        return response()->json([
            'message' => 'Verification code resent successfully.',
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $loaded = $user->load([
            'student.weakSubjects.subject',
            'tutor.strongSubjects.subject',
            'tutor.availability',
            'tutor' => fn ($q) => $q->withCount('reviews'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data'    => $this->formatMobileUser($loaded),
            'token'   => $token,
            'user'    => $loaded,
        ]);
    }

    /**
     * Shape user payload for mobile clients (legacy PHP api.php formatUser).
     */
    private function formatMobileUser(User $user): array
    {
        $weakNames = [];
        $strongNames = [];

        if ($user->student) {
            $weakNames = $user->student->weakSubjects
                ->map(fn ($ws) => $ws->subject?->name)
                ->filter()
                ->values()
                ->all();
        }

        if ($user->tutor) {
            $strongNames = $user->tutor->strongSubjects
                ->map(fn ($ts) => $ts->subject?->name)
                ->filter()
                ->values()
                ->all();
        }

        return [
            'id'                 => (string) $user->id,
            'fullName'           => $user->name,
            'email'              => $user->email,
            'profilePhotoUrl'    => $user->avatar,
            'school'             => null,
            'department'         => $user->student?->program ?? $user->tutor?->specialization,
            'topic'              => null,
            'yearLevel'          => $user->student?->year_level,
            'dateOfBirth'        => $user->date_of_birth?->format('Y-m-d'),
            'gender'             => $user->gender,
            'bio'                => $user->bio ?? $user->student?->bio ?? $user->tutor?->bio,
            'role'               => $user->role,
            'subjects'           => $user->isStudent() ? $weakNames : $strongNames,
            'learningStyles'     => [],
            'studyStyles'        => [],
            'availability'       => (object) [],
            'strengths'          => $user->isTutor() ? $strongNames : [],
            'weaknesses'         => $user->isStudent() ? $weakNames : [],
            'onboardingComplete' => (bool) $user->profile_completed,
            'rating'             => (float) ($user->tutor?->average_rating ?? 0),
            'ratingCount'        => (int) ($user->tutor?->reviews_count ?? $user->tutor?->total_sessions ?? 0),
        ];
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load(['student', 'tutor']),
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Always return success to avoid user enumeration
        if (!$user) {
            return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
        }

        $token = Str::random(64);
        Cache::put('pwd_reset_' . $user->email, $token, now()->addMinutes(60));

        Mail::raw(
            "Your StudyMatch password reset code is: {$token}\n\nThis code expires in 60 minutes.",
            fn($m) => $m->to($user->email)->subject('StudyMatch - Password Reset')
        );

        return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();
        $cached = Cache::get('pwd_reset_' . $user->email);

        if (!$cached || $cached !== $request->token) {
            return response()->json(['message' => 'Invalid or expired reset token.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        Cache::forget('pwd_reset_' . $user->email);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully. Please log in.']);
    }
}