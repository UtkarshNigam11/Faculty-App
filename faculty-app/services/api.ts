import { Platform } from 'react-native';

// IMPORTANT: For mobile devices, replace this IP with your computer's local IP
// Run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux to find it
// Your current IPs: 172.16.0.2 or 10.5.85.207
const LOCAL_IP = '10.5.85.207'; // Change this to your computer's IP if needed

// Use localhost for web, IP address for mobile devices
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000/api'
  : `http://${LOCAL_IP}:8000/api`;

console.log('API URL:', API_BASE_URL); // Debug log

// Helper to append @kiit.ac.in to email
export const formatEmail = (username: string): string => {
  return `${username.toLowerCase().trim()}@kiit.ac.in`;
};

// Health check
export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};

// Auth APIs
export const signup = async (data: {
  username: string;
  password: string;
  name: string;
  department?: string;
  phone?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formatEmail(data.username),
      password: data.password,
      name: data.name,
      department: data.department,
      phone: data.phone,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Signup failed');
  }
  
  return response.json();
};

export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formatEmail(username),
      password,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  
  return response.json();
};

// Requests APIs
export const getPendingRequests = async () => {
  const response = await fetch(`${API_BASE_URL}/requests/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch requests');
  }
  
  return response.json();
};

export const getTeacherRequests = async (teacherId: number) => {
  const response = await fetch(`${API_BASE_URL}/requests/teacher/${teacherId}/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch teacher requests');
  }
  
  return response.json();
};

export const createRequest = async (data: {
  teacher_id: number;
  subject: string;
  date: string;
  time: string;
  duration: number;
  classroom: string;
  notes?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/requests/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create request');
  }
  
  return response.json();
};

export const acceptRequest = async (requestId: number, teacherId: number) => {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/accept/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacher_id: teacherId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to accept request');
  }
  
  return response.json();
};

export const cancelRequest = async (requestId: number, teacherId: number) => {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/cancel/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacher_id: teacherId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to cancel request');
  }
  
  return response.json();
};

// Users APIs
export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
};

export const getUser = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  
  return response.json();
};
