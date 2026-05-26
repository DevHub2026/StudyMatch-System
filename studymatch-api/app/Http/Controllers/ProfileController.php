<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Student;
use App\Models\Tutor;
use App\Models\User;
use App\Traits\MobileUserFormatter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    use MobileUserFormatter;
    /**
     * GET /profile — return the authenticated user's full profile.
     * `data` = mobile/Flutter format (flat camelCase).
     * `user` = raw Eloquent model with nested relations for web clients.
     */
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'student.weakSubjects.subject',
            'tutor.strongSubjects.subject',
            'tutor.availability',
            'tutor.reviews.student.user',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatMobileUser($user),
            'user'    => $user,
        ]);
    }

    /**
     * PUT /profile — general profile update.
     * Accepts camelCase keys sent by the Flutter mobile client.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        // ── 1. User-level fields ──────────────────────────────────────────────
        $userFields = [];

        $name = $request->input('fullName') ?? $request->input('name');
        if ($name !== null) {
            $userFields['name'] = $name;
        }

        $dob = $request->input('dateOfBirth') ?? $request->input('date_of_birth');
        if ($dob !== null) {
            try {
                $userFields['date_of_birth'] = \Carbon\Carbon::parse($dob)->format('Y-m-d');
            } catch (\Throwable $e) {
                // Ignore unparseable dates
            }
        }

        $gender = $request->input('gender');
        if ($gender !== null) {
            $normalized = $this->normalizeGender($gender);
            if ($normalized !== null) {
                $userFields['gender'] = $normalized;
            }
        }

        $bio = $request->input('bio');
        if ($bio !== null) {
            $userFields['bio'] = $bio;
        }

        $phone = $request->input('phoneNumber') ?? $request->input('phone');
        if ($phone !== null) {
            $userFields['phone'] = $phone;
        }

        $learningStyles = $request->input('learningStyles') ?? $request->input('learning_styles');
        if (is_array($learningStyles)) {
            $userFields['learning_styles'] = $learningStyles;
        }

        $studyStyles = $request->input('studyStyles') ?? $request->input('study_styles');
        if (is_array($studyStyles)) {
            $userFields['study_styles'] = $studyStyles;
        }

        // ── 2. Role change ────────────────────────────────────────────────────
        $newRole = $request->input('role');
        if ($newRole !== null && in_array($newRole, ['student', 'tutor']) && $newRole !== $user->role) {
            $userFields['role'] = $newRole;
        }

        if (!empty($userFields)) {
            $user->update($userFields);
            $user->refresh();
        }

        // Ensure sub-profile record exists for the current role
        if ($user->role === 'tutor' && !$user->tutor) {
            Tutor::create(['user_id' => $user->id]);
            $user->refresh();
        } elseif ($user->role === 'student' && !$user->student) {
            Student::create(['user_id' => $user->id]);
            $user->refresh();
        }

        // ── 3. Sub-profile fields ─────────────────────────────────────────────
        $department = $request->input('department');

        if ($user->student) {
            $studentFields = [];
            // Accept an explicit 'program' field (free-text degree name, e.g. "BS Computer Science")
            // or fall back to 'department' (college abbreviation like "CET").
            $program = $request->input('program');
            if ($program !== null) {
                $studentFields['program'] = $program;
            } elseif ($department !== null) {
                $studentFields['program'] = $department;
            }
            $yearLevel = $request->input('yearLevel') ?? $request->input('year_level');
            if ($yearLevel !== null) {
                $normalized = $this->normalizeYearLevel($yearLevel);
                if ($normalized !== null) {
                    $studentFields['year_level'] = $normalized;
                }
            }
            if ($bio !== null) {
                $studentFields['bio'] = $bio;
            }
            if (!empty($studentFields)) {
                $user->student->update($studentFields);
            }
        }

        if ($user->tutor) {
            $tutorFields = [];
            // Accept 'specialization' directly or fall back to 'department' alias
            $spec = $request->input('specialization') ?? $department;
            if ($spec !== null) $tutorFields['specialization'] = $spec;
            if ($bio !== null) $tutorFields['bio'] = $bio;

            $position = $request->input('position');
            if ($position !== null) $tutorFields['position'] = $position;

            $tutorType = $request->input('tutor_type');
            if ($tutorType !== null && in_array($tutorType, ['professor', 'instructor', 'student_tutor'])) {
                $tutorFields['tutor_type'] = $tutorType;
            }

            $credentials = $request->input('credentials');
            if ($credentials !== null) $tutorFields['credentials'] = $credentials;

            $hourlyRate = $request->input('hourly_rate');
            if ($hourlyRate !== null) $tutorFields['hourly_rate'] = $hourlyRate;

            $isAvailable = $request->input('is_available');
            if ($isAvailable !== null) $tutorFields['is_available'] = filter_var($isAvailable, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $isAvailable;

            if (!empty($tutorFields)) {
                $user->tutor->update($tutorFields);
            }
        }

        // ── 4. Subjects / Strengths / Weaknesses ──────────────────────────────
        if ($user->student) {
            // Flutter sends weaknesses = subjects the student needs help with.
            // Fall back to subjects array if weaknesses is not provided.
            $names = $request->input('weaknesses') ?? $request->input('subjects');
            if (is_array($names)) {
                $this->saveStudentSubjects($user->student, $names);
            }
        }

        if ($user->tutor) {
            // Flutter sends strengths = subjects the tutor can teach.
            // Fall back to subjects array if strengths is not provided.
            $names = $request->input('strengths') ?? $request->input('subjects');
            if (is_array($names)) {
                $this->saveTutorSubjects($user->tutor, $names);
            }
        }

        // ── 5. Availability (tutors) ──────────────────────────────────────────
        $availability = $request->input('availability');
        if ($user->tutor && is_array($availability)) {
            $this->saveTutorAvailability($user->tutor, $availability);
        }

        // ── 6. Return formatted response ──────────────────────────────────────
        $fresh = $user->fresh()->load([
            'student.weakSubjects.subject',
            'tutor.strongSubjects.subject',
            'tutor.availability',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => $this->formatMobileUser($fresh),
        ]);
    }

    /**
     * PUT /profile/step-1 — basic info: name + bio
     */
    public function step1(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio'  => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $user->update(['name' => $request->name]);

        if ($user->student) {
            $user->student->update(['bio' => $request->bio]);
        } elseif ($user->tutor) {
            $user->tutor->update(['bio' => $request->bio]);
        }

        return response()->json(['message' => 'Step 1 saved.', 'user' => $user->fresh()->load(['student', 'tutor'])]);
    }

    /**
     * PUT /profile/step-2 — academic / professional info
     */
    public function step2(Request $request)
    {
        $user = $request->user();

        if ($user->student) {
            $request->validate([
                'student_id' => 'nullable|string|max:50',
                'program'    => 'nullable|string|max:255',
                'year_level' => 'nullable|string|in:1st,2nd,3rd,4th,5th',
            ]);
            $user->student->update($request->only(['student_id', 'program', 'year_level']));
        } elseif ($user->tutor) {
            $request->validate([
                'employee_id'    => 'nullable|string|max:50',
                'position'       => 'nullable|string|max:255',
                'tutor_type'     => 'nullable|in:professor,instructor,student_tutor',
                'specialization' => 'nullable|string|max:255',
                'hourly_rate'    => 'nullable|numeric|min:0',
                'credentials'    => 'nullable|string|max:2000',
            ]);
            $user->tutor->update($request->only(['employee_id', 'position', 'tutor_type', 'specialization', 'hourly_rate', 'credentials']));
        }

        return response()->json(['message' => 'Step 2 saved.', 'user' => $user->fresh()->load(['student', 'tutor'])]);
    }

    /**
     * PUT /profile/step-3 — subjects
     */
    public function step3(Request $request)
    {
        $user = $request->user();

        if ($user->student) {
            $request->validate([
                'subjects'                    => 'nullable|array',
                'subjects.*.subject_id'       => 'required|exists:subjects,id',
                'subjects.*.difficulty_level' => 'required|in:moderate,difficult,very_difficult',
            ]);

            if ($request->has('subjects')) {
                $user->student->weakSubjects()->delete();
                foreach ($request->subjects as $item) {
                    $user->student->weakSubjects()->create([
                        'subject_id'       => $item['subject_id'],
                        'difficulty_level' => $item['difficulty_level'],
                        'needs_help'       => true,
                    ]);
                }
            }
        } elseif ($user->tutor) {
            $request->validate([
                'subjects'                   => 'nullable|array',
                'subjects.*.subject_id'      => 'required|exists:subjects,id',
                'subjects.*.expertise_level' => 'nullable|string|max:100',
                'subjects.*.years_teaching'  => 'nullable|integer|min:0',
            ]);

            if ($request->has('subjects')) {
                $user->tutor->strongSubjects()->delete();
                foreach ($request->subjects as $item) {
                    $user->tutor->strongSubjects()->create([
                        'subject_id'      => $item['subject_id'],
                        'expertise_level' => $item['expertise_level'] ?? 'competent',
                        'years_teaching'  => $item['years_teaching'] ?? 0,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Step 3 saved.', 'user' => $user->fresh()->load(['student.weakSubjects.subject', 'tutor.strongSubjects.subject'])]);
    }

    /**
     * PUT /profile/step-4 — availability (tutors)
     */
    public function step4(Request $request)
    {
        $user = $request->user();

        if ($user->tutor) {
            $request->validate([
                'availability'              => 'nullable|array',
                'availability.*.day'        => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'availability.*.start_time' => 'required|date_format:H:i',
                'availability.*.end_time'   => 'required|date_format:H:i',
            ]);

            if ($request->has('availability')) {
                $user->tutor->availability()->delete();
                foreach ($request->availability as $slot) {
                    $user->tutor->availability()->create([
                        'day_of_week' => $slot['day'],
                        'start_time'  => $slot['start_time'],
                        'end_time'    => $slot['end_time'],
                        'is_active'   => true,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Step 4 saved.', 'user' => $user->fresh()->load(['student', 'tutor.availability'])]);
    }

    /**
     * PUT /profile/password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    /**
     * POST /profile/avatar — upload profile photo (multipart)
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:5120',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $path = $file->store('avatars', 'public');
        $url  = Storage::disk('public')->url($path);

        $user->update(['avatar' => $url]);

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully.',
            'url'     => $url,
        ]);
    }

    /**
     * POST /profile/avatar-base64 — upload profile photo as base64 JSON.
     * Used by Flutter Web to avoid CORS preflight on multipart requests.
     */
    public function uploadAvatarBase64(Request $request)
    {
        $request->validate([
            'photo'    => 'required|string',
            'fileName' => 'required|string|max:255',
            'mimeType' => 'nullable|string|max:100',
        ]);

        $user = $request->user();

        try {
            $photoData = base64_decode($request->photo, true);
            if ($photoData === false) {
                return response()->json(['success' => false, 'message' => 'Invalid base64 data.'], 422);
            }

            $ext      = pathinfo($request->fileName, PATHINFO_EXTENSION) ?: 'jpg';
            $filename = 'avatars/profile_' . $user->id . '_' . time() . '.' . $ext;
            Storage::disk('public')->put($filename, $photoData);
            $url = Storage::disk('public')->url($filename);

            $user->update(['avatar' => $url]);

            return response()->json([
                'success' => true,
                'message' => 'Avatar uploaded successfully.',
                'url'     => $url,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /profile/complete — mark onboarding as done.
     * The Flutter client calls PUT /profile first (which saves all data),
     * then calls this endpoint to flip profile_completed = true.
     */
    public function complete(Request $request)
    {
        $user = $request->user();

        $user->update(['profile_completed' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Profile completed.',
            'data'    => $this->formatMobileUser($user->fresh()->load([
                'student.weakSubjects.subject',
                'tutor.strongSubjects.subject',
                'tutor.availability',
            ])),
        ]);
    }

    /**
     * DELETE /profile/delete-account
     */
    public function deleteAccount(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Password is incorrect.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Account deleted successfully.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Convert gender string from Flutter (e.g. "Male", "Non-Binary") to DB enum value.
     */
    private function normalizeGender(?string $gender): ?string
    {
        if ($gender === null) return null;

        return match (strtolower(trim($gender))) {
            'male'              => 'male',
            'female'            => 'female',
            'non-binary',
            'non binary',
            'nonbinary',
            'other'             => 'other',
            'prefer not to say',
            'prefer_not_to_say' => 'prefer_not_to_say',
            default             => null,
        };
    }

    /**
     * Normalize year level value to DB enum ('1st'–'5th').
     */
    private function normalizeYearLevel($value): ?string
    {
        if ($value === null) return null;

        $map = [
            '1' => '1st', '1st' => '1st',
            '2' => '2nd', '2nd' => '2nd',
            '3' => '3rd', '3rd' => '3rd',
            '4' => '4th', '4th' => '4th',
            '5' => '5th', '5th' => '5th',
        ];

        return $map[(string) $value] ?? null;
    }

    /**
     * Sync a student's weak subjects from an array of subject names.
     * Uses firstOrCreate so seeded subjects are reused and unknown ones are added.
     */
    private function saveStudentSubjects(\App\Models\Student $student, array $names): void
    {
        $student->weakSubjects()->delete();

        foreach (array_filter($names) as $name) {
            $subject = Subject::firstOrCreate(
                ['name' => $name],
                ['code' => strtoupper(preg_replace('/\s+/', '_', trim($name)))]
            );
            $student->weakSubjects()->create([
                'subject_id'       => $subject->id,
                'difficulty_level' => 'moderate',
                'needs_help'       => true,
            ]);
        }
    }

    /**
     * Sync a tutor's strong subjects from an array of subject names.
     */
    private function saveTutorSubjects(\App\Models\Tutor $tutor, array $names): void
    {
        $tutor->strongSubjects()->delete();

        foreach (array_filter($names) as $name) {
            $subject = Subject::firstOrCreate(
                ['name' => $name],
                ['code' => strtoupper(preg_replace('/\s+/', '_', trim($name)))]
            );
            $tutor->strongSubjects()->create([
                'subject_id'      => $subject->id,
                'expertise_level' => 'competent',
            ]);
        }
    }

    /**
     * Save tutor availability from Flutter's map format:
     *   { "Monday": ["Morning (6am-12pm)", "Evening (6pm-9pm)"], ... }
     */
    private function saveTutorAvailability(\App\Models\Tutor $tutor, array $availability): void
    {
        $timeBlocks = [
            'Morning (6am-12pm)'   => ['06:00', '12:00'],
            'Afternoon (12pm-6pm)' => ['12:00', '18:00'],
            'Evening (6pm-9pm)'    => ['18:00', '21:00'],
            'Night (9pm-6am)'      => ['21:00', '06:00'],
        ];

        $tutor->availability()->delete();

        foreach ($availability as $day => $blocks) {
            if (!is_array($blocks)) continue;
            foreach ($blocks as $block) {
                if (!isset($timeBlocks[$block])) continue;
                [$start, $end] = $timeBlocks[$block];
                $tutor->availability()->create([
                    'day_of_week' => strtolower($day),
                    'start_time'  => $start,
                    'end_time'    => $end,
                    'is_active'   => true,
                ]);
            }
        }
    }

}
