'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { z } from 'zod'
import { PhotoIcon, UserIcon } from '@heroicons/react/24/outline'

// Profile validation schema
const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('light'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(false),
      generation_complete: z.boolean().default(true),
      credit_low: z.boolean().default(true),
      marketing: z.boolean().default(false),
    }).default({}),
    generation_defaults: z.object({
      image_style: z.enum(['realistic', 'artistic', 'cartoon', 'abstract']).default('realistic'),
      aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).default('1:1'),
      quality: z.enum(['standard', 'high', 'ultra']).default('standard'),
    }).default({}),
    privacy: z.object({
      profile_public: z.boolean().default(false),
      gallery_public: z.boolean().default(false),
      analytics_opt_out: z.boolean().default(false),
    }).default({}),
  }).default({}),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  onSave?: (data: ProfileFormData) => void
  className?: string
}

export function ProfileForm({ onSave, className = '' }: ProfileFormProps) {
  const { userId } = useAuth()
  const { user } = useUser()
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    avatar_url: '',
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        generation_complete: true,
        credit_low: true,
        marketing: false,
      },
      generation_defaults: {
        image_style: 'realistic',
        aspect_ratio: '1:1',
        quality: 'standard',
      },
      privacy: {
        profile_public: false,
        gallery_public: false,
        analytics_opt_out: false,
      },
    },
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.fullName || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        avatar_url: user.imageUrl || '',
      }))
    }
  }, [user])

  useEffect(() => {
    loadUserProfile()
  }, [userId])

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setFormData(prev => ({
            ...prev,
            full_name: data.user.full_name || prev.full_name,
            email: data.user.email || prev.email,
            avatar_url: data.user.avatar_url || prev.avatar_url,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setSuccess(false)

    try {
      // Validate form data
      const validatedData = profileSchema.parse(formData)

      // Update profile
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: validatedData.full_name,
          avatar_url: validatedData.avatar_url,
          preferences: validatedData.preferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setSuccess(true)
      onSave?.(validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'Unknown error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.')
      if (keys.length === 1) {
        return { ...prev, [field]: value }
      } else {
        const newData = { ...prev }
        let current: any = newData
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        return newData
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{errors.general}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">Profile updated successfully!</div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-sm text-gray-500">Email cannot be changed here. Use your account settings.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Avatar
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <button
                type="button"
                className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Avatar
              </button>
              <p className="mt-1 text-sm text-gray-500">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <select
            value={formData.preferences.theme}
            onChange={(e) => handleInputChange('preferences.theme', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Default Image Style</label>
          <select
            value={formData.preferences.generation_defaults.image_style}
            onChange={(e) => handleInputChange('preferences.generation_defaults.image_style', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="realistic">Realistic</option>
            <option value="artistic">Artistic</option>
            <option value="cartoon">Cartoon</option>
            <option value="abstract">Abstract</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Default Aspect Ratio</label>
          <select
            value={formData.preferences.generation_defaults.aspect_ratio}
            onChange={(e) => handleInputChange('preferences.generation_defaults.aspect_ratio', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1:1">Square (1:1)</option>
            <option value="16:9">Landscape (16:9)</option>
            <option value="9:16">Portrait (9:16)</option>
            <option value="4:3">Standard (4:3)</option>
            <option value="3:4">Portrait (3:4)</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
