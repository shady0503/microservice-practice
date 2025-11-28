// UUID Helper for converting user IDs to UUIDs for ticket service
// User Service uses Long IDs, but Ticket Service requires UUIDs
// We use UUIDv5 (namespace-based) for consistent, deterministic conversion

import { v5 as uuidv5 } from 'uuid'

// Custom namespace for UrbanMove user IDs
const URBANMOVE_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

/**
 * Convert a user ID (Long/number) to a UUID
 * @param {number|string} userId - The user ID from the User Service
 * @returns {string} A UUIDv5 string
 */
export const userIdToUUID = (userId) => {
  if (!userId) throw new Error('User ID is required')

  // Convert to string and create UUIDv5
  const userIdString = String(userId)
  return uuidv5(userIdString, URBANMOVE_NAMESPACE)
}

/**
 * Convert a UUID back to the original user ID representation
 * Note: This is for display purposes only. The actual user ID is stored in the backend.
 * @param {string} uuid - The UUID string
 * @returns {string} The UUID (cannot be reversed to original ID)
 */
export const uuidToUserId = (uuid) => {
  // UUID to ID conversion is not possible with UUIDv5
  // This function exists for API compatibility
  return uuid
}

export default {
  userIdToUUID,
  uuidToUserId
}
