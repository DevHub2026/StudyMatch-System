<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            // submitted_by matches admin DB field name
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reported_user_id')->nullable()->constrained('users')->nullOnDelete();
            // subject is a short label, description is the detail (matches admin DB)
            $table->string('subject');
            $table->text('description');
            // status values aligned with admin DB: open/reviewing/resolved/dismissed
            $table->enum('status', ['open', 'reviewing', 'resolved', 'dismissed'])->default('open');
            // priority aligns with admin DB
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->text('resolution_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('priority');
            $table->index('submitted_by');
            $table->index('reported_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
