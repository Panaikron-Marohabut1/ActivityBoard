const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Check-in to an event via QR code
 * POST /api/attendance/check-in
 */
const checkIn = async (req, res) => {
    try {
        const { eventId, qrData } = req.body;
        const userId = req.user.id;

        // Verify event exists
        const { data: event, error: eventError } = await supabase
            .from('activity_events')
            .select('*, activities(*)')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return errorResponse(res, 'Event not found', 404);
        }

        // Check if user is registered for the activity
        const { data: registration } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', userId)
            .eq('activity_id', event.activity_id)
            .eq('registration_status', 'registered')
            .single();

        if (!registration) {
            return errorResponse(res, 'You are not registered for this activity', 403);
        }

        // Check if already checked in
        const { data: existing } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .single();

        if (existing) {
            return errorResponse(res, 'Already checked in to this event', 400);
        }

        // Create attendance record
        const { data: attendance, error } = await supabase
            .from('attendance')
            .insert({
                user_id: userId,
                activity_id: event.activity_id,
                event_id: eventId,
                status: 'present'
            })
            .select()
            .single();

        if (error) {
            console.error('Check-in error:', error);
            return errorResponse(res, 'Failed to check in', 500);
        }

        return successResponse(res, { attendance }, 'Checked in successfully', 201);

    } catch (error) {
        console.error('Check-in error:', error);
        return errorResponse(res, 'Failed to check in', 500);
    }
};

/**
 * Get attendance stats for a user in an activity
 * GET /api/attendance/my-stats/:activityId
 */
const getMyStats = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.id;

        // Get all events for this activity
        const { data: events } = await supabase
            .from('activity_events')
            .select('*')
            .eq('activity_id', activityId)
            .order('event_date');

        if (!events) {
            return successResponse(res, { stats: null }, 'No events found');
        }

        // Get attendance records
        const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('activity_id', activityId);

        const now = new Date();
        const pastEvents = events.filter(e => new Date(e.event_date) < now);
        const upcomingEvents = events.filter(e => new Date(e.event_date) >= now);

        const attended = attendance ? attendance.filter(a => a.status === 'present').length : 0;
        const absent = pastEvents.length - attended;
        const attendanceRate = pastEvents.length > 0 
            ? ((attended / pastEvents.length) * 100).toFixed(2) 
            : 0;

        const stats = {
            totalEvents: events.length,
            pastEvents: pastEvents.length,
            upcomingEvents: upcomingEvents.length,
            attended,
            absent,
            attendanceRate: parseFloat(attendanceRate),
            events: events.map(event => ({
                ...event,
                attended: attendance?.some(a => a.event_id === event.id && a.status === 'present') || false
            }))
        };

        return successResponse(res, { stats }, 'Stats retrieved successfully');

    } catch (error) {
        console.error('Get stats error:', error);
        return errorResponse(res, 'Failed to fetch stats', 500);
    }
};

/**
 * Get all attendance for an activity (Organizer/Admin)
 * GET /api/activities/:activityId/attendance
 */
const getActivityAttendance = async (req, res) => {
    try {
        const { activityId } = req.params;
        const user = req.user;

        // Check if user owns activity or is admin
        const { data: activity } = await supabase
            .from('activities')
            .select('created_by')
            .eq('id', activityId)
            .single();

        if (!activity) {
            return errorResponse(res, 'Activity not found', 404);
        }

        if (activity.created_by !== user.id && user.role !== 'admin') {
            return errorResponse(res, 'Unauthorized', 403);
        }

        // Get all participants with their attendance
        const { data: participants, error } = await supabase
            .from('activity_participants')
            .select('*')
            .eq('activity_id', activityId);

        if (error) {
            console.error('Get attendance error:', error);
            return errorResponse(res, 'Failed to fetch attendance', 500);
        }

        return successResponse(res, { participants }, 'Attendance retrieved successfully');

    } catch (error) {
        console.error('Get attendance error:', error);
        return errorResponse(res, 'Failed to fetch attendance', 500);
    }
};

