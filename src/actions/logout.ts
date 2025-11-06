'use server'

import { logoutUser } from './auth'

export async function handleLogout() {
  return await logoutUser()
}
