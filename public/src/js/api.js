// API Configuration and Helper Functions
// Use relative URL when serving from same origin (ngrok), otherwise localhost
const API_BASE_URL = 'https://activityboard.onrender.com/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        // Handle unauthorized (token expired or invalid)
        if (response.status === 401) {
            logout();
            return null;
        }
        
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// API Methods
const API = {
    // Authentication
    auth: {
        login: (username, password) => 
            apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            }),
        
        register: (userData) => 
            apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            }),
        
        getMe: () => apiRequest('/auth/me'),
        
        logout: logout
    },
    
    // Activities
    activities: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/activities${queryString ? '?' + queryString : ''}`);
        },
        
        getById: (id) => apiRequest(`/activities/${id}`),
        
        create: (activityData) => 
            apiRequest('/activities', {
                method: 'POST',
                body: JSON.stringify(activityData)
            }),
        
        update: (id, activityData) => 
            apiRequest(`/activities/${id}`, {
                method: 'PUT',
                body: JSON.stringify(activityData)
            }),
        
        delete: (id) => 
            apiRequest(`/activities/${id}`, {
                method: 'DELETE'
            })
    },
    
    // Registrations
    registrations: {
        register: (activityId) => 
            apiRequest('/registrations', {
                method: 'POST',
                body: JSON.stringify({ activityId: activityId })
            }),
        
        cancel: (registrationId) => 
            apiRequest(`/registrations/${registrationId}`, {
                method: 'DELETE'
            }),
        
        remove: (registrationId) => 
            apiRequest(`/registrations/${registrationId}/remove`, {
                method: 'DELETE'
            }),
        
        getMyRegistrations: () => apiRequest('/registrations'),
        
        getActivityRegistrations: (activityId) => 
            apiRequest(`/registrations/activity/${activityId}`)
    },

    // Events
    events: {
        getActivityEvents: (activityId) => apiRequest(`/events/activity/${activityId}`),
        
        create: (eventData) => 
            apiRequest('/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            }),
        
        update: (id, eventData) => 
            apiRequest(`/events/${id}`, {
                method: 'PUT',
                body: JSON.stringify(eventData)
            }),
        
        delete: (id) => 
            apiRequest(`/events/${id}`, {
                method: 'DELETE'
            })
    },

    // Attendance
    attendance: {
        checkIn: (eventId, qrCode) => 
            apiRequest('/attendance/check-in', {
                method: 'POST',
                body: JSON.stringify({ event_id: eventId, qr_code: qrCode })
            }),
        
        getMyStats: () => apiRequest('/attendance/my-stats'),
        
        getEventAttendance: (eventId) => apiRequest(`/attendance/event/${eventId}`)
    },

    // Admin
    admin: {
        getPendingActivities: () => apiRequest('/admin/pending-activities'),
        
        approveActivity: (activityId) => 
            apiRequest(`/admin/activities/${activityId}/approve`, {
                method: 'PUT'
            }),
        
        rejectActivity: (activityId, reason) => 
            apiRequest(`/admin/activities/${activityId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reason })
            }),
        
        getUsers: () => apiRequest('/admin/users'),
        
        updateUserRole: (userId, role) => 
            apiRequest(`/admin/users/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            })
    },
    
    // Profile
    profile: {
        get: () => apiRequest('/profile'),
        
        update: (profileData) => 
            apiRequest('/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            }),
        
        updateAvatar: (base64Image) => 
            apiRequest('/profile/avatar', {
                method: 'POST',
                body: JSON.stringify({ avatarData: base64Image })
            }),
        
        changePassword: (passwordData) => 
            apiRequest('/profile/password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            }),
        
        getStats: () => apiRequest('/profile/stats')
    },

    // Notifications
    notifications: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/notifications${queryString ? '?' + queryString : ''}`);
        },
        
        markAsRead: (id) => 
            apiRequest(`/notifications/${id}/read`, {
                method: 'PUT'
            }),
        
        markAllAsRead: () => 
            apiRequest('/notifications/read-all', {
                method: 'PUT'
            }),
        
        delete: (id) => 
            apiRequest(`/notifications/${id}`, {
                method: 'DELETE'
            }),
        
        toggleActivity: (activityId, enabled) => 
            apiRequest(`/notifications/activity/${activityId}/toggle`, {
                method: 'PUT',
                body: JSON.stringify({ enabled })
            })
    }
};

// Check authentication on protected pages
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Make API globally available
window.API = API;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.logout = logout;

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, getCurrentUser, isAuthenticated, requireAuth, logout };
}

// Export for ES6 modules
if (typeof exports !== 'undefined') {
    exports.default = API;
    exports.API = API;
    exports.getCurrentUser = getCurrentUser;
    exports.isAuthenticated = isAuthenticated;
    exports.requireAuth = requireAuth;
    exports.logout = logout;
}
