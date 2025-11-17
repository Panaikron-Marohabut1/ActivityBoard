const { supabase } = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all pending activities
 * GET /api/admin/pending-activities
 */
const getPendingActivities = async (req, res) => {
    try {
        const { data: activities, error } = await supabase
            .from('activities')
            .select(`
                *,
                users:created_by(id, username, first_name, last_name, email, student_id)
            `)
            .eq('approval_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get pending activities error:', error);
            return errorResponse(res, 'Failed to fetch pending activities', 500);
        }

        return successResponse(res, { activities }, 'Pending activities retrieved successfully');

    } catch (error) {
        console.error('Get pending activities error:', error);
        return errorResponse(res, 'Failed to fetch pending activities', 500);
    }
};

/**
 * Approve an activity
 * PUT /api/admin/activities/:activityId/approve
 */
const approveActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.id;

        console.log('=== APPROVE ACTIVITY ===');
        console.log('Activity ID:', activityId);
        console.log('Admin User ID:', userId);

        const { data: activity, error } = await supabase
            .from('activities')
            .update({
                approval_status: 'approved',
                approved_by: userId,
                approved_at: new Date().toISOString()
            })
            .eq('id', activityId)
            .select()
            .single();

        if (error) {
            console.error('Approve activity error:', error);
            return errorResponse(res, 'Failed to approve activity', 500);
        }

        console.log('Activity approved successfully:', activity);
        console.log('New approval_status:', activity.approval_status);

        return successResponse(res, { activity }, 'Activity approved successfully');

    } catch (error) {
        console.error('Approve activity error:', error);
        return errorResponse(res, 'Failed to approve activity', 500);
    }
};

/**
 * Reject an activity
 * PUT /api/admin/activities/:activityId/reject
 */
const rejectActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { rejectionReason } = req.body;
        const userId = req.user.id;

        const { data: activity, error } = await supabase
            .from('activities')
            .update({
                approval_status: 'rejected',
                approved_by: userId,
                approved_at: new Date().toISOString(),
                rejection_reason: rejectionReason
            })
            .eq('id', activityId)
            .select()
            .single();

        if (error) {
            console.error('Reject activity error:', error);
            return errorResponse(res, 'Failed to reject activity', 500);
        }

        return successResponse(res, { activity }, 'Activity rejected');

    } catch (error) {
        console.error('Reject activity error:', error);
        return errorResponse(res, 'Failed to reject activity', 500);
    }
};

/**
 * Get platform statistics
 * GET /api/admin/statistics
 */
const getStatistics = async (req, res) => {
    try {
        // Total users by role
        const { data: userStats } = await supabase
            .from('users')
            .select('role');

        const users = {
            total: userStats?.length || 0,
            students: userStats?.filter(u => u.role === 'student').length || 0,
            organizers: userStats?.filter(u => u.role === 'organizer').length || 0,
            admins: userStats?.filter(u => u.role === 'admin').length || 0
        };

        // Activities by status
        const { data: activityStats } = await supabase
            .from('activities')
            .select('approval_status, status');

        const activities = {
            total: activityStats?.length || 0,
            pending: activityStats?.filter(a => a.approval_status === 'pending').length || 0,
            approved: activityStats?.filter(a => a.approval_status === 'approved').length || 0,
            rejected: activityStats?.filter(a => a.approval_status === 'rejected').length || 0,
            active: activityStats?.filter(a => a.status === 'open').length || 0,
            completed: activityStats?.filter(a => a.status === 'completed').length || 0
        };

        // Total registrations
        const { count: totalRegistrations } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('registration_status', 'registered');

        // Total events
        const { count: totalEvents } = await supabase
            .from('activity_events')
            .select('*', { count: 'exact', head: true });

        // Total attendance records
        const { count: totalAttendance } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true });

        const stats = {
            users,
            activities,
            registrations: totalRegistrations || 0,
            events: totalEvents || 0,
            attendanceRecords: totalAttendance || 0
        };

        return successResponse(res, { statistics: stats }, 'Statistics retrieved successfully');

    } catch (error) {
        console.error('Get statistics error:', error);
        return errorResponse(res, 'Failed to fetch statistics', 500);
    }
};

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let query = supabase
            .from('users')
            .select('id, username, email, first_name, last_name, student_id, role, avatar_url, created_at')
            .order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`);
        }

        const { data: users, error } = await query;

        if (error) {
            console.error('Get users error:', error);
            return errorResponse(res, 'Failed to fetch users', 500);
        }

        return successResponse(res, { users }, 'Users retrieved successfully');

    } catch (error) {
        console.error('Get users error:', error);
        return errorResponse(res, 'Failed to fetch users', 500);
    }
};

/**
 * Update user role (Admin only)
 * PUT /api/admin/users/:userId/role
 */
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['student', 'organizer', 'admin'].includes(role)) {
            return errorResponse(res, 'Invalid role', 400);
        }

        const { data: user, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId)
            .select('id, username, email, first_name, last_name, student_id, role')
            .single();

        if (error) {
            console.error('Update role error:', error);
            return errorResponse(res, 'Failed to update role', 500);
        }

        return successResponse(res, { user }, 'User role updated successfully');

    } catch (error) {
        console.error('Update role error:', error);
        return errorResponse(res, 'Failed to update role', 500);
    }
};

module.exports = {
    getPendingActivities,
    approveActivity,
    rejectActivity,
    getStatistics,
    getAllUsers,
    updateUserRole
};
