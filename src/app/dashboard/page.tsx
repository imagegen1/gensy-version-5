/**
 * Dashboard Page for Gensy AI Creative Suite
 * Main user dashboard after authentication
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardPage() {
  // Check authentication
  const { userId } = await auth()

  if (!userId) {
    redirect('/auth/sign-in')
  }

  // Get user data
  const clerkUser = await currentUser()
  const userResult = await getCurrentUser()

  // Serialize user data for client components
  const serializedUser = clerkUser ? {
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses.map(email => ({
      emailAddress: email.emailAddress
    })),
    imageUrl: clerkUser.imageUrl
  } : null

  return (
    <DashboardLayout
      title="Dashboard"
      description="Welcome back! Here's what's happening with your creative projects."
    >
      <DashboardContent
        user={serializedUser}
        userData={userResult.success ? userResult.user : null}
      />
    </DashboardLayout>
  )
}

