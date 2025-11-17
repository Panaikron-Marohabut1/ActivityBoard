const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get user's registrations
 * GET /api/registrations
 */
const getUserRegistrations = async (req, res) => {
    try {
        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                *,
                activity:activities(*)
            `)
            .eq('user_id', req.user.id)
            .order('registered_at', { ascending: false });

        if (error) {
            console.error('Get registrations error:', error);
            return errorResponse(res, 'Failed to fetch registrations', 500);
        }

        return successResponse(res, { registrations });

    } catch (error) {
        console.error('GetUserRegistrations error:', error);
        return errorResponse(res, 'Failed to fetch registrations', 500);
    }
};

/**
 * Register for an activity
 * POST /api/registrations
 */
const registerForActivity = async (req, res) => {
    try {
        const { activityId } = req.body;
        const userId = req.user.id;

        // Check if activity exists and is open
        const { data: activity, error: activityError } = await supabase
            .from('activities')
            .select('*')
            .eq('id', activityId)
            .single();

        if (activityError || !activity) {
            return errorResponse(res, 'Activity not found', 404);
        }

        if (activity.status !== 'open') {
            return errorResponse(res, 'Activity is not open for registration', 400);
        }

        // Check if activity is full
        if (activity.max_participants && activity.current_participants >= activity.max_participants) {
            return errorResponse(res, 'Activity is full', 400);
        }

        // Check if already registered
        const { data: existingRegistration } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', userId)
            .eq('activity_id', activityId)
            .single();

        if (existingRegistration) {
            if (existingRegistration.registration_status === 'registered') {
                return errorResponse(res, 'Already registered for this activity', 400);
            }
            
            // If previously cancelled, update to registered
            const { data: registration, error } = await supabase
                .from('registrations')
                .update({
                    registration_status: 'registered',
                    cancelled_at: null
                })
                .eq('id', existingRegistration.id)
                .select()
                .single();

            if (error) {
                console.error('Re-registration error:', error);
                return errorResponse(res, 'Failed to register', 500);
            }

            // Increment participant count
            const { error: updateError } = await supabase
                .from('activities')
                .update({
                    current_participants: (activity.current_participants || 0) + 1
                })
                .eq('id', activityId);

            if (updateError) {
                console.error('Failed to update participant count:', updateError);
            }

            return successResponse(res, { registration }, 'Successfully registered for activity', 201);
        }

        // Create new registration
        const { data: registration, error } = await supabase
            .from('registrations')
            .insert({
                user_id: userId,
                activity_id: activityId,
                registration_status: 'registered'
            })
            .select()
            .single();

        if (error) {
            console.error('Registration error:', error);
            return errorResponse(res, 'Failed to register for activity', 500);
        }

        // Increment participant count
        const { error: updateError } = await supabase
            .from('activities')
            .update({
                current_participants: (activity.current_participants || 0) + 1
            })
            .eq('id', activityId);

        if (updateError) {
            console.error('Failed to update participant count:', updateError);
        }

        return successResponse(res, { registration }, 'Successfully registered for activity', 201);

    } catch (error) {
        console.error('RegisterForActivity error:', error);
        return errorResponse(res, 'Failed to register for activity', 500);
    }
};

/**
 * Cancel registration
 * DELETE /api/registrations/:id
 */
const cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('=== CANCEL REGISTRATION ===');
        console.log('Registration ID:', id);
        console.log('User ID:', req.user.id);

        // Check if registration exists and belongs to user
        const { data: registration, error: fetchError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching registration:', fetchError);
            return errorResponse(res, 'Registration not found', 404);
        }

        if (!registration) {
            console.log('Registration not found or does not belong to user');
            return errorResponse(res, 'Registration not found', 404);
        }

        console.log('Registration found:', registration);

        if (registration.registration_status === 'cancelled') {
            return errorResponse(res, 'Registration already cancelled', 400);
        }

        // Update registration status
        const { error } = await supabase
            .from('registrations')
            .update({
                registration_status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Cancel registration error:', error);
            return errorResponse(res, 'Failed to cancel registration', 500);
        }

        console.log('Registration cancelled successfully');

        // Decrement participant count
        const { data: activity } = await supabase
            .from('activities')
            .select('current_participants')
            .eq('id', registration.activity_id)
            .single();

        console.log('Activity current participants:', activity?.current_participants);

        if (activity && activity.current_participants > 0) {
            const { error: updateError } = await supabase
                .from('activities')
                .update({
                    current_participants: activity.current_participants - 1
                })
                .eq('id', registration.activity_id);

            if (updateError) {
                console.error('Failed to update participant count:', updateError);
            } else {
                console.log('Participant count decremented to:', activity.current_participants - 1);
            }
        } else {
            console.log('Not decrementing - current_participants is 0 or activity not found');
        }

        return successResponse(res, null, 'Registration cancelled successfully');

    } catch (error) {
        console.error('CancelRegistration error:', error);
        return errorResponse(res, 'Failed to cancel registration', 500);
    }
};

/**
 * Get all registrations for an activity (Admin only)
 * GET /api/registrations/activity/:activityId
 */
const getActivityRegistrations = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if user is admin or the organizer of this activity
        if (userRole !== 'admin') {
            const { data: activity, error: activityError } = await supabase
                .from('activities')
                .select('created_by')
                .eq('id', activityId)
                .single();

            if (activityError) {
                console.error('Get activity error:', activityError);
                return errorResponse(res, 'Activity not found', 404);
            }

            if (activity.created_by !== userId) {
                return errorResponse(res, 'You do not have permission to view these participants', 403);
            }
        }

        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                *,
                user:users!registrations_user_id_fkey(id, username, first_name, last_name, email, phone)
            `)
            .eq('activity_id', activityId)
            .order('registered_at', { ascending: false });

        if (error) {
            console.error('Get activity registrations error:', error);
            return errorResponse(res, 'Failed to fetch registrations', 500);
        }

        return successResponse(res, { registrations });

    } catch (error) {
        console.error('GetActivityRegistrations error:', error);
        return errorResponse(res, 'Failed to fetch registrations', 500);
    }
};

/**
 * Remove a participant from an activity (Organizer/Admin only)
 * DELETE /api/registrations/:id/remove
 */
const removeParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch the registration
        const { data: registration, error: fetchError } = await supabase
            .from('registrations')
            .select('*, activity:activities!registrations_activity_id_fkey(id, created_by)')
            .eq('id', id)
            .single();

        if (fetchError || !registration) {
            console.error('Error fetching registration:', fetchError);
            return errorResponse(res, 'Registration not found', 404);
        }

        // Check if user is admin or the activity organizer
        if (userRole !== 'admin' && registration.activity.created_by !== userId) {
            return errorResponse(res, 'You do not have permission to remove this participant', 403);
        }

        // Delete the registration
        const { error: deleteError } = await supabase
            .from('registrations')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete registration error:', deleteError);
            return errorResponse(res, 'Failed to remove participant', 500);
        }

        // Decrement participant count
        const { data: activity } = await supabase
            .from('activities')
            .select('current_participants')
            .eq('id', registration.activity_id)
            .single();

        if (activity && activity.current_participants > 0) {
            await supabase
                .from('activities')
                .update({
                    current_participants: activity.current_participants - 1
                })
                .eq('id', registration.activity_id);
        }

        return successResponse(res, null, 'Participant removed successfully');

    } catch (error) {
        console.error('RemoveParticipant error:', error);
        return errorResponse(res, 'Failed to remove participant', 500);
    }
};

module.exports = {
    getUserRegistrations,
    registerForActivity,
    cancelRegistration,
    getActivityRegistrations,
    removeParticipant
};
