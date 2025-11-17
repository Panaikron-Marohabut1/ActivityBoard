const { supabase } = require('../config/supabase');

/**
 * Get all notifications for current user
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const onlyUnread = req.query.unread === 'true';

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (onlyUnread) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Get notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: error.message
            });
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        res.json({
            success: true,
            data: {
                notifications: data || [],
                unreadCount: unreadCount || 0
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify notification belongs to user
        const { data: notification } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Mark as read error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update notification',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: { notification: data }
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Mark all as read error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update notifications',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify notification belongs to user
        const { data: notification } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete notification error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Create notification (internal use)
 */
exports.createNotification = async (userId, title, message, type, relatedActivityId = null) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type,
                related_activity_id: relatedActivityId
            }])
            .select()
            .single();

        if (error) {
            console.error('Create notification error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
};

/**
 * Toggle activity notifications for user
 */
exports.toggleActivityNotifications = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.id;
        const { enabled } = req.body;

        // Check if user is registered for this activity
        const { data: registration } = await supabase
            .from('registrations')
            .select('*')
            .eq('user_id', userId)
            .eq('activity_id', activityId)
            .single();

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'You are not registered for this activity'
            });
        }

        // Update notification preference
        const { data, error } = await supabase
            .from('registrations')
            .update({ notifications_enabled: enabled })
            .eq('user_id', userId)
            .eq('activity_id', activityId)
            .select()
            .single();

        if (error) {
            console.error('Toggle notifications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update notification preference',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: { registration: data },
            message: `Notifications ${enabled ? 'enabled' : 'disabled'} for this activity`
        });
    } catch (error) {
        console.error('Toggle notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
