# Gensy AI Creative Suite - UI/UX Design System

---
title: Gensy AI Creative Suite - UI/UX Design System
description: Comprehensive design system and user experience specifications for the AI-powered creative platform
feature: Complete Platform Design
last-updated: 2025-01-09
version: 1.0.0
status: approved
---

## Executive Summary

**Gensy AI Creative Suite** requires a design system that embodies **bold simplicity** while handling complex AI workflows elegantly. The design philosophy centers on **frictionless creativity** - removing barriers between user intent and AI-generated results through intuitive interfaces that feel effortless yet powerful.

### Design Philosophy

- **Bold Simplicity**: Clean, uncluttered interfaces that prioritize user goals over decorative elements
- **Intelligent Hierarchy**: Strategic use of color, typography, and spacing to guide users through complex AI workflows
- **Transparent Value**: Clear visualization of credit costs, generation progress, and quality options
- **Accessible Premium**: Professional-grade tools that remain approachable for beginners
- **Cultural Sensitivity**: Design patterns optimized for the Indian creative market

### Key Design Challenges Addressed

1. **Multi-Provider Complexity**: Unified interface across Google Vertex AI, ByteDance, BFL, and MiniMax
2. **Credit Transparency**: Clear cost visualization without creating friction
3. **Generation Workflows**: Streamlined flows for image/video creation with advanced options
4. **Tier Differentiation**: Subtle UI differences that reflect subscription value
5. **Performance Communication**: Clear feedback for long-running AI operations

## Design System Foundation

### 1. Color System

**Primary Colors**
- **Primary**: `#6366F1` – Main CTAs, brand elements, generation buttons
- **Primary Dark**: `#4F46E5` – Hover states, emphasis, active states
- **Primary Light**: `#E0E7FF` – Subtle backgrounds, highlights, selected states

**Secondary Colors**
- **Secondary**: `#10B981` – Success states, completed generations
- **Secondary Light**: `#D1FAE5` – Success backgrounds, positive feedback
- **Secondary Pale**: `#F0FDF4` – Subtle success highlights

**Accent Colors**
- **Accent Primary**: `#F59E0B` – Credit indicators, premium features
- **Accent Secondary**: `#EF4444` – Warnings, error states, destructive actions
- **Gradient Start**: `#6366F1` – Hero sections, premium feature highlights
- **Gradient End**: `#8B5CF6` – Gradient completions, visual interest

**Semantic Colors**
- **Success**: `#10B981` – Generation complete, payment success
- **Warning**: `#F59E0B` – Low credits, processing delays
- **Error**: `#EF4444` – Generation failed, payment errors
- **Info**: `#3B82F6` – Tips, feature explanations, help text

**Neutral Palette**
- `Neutral-50`: `#FAFAFA` – Page backgrounds, card backgrounds
- `Neutral-100`: `#F5F5F5` – Subtle backgrounds, disabled states
- `Neutral-200`: `#E5E5E5` – Borders, dividers
- `Neutral-300`: `#D4D4D4` – Input borders, inactive elements
- `Neutral-400`: `#A3A3A3` – Placeholder text, secondary icons
- `Neutral-500`: `#737373` – Secondary text, captions
- `Neutral-600`: `#525252` – Primary text, body content
- `Neutral-700`: `#404040` – Headings, emphasis text
- `Neutral-800`: `#262626` – High contrast text, navigation
- `Neutral-900`: `#171717` – Maximum contrast, critical text

**Accessibility Notes**
- All color combinations meet WCAG AA standards (4.5:1 normal text, 3:1 large text)
- Critical interactions maintain 7:1 contrast ratio for enhanced accessibility
- Color-blind friendly palette verified with Coblis simulator

### 2. Typography System

