const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all events for an activity
 * GET /api/events/activity/:activityId
 */
const getActivityEvents = async (req, res) => {
    try {
        const { activityId } = req.params;

        const { data: events, error } = await supabase
            .from('activity_events')
            .select('*')
            .eq('activity_id', activityId)
            .order('start_date', { ascending: true });

        if (error) {
            console.error('Get events error:', error);
            return errorResponse(res, 'Failed to fetch events', 500);
        }

        return successResponse(res, { events }, 'Events retrieved successfully');

    } catch (error) {
        console.error('Get events error:', error);
        return errorResponse(res, 'Failed to fetch events', 500);
    }
};

/**
 * Create a new event for an activity
 * POST /api/events
 */
const createEvent = async (req, res) => {
    try {
        const { activityId, title, description, startDate, endDate } = req.body;

        // Validate required fields
        if (!activityId || !title || !startDate || !endDate) {
            return errorResponse(res, 'Missing required fields', 400);
        }

        // Check if user owns this activity or is admin
        const { data: activity } = await supabase
            .from('activities')
            .select('created_by')
            .eq('id', activityId)
            .single();

        if (!activity) {
            return errorResponse(res, 'Activity not found', 404);
        }

        const user = req.user;
        if (activity.created_by !== user.id && user.role !== 'admin') {
            return errorResponse(res, 'Unauthorized to create events for this activity', 403);
        }

        const { data: newEvent, error } = await supabase
            .from('activity_events')
            .insert({
                activity_id: activityId,
                title: title,
                description: description,
                start_date: startDate,
                end_date: endDate
            })
            .select()
            .single();

        if (error) {
            console.error('Create event error:', error);
            return errorResponse(res, 'Failed to create event', 500);
        }

        return successResponse(res, { event: newEvent }, 'Event created successfully', 201);

    } catch (error) {
        console.error('Create event error:', error);
        return errorResponse(res, 'Failed to create event', 500);
    }
};

/**
 * Update an event
 * PUT /api/events/:eventId
 */
const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { title, description, startDate, endDate } = req.body;

        // Check if user owns the activity or is admin
        // Check if user owns the activity or is admin
        const { data: event } = await supabase
            .from('activity_events')
            .select('activity_id, activities(created_by)')
            .eq('id', eventId)
            .single();

        if (!event) {
            return errorResponse(res, 'Event not found', 404);
        }

        const user = req.user;
        if (event.activities.created_by !== user.id && user.role !== 'admin') {
            return errorResponse(res, 'Unauthorized to update this event', 403);
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (startDate !== undefined) updateData.start_date = startDate;
        if (endDate !== undefined) updateData.end_date = endDate;
        updateData.updated_at = new Date().toISOString();

        const { data: updatedEvent, error } = await supabase
            .from('activity_events')
            .update(updateData)
            .eq('id', eventId)
            .select()
            .single();

        if (error) {
            console.error('Update event error:', error);
            return errorResponse(res, 'Failed to update event', 500);
        }

        return successResponse(res, { event: updatedEvent }, 'Event updated successfully');

    } catch (error) {
        console.error('Update event error:', error);
        return errorResponse(res, 'Failed to update event', 500);
    }
};

/**
 * Delete an event
 * DELETE /api/events/:eventId
 */
const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if user owns the activity or is admin
        const { data: event } = await supabase
            .from('activity_events')
            .select('activity_id, activities(created_by)')
            .eq('id', eventId)
            .single();

        if (!event) {
            return errorResponse(res, 'Event not found', 404);
        }

        const user = req.user;
        if (event.activities.created_by !== user.id && user.role !== 'admin') {
            return errorResponse(res, 'Unauthorized to delete this event', 403);
        }

        const { error } = await supabase
            .from('activity_events')
            .delete()
            .eq('id', eventId);

        if (error) {
            console.error('Delete event error:', error);
            return errorResponse(res, 'Failed to delete event', 500);
        }

        return successResponse(res, null, 'Event deleted successfully');

    } catch (error) {
        console.error('Delete event error:', error);
        return errorResponse(res, 'Failed to delete event', 500);
    }
};

/**
 * Get a single event
 * GET /api/events/:eventId
 */
const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        const { data: event, error } = await supabase
            .from('activity_events')
            .select('*, activities(*)')
            .eq('id', eventId)
            .single();

        if (error || !event) {
            return errorResponse(res, 'Event not found', 404);
        }

        return successResponse(res, { event }, 'Event retrieved successfully');

    } catch (error) {
        console.error('Get event error:', error);
        return errorResponse(res, 'Failed to fetch event', 500);
    }
};

module.exports = {
    getActivityEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent
};
