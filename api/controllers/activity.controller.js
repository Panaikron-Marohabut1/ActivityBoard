const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all activities
 * GET /api/activities
 */
const getAllActivities = async (req, res) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;

        console.log('=== GET ALL ACTIVITIES ===');
        console.log('Query params:', { status, search, limit, offset });

        let query = supabase
            .from('activities')
            .select(`
                *,
                created_by_user:users!activities_created_by_fkey(id, username, first_name, last_name)
            `)
            .order('start_date', { ascending: false });

        // Filter by status
        if (status) {
            query = query.eq('status', status);
        } else {
            // By default, exclude cancelled activities
            query = query.neq('status', 'cancelled');
        }

        // Search functionality
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data: activities, error, count } = await query;

        if (error) {
            console.error('Get activities error:', error);
            return errorResponse(res, 'Failed to fetch activities', 500);
        }

        console.log('Activities found:', activities ? activities.length : 0);
        console.log('Activities data:', JSON.stringify(activities, null, 2));

        return successResponse(res, {
            activities,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('GetAllActivities error:', error);
        return errorResponse(res, 'Failed to fetch activities', 500);
    }
};

/**
 * Get single activity by ID
 * GET /api/activities/:id
 */
const getActivityById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: activity, error } = await supabase
            .from('activities')
            .select(`
                *,
                created_by_user:users!activities_created_by_fkey(id, username, first_name, last_name),
                registrations(id, user_id, registration_status)
            `)
            .eq('id', id)
            .single();

        if (error || !activity) {
            return errorResponse(res, 'Activity not found', 404);
        }

        return successResponse(res, { activity });

    } catch (error) {
        console.error('GetActivityById error:', error);
        return errorResponse(res, 'Failed to fetch activity', 500);
    }
};

/**
 * Create new activity (Admin/Organizer only)
 * POST /api/activities
 */
const createActivity = async (req, res) => {
    try {
        const {
            title,
            description,
            activity_type,
            activityType,
            faculty,
            location,
            start_date,
            startDate,
            end_date,
            endDate,
            max_participants,
            maxParticipants,
            image_url,
            imageUrl,
            poster_url,
            is_announcement_only,
            registration_start_date,
            registration_end_date,
            status
        } = req.body;

        const { data: activity, error } = await supabase
            .from('activities')
            .insert({
                title,
                description,
                activity_type: activity_type || activityType,
                faculty,
                location,
                start_date: start_date || startDate,
                end_date: end_date || endDate,
                max_participants: max_participants || maxParticipants,
                image_url: image_url || imageUrl,
                poster_url: poster_url || null,
                is_announcement_only: is_announcement_only || false,
                registration_start_date: registration_start_date || null,
                registration_end_date: registration_end_date || null,
                external_link: req.body.external_link || null,
                created_by: req.user.id,
                status: status || 'open',
                approval_status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Create activity error:', error);
            return errorResponse(res, 'Failed to create activity', 500);
        }

        return successResponse(res, { activity }, 'Activity created successfully', 201);

    } catch (error) {
        console.error('CreateActivity error:', error);
        return errorResponse(res, 'Failed to create activity', 500);
    }
};

/**
 * Update activity (Admin/Organizer only)
 * PUT /api/activities/:id
 */
const updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            activity_type,
            activityType,
            faculty,
            location,
            start_date,
            startDate,
            end_date,
            endDate,
            max_participants,
            maxParticipants,
            image_url,
            imageUrl,
            poster_url,
            is_announcement_only,
            registration_start_date,
            registration_end_date,
            status
        } = req.body;

        // Check if activity exists
        const { data: existingActivity } = await supabase
            .from('activities')
            .select('id')
            .eq('id', id)
            .single();

        if (!existingActivity) {
            return errorResponse(res, 'Activity not found', 404);
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (activity_type !== undefined || activityType !== undefined) {
            updateData.activity_type = activity_type || activityType;
        }
        if (faculty !== undefined) updateData.faculty = faculty;
        if (location !== undefined) updateData.location = location;
        if (start_date !== undefined || startDate !== undefined) {
            updateData.start_date = start_date || startDate;
        }
        if (end_date !== undefined || endDate !== undefined) {
            updateData.end_date = end_date || endDate;
        }
        if (max_participants !== undefined || maxParticipants !== undefined) {
            updateData.max_participants = max_participants || maxParticipants;
        }
        if (image_url !== undefined || imageUrl !== undefined) {
            updateData.image_url = image_url || imageUrl;
        }
        if (poster_url !== undefined) updateData.poster_url = poster_url;
        if (is_announcement_only !== undefined) updateData.is_announcement_only = is_announcement_only;
        if (registration_start_date !== undefined) updateData.registration_start_date = registration_start_date;
        if (registration_end_date !== undefined) updateData.registration_end_date = registration_end_date;
        if (req.body.external_link !== undefined) updateData.external_link = req.body.external_link;
        if (status !== undefined) updateData.status = status;

        const { data: activity, error } = await supabase
            .from('activities')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update activity error:', error);
            return errorResponse(res, 'Failed to update activity', 500);
        }

        return successResponse(res, { activity }, 'Activity updated successfully');

    } catch (error) {
        console.error('UpdateActivity error:', error);
        return errorResponse(res, 'Failed to update activity', 500);
    }
};

/**
 * Delete activity (Admin/Organizer only)
 * DELETE /api/activities/:id
 */
const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if activity exists and get ownership info
        const { data: existingActivity, error: fetchError } = await supabase
            .from('activities')
            .select('id, created_by, title')
            .eq('id', id)
            .single();

        if (fetchError || !existingActivity) {
            return errorResponse(res, 'Activity not found', 404);
        }

        // Check ownership (only creator or admin can delete)
        if (existingActivity.created_by !== req.user.id && req.user.role !== 'admin') {
            return errorResponse(res, 'You can only delete your own activities', 403);
        }

        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete activity error:', error);
            return errorResponse(res, 'Failed to delete activity', 500);
        }

        return successResponse(res, null, 'Activity deleted successfully');

    } catch (error) {
        console.error('DeleteActivity error:', error);
        return errorResponse(res, 'Failed to delete activity', 500);
    }
};

module.exports = {
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    deleteActivity
};
