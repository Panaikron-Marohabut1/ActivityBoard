const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get user profile
 * GET /api/profile
 */
const getProfile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, first_name, last_name, phone, role, avatar_url, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, { user });

    } catch (error) {
        console.error('GetProfile error:', error);
        return errorResponse(res, 'Failed to fetch profile', 500);
    }
};

/**
 * Update user profile
 * PUT /api/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, phone } = req.body;

        const updateData = {};
        if (firstName !== undefined) updateData.first_name = firstName;
        if (lastName !== undefined) updateData.last_name = lastName;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;

        // Check if email is already taken by another user
        if (email) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .neq('id', req.user.id)
                .single();

            if (existingUser) {
                return errorResponse(res, 'Email already in use', 400);
            }
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select('id, username, email, first_name, last_name, phone, role, avatar_url')
            .single();

        if (error) {
            console.error('Update profile error:', error);
            return errorResponse(res, 'Failed to update profile', 500);
        }

        return successResponse(res, { user }, 'Profile updated successfully');

    } catch (error) {
        console.error('UpdateProfile error:', error);
        return errorResponse(res, 'Failed to update profile', 500);
    }
};

/**
 * Change password
 * PUT /api/profile/password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const { data: user, error } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return errorResponse(res, 'User not found', 404);
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return errorResponse(res, 'Current password is incorrect', 400);
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newPasswordHash })
            .eq('id', req.user.id);

        if (updateError) {
            console.error('Change password error:', updateError);
            return errorResponse(res, 'Failed to change password', 500);
        }

        return successResponse(res, null, 'Password changed successfully');

    } catch (error) {
        console.error('ChangePassword error:', error);
        return errorResponse(res, 'Failed to change password', 500);
    }
};

/**
 * Upload profile picture
 * POST /api/profile/avatar
 */
const uploadAvatar = async (req, res) => {
    try {
        // For now, accept base64 image data
        const { avatarData } = req.body;

        if (!avatarData) {
            return errorResponse(res, 'No avatar data provided', 400);
        }

        // Update user avatar URL (storing base64 for now)
        // In production, you'd upload to Supabase Storage
        const { data: user, error } = await supabase
            .from('users')
            .update({ avatar_url: avatarData })
            .eq('id', req.user.id)
            .select('id, username, email, first_name, last_name, phone, role, avatar_url')
            .single();

        if (error) {
            console.error('Upload avatar error:', error);
            return errorResponse(res, 'Failed to upload avatar', 500);
        }

        return successResponse(res, { user }, 'Avatar updated successfully');

    } catch (error) {
        console.error('UploadAvatar error:', error);
        return errorResponse(res, 'Failed to upload avatar', 500);
    }
};

/**
 * Get user's activity statistics
 * GET /api/profile/stats
 */
const getProfileStats = async (req, res) => {
    try {
        // Get registration counts
        const { data: registrations, error } = await supabase
            .from('registrations')
            .select('registration_status')
            .eq('user_id', req.user.id);

        if (error) {
            console.error('Get stats error:', error);
            return errorResponse(res, 'Failed to fetch statistics', 500);
        }

        const stats = {
            total: registrations.length,
            registered: registrations.filter(r => r.registration_status === 'registered').length,
            completed: registrations.filter(r => r.registration_status === 'completed').length,
            cancelled: registrations.filter(r => r.registration_status === 'cancelled').length
        };

        return successResponse(res, { stats });

    } catch (error) {
        console.error('GetProfileStats error:', error);
        return errorResponse(res, 'Failed to fetch statistics', 500);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    getProfileStats
};