**Font Stack**
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`
- **Monospace**: `JetBrains Mono, Consolas, Monaco, monospace`

**Font Weights**
- Light: 300, Regular: 400, Medium: 500, Semibold: 600, Bold: 700

**Type Scale**
- **H1**: `48px/56px, 700, -0.02em` – Page titles, hero headings
- **H2**: `36px/44px, 600, -0.01em` – Section headers, feature titles
- **H3**: `30px/38px, 600, 0em` – Subsection headers, card titles
- **H4**: `24px/32px, 600, 0em` – Component titles, form sections
- **H5**: `20px/28px, 500, 0em` – Minor headers, list titles
- **Body Large**: `18px/28px, 400` – Primary reading text, descriptions
- **Body**: `16px/24px, 400` – Standard UI text, form labels
- **Body Small**: `14px/20px, 400` – Secondary information, captions
- **Caption**: `12px/16px, 400` – Metadata, timestamps, credits
- **Label**: `14px/20px, 500, uppercase` – Form labels, categories
- **Code**: `14px/20px, 400, monospace` – Technical text, parameters

**Responsive Typography**
- **Mobile**: -2px base size adjustment for readability
- **Tablet**: Standard sizing with optimized line heights
- **Desktop**: Full scale with maximum reading comfort
- **Wide**: +2px scaling for large displays

### 3. Spacing & Layout System

**Base Unit**: `8px`

**Spacing Scale**
- `xs`: 4px – Micro spacing between related elements
- `sm`: 8px – Small spacing, internal padding
- `md`: 16px – Default spacing, standard margins
- `lg`: 24px – Medium spacing between sections
- `xl`: 32px – Large spacing, major section separation
- `2xl`: 48px – Extra large spacing, screen padding
- `3xl`: 64px – Huge spacing, hero sections

**Grid System**
- **Columns**: 12 (desktop), 8 (tablet), 4 (mobile)
- **Gutters**: 24px (desktop), 16px (tablet), 12px (mobile)
- **Margins**: 24px (desktop), 16px (tablet), 12px (mobile)
- **Container max-widths**: 1200px (desktop), 768px (tablet), 100% (mobile)

**Breakpoints**
- **Mobile**: 320px – 767px
- **Tablet**: 768px – 1023px
- **Desktop**: 1024px – 1439px
- **Wide**: 1440px+

### 4. Component Specifications

#### Primary Button
**Variants**: Primary, Secondary, Tertiary, Ghost
**States**: Default, Hover, Active, Focus, Disabled, Loading

**Visual Specifications**
- **Height**: `44px` (touch-friendly)
- **Padding**: `12px 24px` internal spacing
- **Border Radius**: `8px` modern, friendly corners
- **Border**: `2px solid transparent` (focus: primary color)
- **Shadow**: `0 1px 3px rgba(0,0,0,0.1)` subtle elevation
- **Typography**: Body, 500 weight, primary color

**Interaction Specifications**
- **Hover Transition**: `150ms ease-out` with 4% darker background
- **Click Feedback**: 2px scale down with 100ms spring back
- **Focus Indicator**: 2px solid primary color outline
- **Loading State**: Spinner animation with disabled appearance
- **Disabled State**: 50% opacity, no hover effects

#### Generation Card
**Purpose**: Display AI generation results with metadata and actions

**Visual Specifications**
- **Layout**: Flexible aspect ratio container with overlay controls
- **Border Radius**: `12px` for modern card appearance
- **Shadow**: `0 4px 12px rgba(0,0,0,0.1)` elevated appearance
- **Padding**: `16px` internal spacing for content
- **Background**: `Neutral-50` with hover elevation

**Interaction Specifications**
- **Hover**: Lift effect with increased shadow
- **Click**: Full-screen preview modal
- **Actions**: Download, share, delete with icon buttons
- **Metadata**: Model used, credits consumed, generation time

### 5. Motion & Animation System

**Timing Functions**
- **Ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)` – Entrances, expansions
- **Ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)` – Transitions, movements
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` – Playful interactions

