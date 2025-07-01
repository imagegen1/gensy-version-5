/**
 * UI Components Library for Gensy AI Creative Suite
 * Central export file for all UI components
 */

// Button components
export { Button, buttonVariants } from './Button'
export type { ButtonProps } from './Button'

// Input components
export { Input, inputVariants } from './Input'
export type { InputProps } from './Input'

// Card components
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
} from './Card'
export type { CardProps } from './Card'

// Badge components
export { Badge, badgeVariants } from './Badge'
export type { BadgeProps } from './Badge'

// Modal components
export { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
export type { ModalProps } from './Modal'

// Toast components
export { ToastProvider, useToast, toast } from './Toast'
export type { Toast, ToastType } from './Toast'

// Loading components
export { 
  LoadingSpinner, 
  LoadingDots, 
  LoadingSkeleton, 
  LoadingOverlay, 
  LoadingPage 
} from './Loading'
export type { 
  LoadingSpinnerProps, 
  LoadingDotsProps, 
  LoadingSkeletonProps, 
  LoadingOverlayProps, 
  LoadingPageProps 
} from './Loading'

// Utility functions for components
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}
