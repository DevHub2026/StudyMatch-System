<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ── 1. Subjects ───────────────────────────────────────────────────────
        $subjectData = [
            ['name' => 'Mathematics',      'code' => 'MATH101'],
            ['name' => 'Physics',           'code' => 'PHYS101'],
            ['name' => 'Chemistry',         'code' => 'CHEM101'],
            ['name' => 'Biology',           'code' => 'BIO101'],
            ['name' => 'Computer Science',  'code' => 'CS101'],
            ['name' => 'English',           'code' => 'ENG101'],
            ['name' => 'Statistics',        'code' => 'STAT101'],
            ['name' => 'Programming',       'code' => 'PROG101'],
            ['name' => 'Calculus',          'code' => 'CALC101'],
            ['name' => 'Algebra',           'code' => 'ALG101'],
        ];

        foreach ($subjectData as $s) {
            DB::table('subjects')->updateOrInsert(['code' => $s['code']], array_merge($s, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        $subjects = DB::table('subjects')->pluck('id', 'code');

        // ── 2. Test Tutors ────────────────────────────────────────────────────
        $tutorProfiles = [
            [
                'name'     => 'Dr. Maria Santos',
                'email'    => 'tutor1@test.com',
                'username' => 'tutor1',
                'bio'      => 'PhD in Mathematics with 8 years of teaching experience. Specializes in Calculus and Algebra.',
                'subjects' => ['MATH101', 'CALC101', 'ALG101'],
                'position' => 'Associate Professor',
                'rating'   => 4.8,
            ],
            [
                'name'     => 'Prof. James Reyes',
                'email'    => 'tutor2@test.com',
                'username' => 'tutor2',
                'bio'      => 'Computer Science instructor with industry experience in software development. Loves helping students debug code.',
                'subjects' => ['CS101', 'PROG101'],
                'position' => 'Instructor',
                'rating'   => 4.5,
            ],
            [
                'name'     => 'Dr. Lisa Cruz',
                'email'    => 'tutor3@test.com',
                'username' => 'tutor3',
                'bio'      => 'Physics and Chemistry professor. Makes complex concepts easy to understand through real-world examples.',
                'subjects' => ['PHYS101', 'CHEM101'],
                'position' => 'Professor',
                'rating'   => 4.6,
            ],
            [
                'name'     => 'Prof. Aaron Lim',
                'email'    => 'tutor4@test.com',
                'username' => 'tutor4',
                'bio'      => 'Statistics expert. Passionate about data analysis and helping students overcome math anxiety.',
                'subjects' => ['STAT101', 'MATH101'],
                'position' => 'Assistant Professor',
                'rating'   => 4.3,
            ],
            [
                'name'     => 'Ms. Carla Ramos',
                'email'    => 'tutor5@test.com',
                'username' => 'tutor5',
                'bio'      => 'English tutor and communication skills coach. Helps students with academic writing and public speaking.',
                'subjects' => ['ENG101'],
                'position' => 'Instructor',
                'rating'   => 4.7,
            ],
        ];

        $tutorIds = []; // tutor model ID indexed by email

        foreach ($tutorProfiles as $i => $tp) {
            // Upsert user
            $existingUser = DB::table('users')->where('email', $tp['email'])->first();
            if ($existingUser) {
                $userId = $existingUser->id;
                DB::table('users')->where('id', $userId)->update([
                    'name'              => $tp['name'],
                    'username'          => $tp['username'],
                    'role'              => 'tutor',
                    'bio'               => $tp['bio'],
                    'profile_completed' => true,
                    'email_verified_at' => $now,
                    'password'          => Hash::make('password'),
                    'updated_at'        => $now,
                ]);
            } else {
                $userId = DB::table('users')->insertGetId([
                    'name'              => $tp['name'],
                    'email'             => $tp['email'],
                    'username'          => $tp['username'],
                    'password'          => Hash::make('password'),
                    'role'              => 'tutor',
                    'bio'               => $tp['bio'],
                    'profile_completed' => true,
                    'email_verified_at' => $now,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }

            // Upsert tutor profile
            $existingTutor = DB::table('tutors')->where('user_id', $userId)->first();
            if ($existingTutor) {
                $tutorId = $existingTutor->id;
                DB::table('tutors')->where('id', $tutorId)->update([
                    'position'            => $tp['position'],
                    'tutor_type'          => 'professor',
                    'specialization'      => implode(', ', $tp['subjects']),
                    'bio'                 => $tp['bio'],
                    'verification_status' => 'approved',
                    'verified_at'         => $now,
                    'average_rating'      => $tp['rating'],
                    'is_available'        => true,
                    'hourly_rate'         => 150.00,
                    'updated_at'          => $now,
                ]);
            } else {
                $tutorId = DB::table('tutors')->insertGetId([
                    'user_id'             => $userId,
                    'employee_id'         => 'EMP-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                    'position'            => $tp['position'],
                    'tutor_type'          => 'professor',
                    'specialization'      => implode(', ', $tp['subjects']),
                    'bio'                 => $tp['bio'],
                    'verification_status' => 'approved',
                    'verified_at'         => $now,
                    'average_rating'      => $tp['rating'],
                    'total_sessions'      => rand(5, 30),
                    'is_available'        => true,
                    'hourly_rate'         => 150.00,
                    'created_at'          => $now,
                    'updated_at'          => $now,
                ]);
            }

            // Tutor subjects
            foreach ($tp['subjects'] as $j => $code) {
                if (!isset($subjects[$code])) continue;
                DB::table('tutor_subjects')->updateOrInsert(
                    ['tutor_id' => $tutorId, 'subject_id' => $subjects[$code]],
                    [
                        'expertise_level'      => 'expert',
                        'is_primary_expertise' => $j === 0,
                        'years_teaching'       => rand(2, 8),
                        'updated_at'           => $now,
                        'created_at'           => $now,
                    ]
                );
            }

            $tutorIds[$tp['email']] = ['tutor_id' => $tutorId, 'user_id' => $userId];
        }

        // ── 3. Test Students ──────────────────────────────────────────────────
        $studentProfiles = [
            [
                'name'           => 'Juan dela Cruz',
                'email'          => 'student1@test.com',
                'username'       => 'student1',
                'bio'            => '3rd year BSCS student struggling with math subjects.',
                'program'        => 'BS Computer Science',
                'year_level'     => '3rd',
                'weak_subjects'  => ['MATH101', 'CALC101'],
            ],
            [
                'name'           => 'Ana Reyes',
                'email'          => 'student2@test.com',
                'username'       => 'student2',
                'bio'            => 'Pre-med student needing help in Chemistry and Biology.',
                'program'        => 'BS Biology',
                'year_level'     => '2nd',
                'weak_subjects'  => ['CHEM101', 'PHYS101'],
            ],
            [
                'name'           => 'Mark Gomez',
                'email'          => 'student3@test.com',
                'username'       => 'student3',
                'bio'            => 'Engineering freshman looking for a Statistics tutor.',
                'program'        => 'BS Civil Engineering',
                'year_level'     => '1st',
                'weak_subjects'  => ['STAT101', 'ALG101'],
            ],
        ];

        $studentIds = []; // student model ID indexed by email

        foreach ($studentProfiles as $i => $sp) {
            $existingUser = DB::table('users')->where('email', $sp['email'])->first();
            if ($existingUser) {
                $userId = $existingUser->id;
                DB::table('users')->where('id', $userId)->update([
                    'name'              => $sp['name'],
                    'username'          => $sp['username'],
                    'role'              => 'student',
                    'bio'               => $sp['bio'],
                    'profile_completed' => true,
                    'email_verified_at' => $now,
                    'password'          => Hash::make('password'),
                    'updated_at'        => $now,
                ]);
            } else {
                $userId = DB::table('users')->insertGetId([
                    'name'              => $sp['name'],
                    'email'             => $sp['email'],
                    'username'          => $sp['username'],
                    'password'          => Hash::make('password'),
                    'role'              => 'student',
                    'bio'               => $sp['bio'],
                    'profile_completed' => true,
                    'email_verified_at' => $now,
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }

            $existingStudent = DB::table('students')->where('user_id', $userId)->first();
            if ($existingStudent) {
                $studentId = $existingStudent->id;
                DB::table('students')->where('id', $studentId)->update([
                    'program'    => $sp['program'],
                    'year_level' => $sp['year_level'],
                    'bio'        => $sp['bio'],
                    'updated_at' => $now,
                ]);
            } else {
                $studentId = DB::table('students')->insertGetId([
                    'user_id'    => $userId,
                    'student_id' => 'STU-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                    'program'    => $sp['program'],
                    'year_level' => $sp['year_level'],
                    'bio'        => $sp['bio'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            // Weak subjects
            foreach ($sp['weak_subjects'] as $code) {
                if (!isset($subjects[$code])) continue;
                DB::table('student_weak_subjects')->updateOrInsert(
                    ['student_id' => $studentId, 'subject_id' => $subjects[$code]],
                    [
                        'difficulty_level' => 'difficult',
                        'needs_help'       => true,
                        'updated_at'       => $now,
                        'created_at'       => $now,
                    ]
                );
            }

            $studentIds[$sp['email']] = ['student_id' => $studentId, 'user_id' => $userId];
        }

        // ── 4. Pending requests → tutor1 (so you can test tutor inbox) ────────
        $mainTutor   = $tutorIds['tutor1@test.com'];
        $mathSubject = $subjects['MATH101'];
        $calcSubject = $subjects['CALC101'];
        $statSubject = $subjects['STAT101'];

        $pendingRequests = [
            [
                'student' => 'student1@test.com',
                'subject' => $mathSubject,
                'message' => 'Hi Dr. Santos! I need help with differential equations. Can you tutor me?',
            ],
            [
                'student' => 'student2@test.com',
                'subject' => $calcSubject,
                'message' => 'I failed my last calculus exam. Please help me understand limits and derivatives.',
            ],
            [
                'student' => 'student3@test.com',
                'subject' => $statSubject,
                'message' => 'Hi! I need a Statistics tutor for my engineering course. Are you available?',
            ],
        ];

        foreach ($pendingRequests as $req) {
            $student = $studentIds[$req['student']];

            $alreadyExists = DB::table('tutor_requests')
                ->where('student_id', $student['student_id'])
                ->where('tutor_id', $mainTutor['tutor_id'])
                ->exists();

            if (!$alreadyExists) {
                DB::table('tutor_requests')->insert([
                    'student_id' => $student['student_id'],
                    'tutor_id'   => $mainTutor['tutor_id'],
                    'subject_id' => $req['subject'],
                    'message'    => $req['message'],
                    'status'     => 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $this->command->info('');
        $this->command->info('✅ Test users seeded successfully!');
        $this->command->info('');
        $this->command->info('── STUDENTS (swipe tutors) ──────────────────────');
        $this->command->info('  student1@test.com  /  password  (Juan dela Cruz)');
        $this->command->info('  student2@test.com  /  password  (Ana Reyes)');
        $this->command->info('  student3@test.com  /  password  (Mark Gomez)');
        $this->command->info('');
        $this->command->info('── TUTORS ───────────────────────────────────────');
        $this->command->info('  tutor1@test.com  /  password  ← has 3 pending requests');
        $this->command->info('  tutor2@test.com  /  password');
        $this->command->info('  tutor3@test.com  /  password');
        $this->command->info('  tutor4@test.com  /  password');
        $this->command->info('  tutor5@test.com  /  password');
        $this->command->info('');
    }
}
