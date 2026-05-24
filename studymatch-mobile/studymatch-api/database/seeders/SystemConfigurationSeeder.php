<?php

namespace Database\Seeders;

use App\Models\SystemConfiguration;
use Illuminate\Database\Seeder;

class SystemConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            // General
            ['key' => 'app_name',                'value' => 'StudyMatch',        'group' => 'general',      'type' => 'string',  'description' => 'Application name'],
            ['key' => 'app_description',         'value' => 'Tutor-student matching platform', 'group' => 'general', 'type' => 'string', 'description' => 'Application description'],
            ['key' => 'maintenance_mode',        'value' => 'false',             'group' => 'general',      'type' => 'boolean', 'description' => 'Put the app in maintenance mode'],
            ['key' => 'allow_registration',      'value' => 'true',             'group' => 'general',      'type' => 'boolean', 'description' => 'Allow new user registrations'],

            // Sessions
            ['key' => 'max_sessions_per_user',   'value' => '5',                'group' => 'sessions',     'type' => 'integer', 'description' => 'Maximum active sessions per user'],
            ['key' => 'session_duration_default','value' => '60',               'group' => 'sessions',     'type' => 'integer', 'description' => 'Default session duration in minutes'],
            ['key' => 'session_buffer_minutes',  'value' => '15',               'group' => 'sessions',     'type' => 'integer', 'description' => 'Buffer time between sessions in minutes'],
            ['key' => 'allow_session_cancellation', 'value' => 'true',          'group' => 'sessions',     'type' => 'boolean', 'description' => 'Allow users to cancel sessions'],
            ['key' => 'cancellation_window_hours','value' => '24',              'group' => 'sessions',     'type' => 'integer', 'description' => 'Hours before session when cancellation is allowed'],

            // Matching
            ['key' => 'auto_match_enabled',      'value' => 'true',             'group' => 'matching',     'type' => 'boolean', 'description' => 'Enable automatic tutor-student matching'],
            ['key' => 'max_pending_requests',    'value' => '3',                'group' => 'matching',     'type' => 'integer', 'description' => 'Max pending tutor requests per student'],

            // Notifications
            ['key' => 'email_notifications',     'value' => 'true',             'group' => 'notifications','type' => 'boolean', 'description' => 'Send email notifications'],
            ['key' => 'push_notifications',      'value' => 'true',             'group' => 'notifications','type' => 'boolean', 'description' => 'Send push notifications'],
        ];

        foreach ($configs as $config) {
            SystemConfiguration::firstOrCreate(
                ['key' => $config['key']],
                $config
            );
        }
    }
}
