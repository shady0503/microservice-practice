import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, userAPI, tokenManager } from '@/services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Test/Bypass accounts for development (no backend required)
const TEST_ACCOUNTS = {
  'test@test.com': {
    password: 'test123',
    user: {
      id: 'test-user-1',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+212 6 12 34 56 78',
      role: 'USER',
      active: true,
      createdAt: new Date().toISOString(),
    },
  },
  'admin@test.com': {
    password: 'admin123',
    user: {
      id: 'test-admin-1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'Test',
      phoneNumber: '+212 6 98 76 54 32',
      role: 'ADMIN',
      active: true,
      createdAt: new Date().toISOString(),
    },
  },
}

// Mock users list for admin testing
const MOCK_USERS = [
  TEST_ACCOUNTS['test@test.com'].user,
  TEST_ACCOUNTS['admin@test.com'].user,
  {
    id: 'test-user-2',
    email: 'driver@test.com',
    firstName: 'Driver',
    lastName: 'Test',
    phoneNumber: '+212 6 11 22 33 44',
    role: 'DRIVER',
    active: true,
    createdAt: new Date().toISOString(),
  },
]

const isTestAccount = (email) => {
  return Object.keys(TEST_ACCOUNTS).includes(email.toLowerCase())
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isTestMode, setIsTestMode] = useState(false)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getAccessToken()
      const storedUser = localStorage.getItem('testUser')
      
      // Check for test mode user first
      if (storedUser) {
        try {
          const testUser = JSON.parse(storedUser)
          setUser(testUser)
          setIsTestMode(true)
          setLoading(false)
          return
        } catch (err) {
          localStorage.removeItem('testUser')
        }
      }
      
      if (token) {
        try {
          const userData = await userAPI.getCurrentUser()
          setUser(userData)
          setIsTestMode(false)
        } catch (err) {
          tokenManager.clearTokens()
          setUser(null)
          setIsTestMode(false)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      
      // Check if this is a test account
      if (isTestAccount(email)) {
        const testAccount = TEST_ACCOUNTS[email.toLowerCase()]
        if (testAccount.password === password) {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500))
          
          setUser(testAccount.user)
          setIsTestMode(true)
          localStorage.setItem('testUser', JSON.stringify(testAccount.user))
          
          return {
            accessToken: 'test-token-' + Date.now(),
            refreshToken: 'test-refresh-token',
            user: testAccount.user,
          }
        } else {
          throw new Error('Invalid password for test account')
        }
      }
      
      // Regular backend login
      const response = await authAPI.login(email, password)
      tokenManager.setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      setIsTestMode(false)
      localStorage.removeItem('testUser')
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      
      // Check if registering with test email
      if (isTestAccount(userData.email)) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const testAccount = TEST_ACCOUNTS[userData.email.toLowerCase()]
        setUser(testAccount.user)
        setIsTestMode(true)
        localStorage.setItem('testUser', JSON.stringify(testAccount.user))
        
        return {
          accessToken: 'test-token-' + Date.now(),
          refreshToken: 'test-refresh-token',
          user: testAccount.user,
        }
      }
      
      // Regular backend registration
      const response = await authAPI.register(userData)
      tokenManager.setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      setIsTestMode(false)
      localStorage.removeItem('testUser')
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    tokenManager.clearTokens()
    localStorage.removeItem('testUser')
    setUser(null)
    setError(null)
    setIsTestMode(false)
  }

  const updateUser = async (id, data) => {
    try {
      setError(null)
      
      // Test mode: update locally
      if (isTestMode && user?.id === id) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const updatedUser = { ...user, ...data }
        setUser(updatedUser)
        localStorage.setItem('testUser', JSON.stringify(updatedUser))
        return updatedUser
      }
      
      // Regular backend update
      const updatedUser = await userAPI.updateUser(id, data)
      if (user?.id === id) {
        setUser(updatedUser)
      }
      return updatedUser
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Alias for updateProfile - updates current user's profile
  const updateProfile = async (userData) => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }
    return updateUser(user.id, userData)
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null)
      
      // Test mode: just validate and return success
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 500))
        // In test mode, any password change is accepted
        return { success: true, message: 'Password changed successfully (test mode)' }
      }
      
      // Regular backend password change
      return await userAPI.changePassword(currentPassword, newPassword)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const getAllUsers = async () => {
    try {
      setError(null)
      
      // Test mode: return mock users
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return MOCK_USERS
      }
      
      // Regular backend call
      return await userAPI.getAllUsers()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateUserRole = async (userId, role) => {
    try {
      setError(null)
      
      // Test mode: update mock users
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const userIndex = MOCK_USERS.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          MOCK_USERS[userIndex].role = role
          return MOCK_USERS[userIndex]
        }
        return { id: userId, role }
      }
      
      // Regular backend call
      return await userAPI.updateUserRole(userId, role)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteUser = async (userId) => {
    try {
      setError(null)
      
      // Test mode: remove from mock users
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        const userIndex = MOCK_USERS.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          MOCK_USERS.splice(userIndex, 1)
        }
        return
      }
      
      // Regular backend call
      await userAPI.deleteUser(userId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const refreshUser = async () => {
    try {
      // Test mode: return current test user
      if (isTestMode && user) {
        return user
      }
      
      // Regular backend call
      const userData = await userAPI.getCurrentUser()
      setUser(userData)
      return userData
    } catch (err) {
      tokenManager.clearTokens()
      localStorage.removeItem('testUser')
      setUser(null)
      setIsTestMode(false)
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    deleteUser,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTestMode, // Expose test mode status
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

