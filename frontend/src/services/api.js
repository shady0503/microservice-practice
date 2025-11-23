const API_BASE_URL = 'http://localhost:8081/api'

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken')
}

// Helper function to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

// Authentication API
export const authAPI = {
  register: async (data) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  login: async (email, password) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
}

// User API
export const userAPI = {
  getCurrentUser: async () => {
    return fetchWithAuth('/users/me')
  },

  getUserById: async (id) => {
    return fetchWithAuth(`/users/${id}`)
  },

  getAllUsers: async () => {
    return fetchWithAuth('/users/admin/all')
  },

  updateUser: async (id, data) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteUser: async (id) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  updateUserRole: async (id, role) => {
    return fetchWithAuth(`/users/admin/${id}/role?role=${role}`, {
      method: 'PUT',
    })
  },

  changePassword: async (currentPassword, newPassword) => {
    return fetchWithAuth('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
}

// Token management
export const tokenManager = {
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  },

  getAccessToken: () => {
    return localStorage.getItem('accessToken')
  },

  getRefreshToken: () => {
    return localStorage.getItem('refreshToken')
  },

  clearTokens: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
}

