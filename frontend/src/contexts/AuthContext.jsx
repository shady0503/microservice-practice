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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getAccessToken()
      if (token) {
        try {
          const userData = await userAPI.getCurrentUser()
          setUser(userData)
        } catch (err) {
          console.error("Auth check failed:", err)
          tokenManager.clearTokens()
          setUser(null)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login(email, password)
      tokenManager.setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await authAPI.register(userData)
      tokenManager.setTokens(response.accessToken, response.refreshToken)
      setUser(response.user)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const logout = () => {
    tokenManager.clearTokens()
    setUser(null)
    setError(null)
  }

  const updateUser = async (id, data) => {
    try {
      setError(null)
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

  const updateProfile = async (userData) => {
    if (!user?.id) throw new Error('User not authenticated')
    return updateUser(user.id, userData)
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null)
      return await userAPI.changePassword(currentPassword, newPassword)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const getAllUsers = async () => {
    try {
      setError(null)
      return await userAPI.getAllUsers()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateUserRole = async (userId, role) => {
    try {
      setError(null)
      return await userAPI.updateUserRole(userId, role)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteUser = async (userId) => {
    try {
      setError(null)
      await userAPI.deleteUser(userId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await userAPI.getCurrentUser()
      setUser(userData)
      return userData
    } catch (err) {
      tokenManager.clearTokens()
      setUser(null)
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}