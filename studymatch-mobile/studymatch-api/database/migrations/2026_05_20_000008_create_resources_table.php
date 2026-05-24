<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploader_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size')->default(0); // bytes
            $table->string('file_type')->nullable();
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamps();

            $table->index('subject_id');
            $table->index('uploader_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