**Duration Scale**
- **Micro**: 100ms – State changes, hover effects
- **Short**: 200ms – Local transitions, dropdowns
- **Medium**: 400ms – Page transitions, modals
- **Long**: 600ms – Complex animations, onboarding

**Animation Principles**
- **Performance**: 60fps minimum, transform and opacity preferred
- **Purpose**: Every animation serves user understanding
- **Consistency**: Similar actions use similar timings
- **Accessibility**: Respects `prefers-reduced-motion`

## User Experience Strategy

### User Personas & Design Adaptations

#### 1. Creative Beginner (Starter Plan)
**Design Approach**: Guided, educational, confidence-building
- **Onboarding**: Step-by-step tutorials with visual guides
- **Interface**: Simplified options with helpful tooltips
- **Feedback**: Encouraging messages and learning resources
- **Credit Display**: Clear remaining balance with usage tips

#### 2. Professional Creator (Pro Plan)
**Design Approach**: Efficient, powerful, customizable
- **Workflow**: Streamlined generation with quick access to favorites
- **Interface**: Advanced options available but not overwhelming
- **Feedback**: Performance metrics and optimization suggestions
- **Credit Display**: Usage analytics and renewal reminders

#### 3. Business User (Business Plan)
**Design Approach**: Collaborative, scalable, brand-focused
- **Team Features**: Shared galleries and brand consistency tools
- **Interface**: Batch operations and template management
- **Feedback**: Team usage reports and collaboration features
- **Credit Display**: Team usage breakdown and budget tracking

#### 4. Enterprise Client (Enterprise Plan)
**Design Approach**: Powerful, customizable, API-integrated
- **Advanced Features**: API access, custom integrations
- **Interface**: Full feature access with customization options
- **Feedback**: Detailed analytics and performance monitoring
- **Credit Display**: Comprehensive usage reporting and forecasting

### Core User Journeys

#### Image Generation Journey
**Entry Point**: Dashboard → Generate Image
1. **Prompt Input**: Large, prominent text area with placeholder examples
2. **Model Selection**: Visual cards showing model capabilities and credit costs
3. **Style Configuration**: Intuitive controls with live previews
4. **Advanced Options**: Collapsible section for power users
5. **Generation**: Clear progress indicator with estimated time
6. **Result Review**: Full-screen preview with metadata and actions
7. **Gallery Save**: One-click save with automatic categorization

#### Video Generation Journey
**Entry Point**: Dashboard → Generate Video
1. **Mode Selection**: Clear choice between text-to-video and image-to-video
2. **Input Configuration**: Appropriate inputs based on selected mode
3. **Model & Quality**: Visual comparison of output quality vs. credit cost
4. **Advanced Settings**: Duration, aspect ratio, motion intensity
5. **Queue Submission**: Clear explanation of processing time
6. **Progress Tracking**: Real-time updates with ability to queue more
7. **Result Delivery**: Video player with download and sharing options

#### Credit Management Journey
**Entry Point**: Low credit notification or pricing page
1. **Current Usage**: Visual representation of credit consumption
2. **Plan Comparison**: Clear value proposition for each tier
3. **Payment Flow**: Streamlined PhonePe integration
4. **Confirmation**: Immediate credit allocation with receipt
5. **Usage Optimization**: Tips for efficient credit usage

## Feature Design Specifications

### Dashboard Experience
**Purpose**: Central hub for all user activities and quick access to tools

**Layout Structure**
- **Header**: Navigation, credit balance, user profile
- **Hero Section**: Welcome message with quick action buttons
- **Usage Overview**: Visual analytics of recent activity
- **Quick Access**: Direct links to generation tools
- **Recent Gallery**: Preview of latest creations
- **Tips & Updates**: Contextual help and feature announcements

**Visual Hierarchy**
1. **Credit Balance**: Prominent display with color-coded status
2. **Primary Actions**: Large, colorful buttons for main features
3. **Recent Activity**: Card-based layout with thumbnails
4. **Secondary Information**: Subtle placement of tips and updates

