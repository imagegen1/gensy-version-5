'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { 
  SparklesIcon, 
  UserIcon, 
  PhotoIcon, 
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
}

interface OnboardingStepProps {
  onNext: () => void
  onPrev: () => void
  onComplete: () => void
  currentStep: number
  totalSteps: number
}

function WelcomeStep({ onNext, currentStep, totalSteps }: OnboardingStepProps) {
  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
        <SparklesIcon className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Welcome to Gensy!
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Your AI-powered creative suite for generating stunning images, videos, and more. 
        Let's get you set up in just a few quick steps.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <PhotoIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Generate Images</h3>
          <p className="text-sm text-gray-600">Create stunning AI-generated images from text descriptions</p>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg">
          <SparklesIcon className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Upscale & Enhance</h3>
          <p className="text-sm text-gray-600">Improve image quality and resolution with AI</p>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <UserIcon className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Easy to Use</h3>
          <p className="text-sm text-gray-600">Intuitive interface designed for creators of all levels</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
      >
        Get Started
        <ArrowRightIcon className="w-5 h-5 ml-2" />
      </button>
    </div>
  )
}

function ProfileStep({ onNext, onPrev, currentStep, totalSteps }: OnboardingStepProps) {
  const { user } = useUser()
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const availableInterests = [
    'Digital Art', 'Photography', 'Marketing', 'Social Media', 
    'Web Design', 'Gaming', 'Education', 'Business',
    'Fashion', 'Architecture', 'Illustration', 'Concept Art'
  ]

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleNext = async () => {
    setLoading(true)
    try {
      // Save user preferences
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests,
          onboarding_completed: false
        })
      })
      onNext()
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
          <UserIcon className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tell us about yourself
        </h2>
        
        <p className="text-lg text-gray-600">
          Help us personalize your experience by selecting your interests
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What are you interested in?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableInterests.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`p-3 rounded-lg border-2 transition-all ${
                interests.includes(interest)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleNext}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}

function TourStep({ onNext, onPrev, currentStep, totalSteps }: OnboardingStepProps) {
  const features = [
    {
      title: 'Dashboard',
      description: 'Monitor your usage, credits, and recent generations',
      icon: '📊'
    },
    {
      title: 'Generate',
      description: 'Create images, videos, and upscale existing content',
      icon: '✨'
    },
    {
      title: 'Gallery',
      description: 'View, organize, and manage all your creations',
      icon: '🖼️'
    },
    {
      title: 'Settings',
      description: 'Customize your preferences and account settings',
      icon: '⚙️'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Explore the features
        </h2>
        
        <p className="text-lg text-gray-600">
          Here's a quick overview of what you can do with Gensy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
        
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          Continue
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}

function FirstGenerationStep({ onComplete, onPrev, currentStep, totalSteps }: OnboardingStepProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      // Mark onboarding as completed
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_completed: true
        })
      })
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setCompleting(false)
    }
  }

  const handleTryGeneration = () => {
    router.push('/generate/image?onboarding=true')
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mb-6">
        <CheckIcon className="w-8 h-8 text-white" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        You're all set!
      </h2>
      
      <p className="text-lg text-gray-600 mb-8">
        Ready to create your first AI-generated image? We've given you 10 free credits to get started.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
        <p className="text-blue-800">
          Be specific in your prompts! Instead of "a dog", try "a golden retriever sitting in a sunny garden with flowers"
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleTryGeneration}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          Try Your First Generation
          <SparklesIcon className="w-5 h-5 ml-2" />
        </button>
        
        <button
          onClick={handleComplete}
          disabled={completing}
          className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {completing ? 'Finishing...' : 'Skip for Now'}
        </button>
      </div>

      <div className="mt-6">
        <button
          onClick={onPrev}
          className="flex items-center mx-auto text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>
    </div>
  )
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Introduction to Gensy',
      component: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Tell us about yourself',
      component: ProfileStep
    },
    {
      id: 'tour',
      title: 'Feature Tour',
      description: 'Explore the platform',
      component: TourStep
    },
    {
      id: 'first-generation',
      title: 'Get Started',
      description: 'Create your first generation',
      component: FirstGenerationStep
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <CurrentStepComponent
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
            currentStep={currentStep}
            totalSteps={steps.length}
          />
        </div>
      </div>
    </div>
  )
}