/**
 * Get attendance for a specific event
 * GET /api/events/:eventId/attendance
 */
const getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;
        const user = req.user;

        // Get event and check permissions
        const { data: event } = await supabase
            .from('activity_events')
            .select('*, activities(created_by)')
            .eq('id', eventId)
            .single();

        if (!event) {
            return errorResponse(res, 'Event not found', 404);
        }

        if (event.activities.created_by !== user.id && user.role !== 'admin') {
            return errorResponse(res, 'Unauthorized', 403);
        }

        // Get attendance for this event
        const { data: attendance, error } = await supabase
            .from('attendance')
            .select(`
                *,
                users(id, username, first_name, last_name, student_id, email)
            `)
            .eq('event_id', eventId)
            .order('check_in_time', { ascending: false });

        if (error) {
            console.error('Get event attendance error:', error);
            return errorResponse(res, 'Failed to fetch attendance', 500);
        }

        // Get registered users who haven't checked in
        const { data: registered } = await supabase
            .from('registrations')
            .select(`
                user_id,
                users(id, username, first_name, last_name, student_id, email)
            `)
            .eq('activity_id', event.activity_id)
            .eq('registration_status', 'registered');

        const checkedInIds = attendance.map(a => a.user_id);
        const notCheckedIn = registered?.filter(r => !checkedInIds.includes(r.user_id)) || [];

        return successResponse(res, {
            event,
            checkedIn: attendance,
            notCheckedIn: notCheckedIn.map(r => r.users),
            summary: {
                total: registered?.length || 0,
                present: attendance?.length || 0,
                absent: notCheckedIn.length
            }
        }, 'Event attendance retrieved successfully');

    } catch (error) {
        console.error('Get event attendance error:', error);
        return errorResponse(res, 'Failed to fetch attendance', 500);
    }
};

/**
 * Mark absence for users who didn't check in (Admin/Organizer)
 * POST /api/events/:eventId/mark-absences
 */
const markAbsences = async (req, res) => {
    try {
        const { eventId } = req.params;
        const user = req.user;

        // Get event and check permissions
        const { data: event } = await supabase
            .from('activity_events')
            .select('*, activities(created_by)')
            .eq('id', eventId)
            .single();

        if (!event) {
            return errorResponse(res, 'Event not found', 404);
        }

        if (event.activities.created_by !== user.id && user.role !== 'admin') {
            return errorResponse(res, 'Unauthorized', 403);
        }

        // Check if event has passed
        if (new Date(event.event_date) > new Date()) {
            return errorResponse(res, 'Cannot mark absences for future events', 400);
        }

        // Get registered users
        const { data: registered } = await supabase
            .from('registrations')
            .select('user_id')
            .eq('activity_id', event.activity_id)
            .eq('registration_status', 'registered');

        // Get users who already have attendance records
        const { data: existing } = await supabase
            .from('attendance')
            .select('user_id')
            .eq('event_id', eventId);

        const existingUserIds = existing?.map(e => e.user_id) || [];
        const absentUsers = registered?.filter(r => !existingUserIds.includes(r.user_id)) || [];

        // Create absence records
        if (absentUsers.length > 0) {
            const absenceRecords = absentUsers.map(u => ({
                user_id: u.user_id,
                activity_id: event.activity_id,
                event_id: eventId,
                status: 'absent'
            }));

            const { error } = await supabase
                .from('attendance')
                .insert(absenceRecords);

            if (error) {
                console.error('Mark absences error:', error);
                return errorResponse(res, 'Failed to mark absences', 500);
            }
        }

        return successResponse(res, {
            markedAbsent: absentUsers.length
        }, `Marked ${absentUsers.length} absences`);

    } catch (error) {
        console.error('Mark absences error:', error);
        return errorResponse(res, 'Failed to mark absences', 500);
    }
};

module.exports = {
    checkIn,
    getMyStats,
    getActivityAttendance,
    getEventAttendance,
    markAbsences
};
