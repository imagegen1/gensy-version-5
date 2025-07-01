/**
 * Onboarding Page for Gensy AI Creative Suite
 * Guides new users through initial setup and preferences
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  SparklesIcon, 
  CheckIcon, 
  ArrowRightIcon,
  PaintBrushIcon,
  PhotoIcon,
  VideoCameraIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Gensy',
    description: 'Let\'s get you started with AI-powered creative tools',
    icon: SparklesIcon
  },
  {
    id: 'preferences',
    title: 'Set Your Preferences',
    description: 'Tell us about your creative interests',
    icon: CogIcon
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start creating amazing content with AI',
    icon: CheckIcon
  }
]

const creativeInterests = [
  { id: 'image-generation', name: 'AI Image Generation', icon: PaintBrushIcon },
  { id: 'image-upscaling', name: 'Image Enhancement', icon: PhotoIcon },
  { id: 'video-creation', name: 'Video Generation', icon: VideoCameraIcon },
]

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isCompleting, setIsCompleting] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth/sign-in')
    }
  }, [isLoaded, user, router])

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    
    try {
      // Save user preferences
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interests: selectedInterests,
          onboarding_completed: true,
        }),
      })

      if (response.ok) {
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        console.error('Failed to save preferences')
        // Still redirect to dashboard even if preferences fail
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still redirect to dashboard
      router.push('/dashboard')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const currentStepData = onboardingSteps[currentStep]
  const IconComponent = currentStepData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Gensy</h1>
                <p className="text-sm text-gray-500">AI Creative Suite</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip setup
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          {onboardingSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${index <= currentStep 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-400'
                }
              `}>
                {index < currentStep ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < onboardingSteps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-4 transition-colors
                  ${index < currentStep ? 'bg-primary-600' : 'bg-gray-300'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <IconComponent className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {/* Step-specific content */}
          {currentStep === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Hello, {user.firstName || 'there'}! 👋
                </h3>
                <p className="text-gray-600 mb-6">
                  Welcome to Gensy AI Creative Suite. We're excited to help you create amazing content with the power of AI.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <PaintBrushIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Generate Images</h4>
                    <p className="text-sm text-gray-600">Create stunning visuals from text</p>
                  </div>
                  <div className="text-center p-4 bg-secondary-50 rounded-lg">
                    <PhotoIcon className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Enhance Quality</h4>
                    <p className="text-sm text-gray-600">Upscale and improve images</p>
                  </div>
                  <div className="text-center p-4 bg-accent-50 rounded-lg">
                    <VideoCameraIcon className="h-8 w-8 text-accent-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Create Videos</h4>
                    <p className="text-sm text-gray-600">Generate videos from prompts</p>
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  Get Started
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  What interests you most?
                </h3>
                <p className="text-gray-600">
                  Select the creative tools you'd like to explore (you can change this later).
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                {creativeInterests.map((interest) => {
                  const IconComponent = interest.icon
                  const isSelected = selectedInterests.includes(interest.id)
                  
                  return (
                    <button
                      key={interest.id}
                      onClick={() => handleInterestToggle(interest.id)}
                      className={`
                        w-full p-4 rounded-lg border-2 transition-all text-left flex items-center
                        ${isSelected 
                          ? 'border-primary-600 bg-primary-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <IconComponent className={`h-6 w-6 mr-3 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                        {interest.name}
                      </span>
                      {isSelected && (
                        <CheckIcon className="h-5 w-5 text-primary-600 ml-auto" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  Continue
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Perfect! You're all set up.
              </h3>
              <p className="text-gray-600 mb-6">
                Your account is ready and your preferences have been saved. 
                You can start creating amazing content right away!
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">🎉 Your Free Plan Includes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 10 free credits per month</li>
                  <li>• Access to all AI tools</li>
                  <li>• Personal gallery</li>
                  <li>• Community support</li>
                </ul>
              </div>

              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
