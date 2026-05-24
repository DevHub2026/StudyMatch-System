<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // category as varchar to allow any label (admin DB used: general, bug, feature, other, compliment, bug_report)
            $table->string('category');
            $table->text('message');
            $table->unsignedTinyInteger('rating')->nullable(); // 1-5
            // status aligned with admin DB: unread/read/flagged
            $table->enum('status', ['unread', 'read', 'flagged'])->default('unread');
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('category');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
