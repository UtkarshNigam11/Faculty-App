const API_BASE_URL = 'https://faculty-app-j8ct.onrender.com/api'

// For local development:
// const API_BASE_URL = 'http://localhost:8000/api'

// Helper to get auth header
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('adminToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

// Admin types
export interface Admin {
  id: number
  admin_id: string
  name: string
  role: 'super_admin' | 'manager'
  is_active: boolean
  created_at?: string
  last_login?: string
}

export interface AdminLoginResponse {
  access_token: string
  admin: Admin
}

// Admin login (no auth required)
export const adminLogin = async (adminId: string, password: string): Promise<AdminLoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}

// Get all admins (super_admin only)
export const getAdmins = async (): Promise<Admin[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Super admin only')
    throw new Error('Failed to fetch admins')
  }
  return response.json()
}

// Create admin (super_admin only)
export const createAdmin = async (data: { admin_id: string; password: string; name: string; role: string }) => {
  const response = await fetch(`${API_BASE_URL}/admin/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Super admin only')
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create admin')
  }
  return response.json()
}

// Update admin (super_admin only)
export const updateAdmin = async (id: number, data: { name?: string; role?: string; is_active?: boolean }) => {
  const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Super admin only')
    throw new Error('Failed to update admin')
  }
  return response.json()
}

// Delete admin (super_admin only)
export const deleteAdmin = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/admin/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Super admin only')
    throw new Error('Failed to delete admin')
  }
  return response.json()
}

export interface User {
  id: number
  name: string
  email: string
  department: string
  phone: string
  is_admin?: boolean
  email_verified?: boolean
  created_at?: string
  push_token?: string
}

export interface SubstituteRequest {
  id: number
  teacher_id: number
  teacher_name: string
  teacher_email?: string
  teacher_phone?: string
  teacher_department?: string
  subject: string
  date: string
  time: string
  classroom?: string
  campus?: string
  notes: string
  status: 'pending' | 'accepted' | 'cancelled'
  request_type: 'class' | 'exam'
  accepted_by: number | null
  acceptor_name: string | null
  acceptor_email?: string
  acceptor_phone?: string
  acceptor_department?: string
  created_at: string
}

export interface DashboardStats {
  totalUsers: number
  totalRequests: number
  pendingRequests: number
  acceptedRequests: number
}

// Get all users (admin only)
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    throw new Error('Failed to fetch users')
  }
  return response.json()
}

// Create user (admin only)
export const createUser = async (data: { 
  name: string
  email: string
  password: string
  department?: string
  phone?: string 
}): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create user')
  }
  
  return response.json()
}

// Get user by ID (admin only)
export const getUser = async (id: number): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied')
    throw new Error('Failed to fetch user')
  }
  return response.json()
}

// Update user (admin only)
export const updateUser = async (id: number, data: Partial<User>) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    throw new Error('Failed to update user')
  }
  return response.json()
}

// Delete user (super_admin only)
export const deleteUser = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Super admin only')
    throw new Error('Failed to delete user')
  }
  return response.json()
}

// Get all requests (admin only)
export const getRequests = async (): Promise<SubstituteRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/requests/all`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    throw new Error('Failed to fetch all requests')
  }
  return response.json()
}

// Delete request (admin only)
export const deleteRequest = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    throw new Error('Failed to delete request')
  }
  return response.json()
}

// Get dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [users, allRequests] = await Promise.all([
      getUsers(),
      getRequests(),
    ])

    return {
      totalUsers: users.length,
      totalRequests: allRequests.length,
      pendingRequests: allRequests.filter(r => r.status === 'pending').length,
      acceptedRequests: allRequests.filter(r => r.status === 'accepted').length,
    }
  } catch {
    return {
      totalUsers: 0,
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
    }
  }
}

// Notification types
export interface NotificationRequest {
  title: string
  body: string
  target_type: 'all' | 'specific' | 'department'
  user_ids?: number[]
  department?: string
  data?: Record<string, unknown>
}

export interface NotificationResponse {
  success: boolean
  sent_count: number
  failed_count: number
  message: string
}

// Send notification (admin only)
export const sendNotification = async (notification: NotificationRequest): Promise<NotificationResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(notification),
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    const error = await response.json()
    throw new Error(error.detail || 'Failed to send notification')
  }
  
  return response.json()
}

// Get departments for notification targeting
export const getDepartments = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/notifications/departments`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    throw new Error('Failed to fetch departments')
  }
  
  const data = await response.json()
  return data.departments || []
}

// =============================================
// INVITE TYPES AND FUNCTIONS
// =============================================

export interface InviteUserRequest {
  email: string
  name: string
  department?: string
  phone?: string
}

export interface InviteResponse {
  success: boolean
  message: string
  invite_token?: string
  email?: string
}

export interface BulkInviteResponse {
  success: boolean
  total: number
  sent: number
  failed: number
  errors: string[]
}

export interface PendingInvite {
  id: number
  email: string
  name: string
  department?: string
  phone?: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
}

// Invite a single user
export const inviteUser = async (invite: InviteUserRequest): Promise<InviteResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/invite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(invite),
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    const error = await response.json()
    throw new Error(error.detail || 'Failed to send invite')
  }
  
  return response.json()
}

// Bulk invite users (from CSV)
export const bulkInviteUsers = async (users: InviteUserRequest[]): Promise<BulkInviteResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/invite/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ users }),
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    const error = await response.json()
    throw new Error(error.detail || 'Failed to send invites')
  }
  
  return response.json()
}

// Get pending invites
export const getPendingInvites = async (): Promise<PendingInvite[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/invites`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    throw new Error('Failed to fetch pending invites')
  }
  
  return response.json()
}

// Cancel/delete an invite
export const cancelInvite = async (inviteId: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/invites/${inviteId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    throw new Error('Failed to cancel invite')
  }
  
  return response.json()
}

// Resend invite email
export const resendInvite = async (inviteId: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/admin/invites/${inviteId}/resend`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login again')
    if (response.status === 403) throw new Error('Access denied - Admin only')
    const error = await response.json()
    throw new Error(error.detail || 'Failed to resend invite')
  }
  
  return response.json()
}
