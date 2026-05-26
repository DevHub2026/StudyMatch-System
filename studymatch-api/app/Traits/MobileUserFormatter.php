<?php

namespace App\Traits;

use App\Models\User;

trait MobileUserFormatter
{
    protected function formatMobileUser(User $user): array
    {
        $weakNames   = [];
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
            'phoneNumber'        => $user->phone,
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
            'learningStyles'     => $user->learning_styles ?? [],
            'studyStyles'        => $user->study_styles ?? [],
            'availability'       => $this->buildAvailability($user),
            'strengths'          => $user->isTutor() ? $strongNames : [],
            'weaknesses'         => $user->isStudent() ? $weakNames : [],
            'onboardingComplete' => (bool) $user->profile_completed,
            'rating'             => (float) ($user->tutor?->average_rating ?? 0),
            'ratingCount'        => (int) ($user->tutor?->reviews_count ?? $user->tutor?->total_sessions ?? 0),
        ];
    }

    protected function buildAvailability(User $user): array|\stdClass
    {
        if (!$user->tutor || $user->tutor->availability->isEmpty()) {
            return (object) [];
        }

        $blockMap = [
            '06:00-12:00' => 'Morning (6am-12pm)',
            '12:00-18:00' => 'Afternoon (12pm-6pm)',
            '18:00-21:00' => 'Evening (6pm-9pm)',
            '21:00-06:00' => 'Night (9pm-6am)',
        ];

        $result = [];
        foreach ($user->tutor->availability as $slot) {
            $day   = ucfirst($slot->day_of_week);
            $key   = substr($slot->start_time, 0, 5) . '-' . substr($slot->end_time, 0, 5);
            $block = $blockMap[$key] ?? null;
            if ($block) {
                $result[$day][] = $block;
            }
        }

        return empty($result) ? (object) [] : $result;
    }
}
