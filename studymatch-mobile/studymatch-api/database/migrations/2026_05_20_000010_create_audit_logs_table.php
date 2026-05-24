<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // admin_id matches admin DB field name (nullable for system actions)
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');    // e.g. 'login', 'logout', 'user.suspended'
            $table->string('module');    // e.g. 'auth', 'users', 'complaints' (matches admin DB)
            $table->text('description')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->json('metadata')->nullable(); // extra context payload (matches admin DB)
            $table->timestamps();

            $table->index('admin_id');
            $table->index('action');
            $table->index('module');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
