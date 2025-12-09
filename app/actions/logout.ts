'use server'

import { signOut } from './auth'

export async function logoutAction(organizationSlug?: string) {
  await signOut(organizationSlug)
}

