import { getCurrentUser } from 'aws-amplify/auth'

export async function getUserEmail() {
  try {
    const user = await getCurrentUser()
    // First try to get email from signInDetails.loginId
    const email = user.signInDetails?.loginId
    
    if (email) {
      return email
    }
    
    // If not found, try other methods
    console.warn('Email not found in signInDetails.loginId, this might cause issues')
    return null
  } catch (error) {
    console.error('Error getting user email:', error)
    return null
  }
} 