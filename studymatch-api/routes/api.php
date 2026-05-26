<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\TutorRequestController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\HelpCenterController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Auth — canonical paths
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);

    // Auth — frontend alias paths
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/avatar-base64', [ProfileController::class, 'uploadAvatarBase64']);
    Route::post('/profile/complete', [ProfileController::class, 'complete']);
    Route::put('/profile/step-1', [ProfileController::class, 'step1']);
    Route::put('/profile/step-2', [ProfileController::class, 'step2']);
    Route::put('/profile/step-3', [ProfileController::class, 'step3']);
    Route::put('/profile/step-4', [ProfileController::class, 'step4']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::delete('/profile/delete-account', [ProfileController::class, 'deleteAccount']);

    // Students — for tutor discovery feed
    Route::get('/students', [TutorController::class, 'index']);

    // Tutors — canonical paths
    Route::get('/tutors', [TutorController::class, 'index']);
    Route::get('/tutors/search', [TutorController::class, 'search']);
    Route::get('/tutors/{id}', [TutorController::class, 'show']);
    Route::get('/tutors/{id}/availability', [TutorController::class, 'getAvailability']);

    // Tutors — frontend alias (partners)
    Route::get('/partners', [TutorController::class, 'index']);
    Route::get('/partners/{id}', [TutorController::class, 'show']);

    // Tutor Requests — canonical paths
    Route::get('/tutor-requests', [TutorRequestController::class, 'index']);
    Route::post('/tutor-requests/send', [TutorRequestController::class, 'send']);
    Route::post('/tutor-requests/{id}/accept', [TutorRequestController::class, 'accept']);
    Route::post('/tutor-requests/{id}/decline', [TutorRequestController::class, 'decline']);
    Route::post('/tutor-requests/{id}/cancel', [TutorRequestController::class, 'cancel']);

    // Tutor Requests — frontend alias (match-requests); send accepts receiver_user_id
    Route::get('/match-requests', [TutorRequestController::class, 'index']);
    Route::get('/match-requests/pending', [TutorRequestController::class, 'pending']);
    Route::get('/match-requests/incoming', [TutorRequestController::class, 'incoming']);
    Route::post('/match-requests/send', [TutorRequestController::class, 'sendByUserId']);
    Route::post('/match-requests/{id}/accept', [TutorRequestController::class, 'accept']);
    Route::post('/match-requests/{id}/decline', [TutorRequestController::class, 'decline']);
    Route::post('/match-requests/{id}/cancel', [TutorRequestController::class, 'cancel']);
    Route::delete('/match-requests/{id}/cancel', [TutorRequestController::class, 'cancel']);

    // Subjects
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/weak-subjects', [SubjectController::class, 'getWeakSubjects']);
    Route::post('/weak-subjects', [SubjectController::class, 'addWeakSubject']);
    Route::put('/weak-subjects/{id}', [SubjectController::class, 'updateWeakSubject']);
    Route::delete('/weak-subjects/{id}', [SubjectController::class, 'removeWeakSubject']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/reviews/my-reviews', [ReviewController::class, 'myReviews']);
    Route::get('/reviews/received', [ReviewController::class, 'received']);
    Route::get('/reviews/tutor/{tutorId}', [ReviewController::class, 'getTutorReviews']);

    // Sessions
    Route::get('/sessions', [SessionController::class, 'index']);
    Route::get('/sessions/{id}', [SessionController::class, 'show']);
    Route::post('/sessions', [SessionController::class, 'store']);
    Route::post('/sessions/{id}/confirm', [SessionController::class, 'confirm']);
    Route::put('/sessions/{id}', [SessionController::class, 'update']);
    Route::delete('/sessions/{id}', [SessionController::class, 'cancel']);

    // Announcements (read-only for users)
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);

    // Announcements (admin CRUD)
    Route::get('/admin/announcements', [AnnouncementController::class, 'adminIndex']);
    Route::post('/admin/announcements', [AnnouncementController::class, 'adminStore']);
    Route::put('/admin/announcements/{id}', [AnnouncementController::class, 'adminUpdate']);
    Route::delete('/admin/announcements/{id}', [AnnouncementController::class, 'adminDestroy']);

    // Admin — stats, users, tutors, complaints
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users/{id}/suspend', [AdminController::class, 'suspendUser']);
    Route::post('/admin/users/{id}/unsuspend', [AdminController::class, 'unsuspendUser']);
    Route::get('/admin/tutors/pending', [TutorController::class, 'adminPending']);
    Route::post('/admin/tutors/{id}/approve', [TutorController::class, 'adminApprove']);
    Route::post('/admin/tutors/{id}/reject', [TutorController::class, 'adminReject']);
    Route::get('/admin/complaints', [ComplaintController::class, 'adminIndex']);
    Route::put('/admin/complaints/{id}', [ComplaintController::class, 'adminUpdate']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/all', [NotificationController::class, 'deleteAll']);

    // Complaints
    Route::get('/complaints', [ComplaintController::class, 'index']);
    Route::post('/complaints', [ComplaintController::class, 'store']);

    // Feedback
    Route::get('/feedback/my-feedback', [FeedbackController::class, 'myFeedback']);
    Route::post('/feedback/submit', [FeedbackController::class, 'submit']);

    // Help Center
    Route::get('/help-center', [HelpCenterController::class, 'index']);
    Route::post('/help-center/submit', [HelpCenterController::class, 'submit']);

    // Chat
    Route::get('/chat/conversations', [ChatController::class, 'conversations']);
    Route::get('/chat/unread-count', [ChatController::class, 'unreadCount']);
    Route::get('/chat/{partnerId}/messages', [ChatController::class, 'messages']);
    Route::post('/chat/send', [ChatController::class, 'send']);
    Route::post('/chat/send-file', [ChatController::class, 'sendFile']);

    // Library
    Route::get('/library', [LibraryController::class, 'index']);
    Route::post('/library', [LibraryController::class, 'store']);
    Route::get('/library/{id}/download', [LibraryController::class, 'download']);
});