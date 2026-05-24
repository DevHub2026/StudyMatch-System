<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->boolean('profile_completed')->default(false)->after('role');
            $table->string('avatar')->nullable()->after('profile_completed');
            $table->text('bio')->nullable()->after('avatar');
            $table->string('phone', 20)->nullable()->after('bio');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable()->after('date_of_birth');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'profile_completed', 'avatar', 'bio', 'phone', 'date_of_birth', 'gender']);
        });
    }
};