### AI Generation Interface
**Purpose**: Streamlined workflow for creating AI-generated content

**Core Components**
- **Prompt Input**: Expandable text area with smart suggestions
- **Model Selector**: Visual cards with capability comparison
- **Parameter Controls**: Intuitive sliders and dropdowns
- **Credit Calculator**: Real-time cost estimation
- **Generation Queue**: Progress tracking for multiple requests
- **Result Gallery**: Immediate preview with action buttons

**Progressive Disclosure**
- **Basic Mode**: Essential controls only (prompt, model, generate)
- **Advanced Mode**: Full parameter control for power users
- **Expert Mode**: Raw parameter input for maximum control

### Gallery & Asset Management
**Purpose**: Organize, browse, and manage generated content

**View Modes**
- **Masonry**: Pinterest-style layout optimizing space usage
- **Grid**: Uniform cards for consistent browsing
- **List**: Detailed view with metadata and actions

**Filtering & Search**
- **Type Filter**: Images, videos, upscaled content
- **Model Filter**: Filter by AI provider and model
- **Date Range**: Calendar-based date selection
- **Style Filter**: Artistic style categorization
- **Search**: Text search across prompts and metadata

**Interaction Patterns**
- **Hover**: Quick preview with action buttons
- **Click**: Full-screen modal with detailed view
- **Multi-select**: Batch operations for power users
- **Drag & Drop**: Organize into collections

## Responsive Design Guidelines

### Mobile (320px - 767px)
**Layout Adaptations**
- **Single Column**: Stack all content vertically
- **Touch Targets**: Minimum 44px for all interactive elements
- **Navigation**: Collapsible hamburger menu
- **Generation**: Simplified parameter controls
- **Gallery**: Single column masonry layout

**Interaction Patterns**
- **Swipe**: Navigate between gallery items
- **Pull-to-Refresh**: Update content feeds
- **Long Press**: Access context menus
- **Pinch-to-Zoom**: Image detail viewing

### Tablet (768px - 1023px)
**Layout Adaptations**
- **Two Column**: Sidebar navigation with main content
- **Mixed Interaction**: Touch and mouse support
- **Generation**: Expanded parameter panel
- **Gallery**: Two-column masonry layout

### Desktop (1024px+)
**Layout Adaptations**
- **Multi-Column**: Full sidebar with content areas
- **Hover States**: Rich interactive feedback
- **Keyboard Navigation**: Full keyboard accessibility
- **Generation**: Complete parameter control panel
- **Gallery**: Multi-column masonry with hover previews

## Accessibility Standards

### WCAG AA Compliance
- **Color Contrast**: 4.5:1 minimum for normal text, 3:1 for large text
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader**: Proper ARIA labels and semantic markup
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Descriptive alt text for all generated content

### Inclusive Design Principles
- **Motor Accessibility**: Large touch targets, generous spacing
- **Cognitive Accessibility**: Clear language, consistent patterns
- **Visual Accessibility**: High contrast mode support
- **Reduced Motion**: Respect user motion preferences

## Implementation Guidelines

### Technical Requirements
- **Framework**: Next.js 15 with React 18 and TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: shadcn/ui base with custom extensions
- **State Management**: React hooks and context for UI state
- **Performance**: Lazy loading, image optimization, code splitting

### Design Token Integration
```css
:root {
  --color-primary: #6366F1;
  --color-primary-dark: #4F46E5;
  --color-primary-light: #E0E7FF;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --border-radius: 8px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
}
```

### Component Development Standards
- **Atomic Design**: Build from atoms to organisms
- **Prop Consistency**: Standardized prop naming across components
- **TypeScript**: Full type safety for all component interfaces
- **Testing**: Unit tests for all interactive components
- **Documentation**: Storybook documentation for component library

---

*This UI/UX design system provides the foundation for creating a cohesive, accessible, and delightful user experience across the Gensy AI Creative Suite platform.*
