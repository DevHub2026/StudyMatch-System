<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content');
            // 'status' drives draft/published/archived lifecycle (matches admin DB)
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            // 'target' audience (matches admin DB values: all/students/tutors)
            $table->enum('target', ['all', 'students', 'tutors'])->default('all');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'target']);
            $table->index('published_at');
            $table->index('is_pinned');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
