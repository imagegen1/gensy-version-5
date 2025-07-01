/**
 * Settings Page for Gensy AI Creative Suite
 * User settings and preferences management
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SettingsPanel } from '@/components/settings/SettingsPanel'

export default async function SettingsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/auth/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <SettingsPanel />
      </div>
    </div>
  )
}
