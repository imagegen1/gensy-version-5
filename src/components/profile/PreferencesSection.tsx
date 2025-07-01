'use client'

import { useState } from 'react'
import { Switch } from '@headlessui/react'

interface NotificationPreferences {
  email: boolean
  push: boolean
  generation_complete: boolean
  credit_low: boolean
  marketing: boolean
}

interface GenerationPreferences {
  image_style: string
  aspect_ratio: string
  quality: string
}

interface PrivacyPreferences {
  profile_public: boolean
  gallery_public: boolean
  analytics_opt_out: boolean
}

interface PreferencesSectionProps {
  notifications: NotificationPreferences
  generation: GenerationPreferences
  privacy: PrivacyPreferences
  onChange: (section: string, key: string, value: any) => void
  className?: string
}

function ToggleSwitch({ 
  enabled, 
  onChange, 
  label, 
  description 
}: { 
  enabled: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-sm text-gray-500">{description}</div>
        )}
      </div>
      <Switch
        checked={enabled}
        onChange={onChange}
        className={`${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  )
}

export function PreferencesSection({
  notifications,
  generation,
  privacy,
  onChange,
  className = ''
}: PreferencesSectionProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-4">
          <ToggleSwitch
            enabled={notifications.email}
            onChange={(value) => onChange('notifications', 'email', value)}
            label="Email Notifications"
            description="Receive notifications via email"
          />
          
          <ToggleSwitch
            enabled={notifications.push}
            onChange={(value) => onChange('notifications', 'push', value)}
            label="Push Notifications"
            description="Receive browser push notifications"
          />
          
          <ToggleSwitch
            enabled={notifications.generation_complete}
            onChange={(value) => onChange('notifications', 'generation_complete', value)}
            label="Generation Complete"
            description="Notify when AI generation is finished"
          />
          
          <ToggleSwitch
            enabled={notifications.credit_low}
            onChange={(value) => onChange('notifications', 'credit_low', value)}
            label="Low Credits Warning"
            description="Alert when credits are running low"
          />
          
          <ToggleSwitch
            enabled={notifications.marketing}
            onChange={(value) => onChange('notifications', 'marketing', value)}
            label="Marketing Communications"
            description="Receive updates about new features and promotions"
          />
        </div>
      </div>

      {/* Generation Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generation Defaults</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Image Style
            </label>
            <select
              value={generation.image_style}
              onChange={(e) => onChange('generation', 'image_style', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="realistic">Realistic</option>
              <option value="artistic">Artistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="abstract">Abstract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Aspect Ratio
            </label>
            <select
              value={generation.aspect_ratio}
              onChange={(e) => onChange('generation', 'aspect_ratio', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Standard (4:3)</option>
              <option value="3:4">Portrait (3:4)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Quality
            </label>
            <select
              value={generation.quality}
              onChange={(e) => onChange('generation', 'quality', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Higher quality uses more credits
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
        <div className="space-y-4">
          <ToggleSwitch
            enabled={privacy.profile_public}
            onChange={(value) => onChange('privacy', 'profile_public', value)}
            label="Public Profile"
            description="Make your profile visible to other users"
          />
          
          <ToggleSwitch
            enabled={privacy.gallery_public}
            onChange={(value) => onChange('privacy', 'gallery_public', value)}
            label="Public Gallery"
            description="Allow others to see your generated content"
          />
          
          <ToggleSwitch
            enabled={privacy.analytics_opt_out}
            onChange={(value) => onChange('privacy', 'analytics_opt_out', value)}
            label="Opt Out of Analytics"
            description="Don't track my usage for analytics purposes"
          />
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Export Data</div>
              <div className="text-sm text-gray-500">Download all your data</div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              Export
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Delete Account</div>
              <div className="text-sm text-gray-500">Permanently delete your account and data</div>
            </div>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
