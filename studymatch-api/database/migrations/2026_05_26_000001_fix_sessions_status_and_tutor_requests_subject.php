<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'pending' to tutor_sessions.status enum
        DB::statement("ALTER TABLE tutor_sessions MODIFY COLUMN status ENUM('pending','scheduled','ongoing','completed','cancelled') NOT NULL DEFAULT 'scheduled'");

        // Make tutor_requests.subject_id nullable (mobile clients don't always send it)
        DB::statement("ALTER TABLE tutor_requests MODIFY COLUMN subject_id BIGINT UNSIGNED NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tutor_sessions MODIFY COLUMN status ENUM('scheduled','ongoing','completed','cancelled') NOT NULL DEFAULT 'scheduled'");
        DB::statement("ALTER TABLE tutor_requests MODIFY COLUMN subject_id BIGINT UNSIGNED NOT NULL");
    }
};
