/**
 * Content Policy Enforcement for Gensy AI Creative Suite
 * 
 * Implements comprehensive content filtering to prevent inappropriate AI content generation
 * and ensure compliance with AI provider terms of service.
 * 
 * Critical security implementation addressing CVSS 8.7 vulnerability.
 */

import { createServiceRoleClient } from '@/lib/supabase/client'

// Content policy violation categories
export enum ViolationType {
  VIOLENCE = 'violence',
  ADULT_CONTENT = 'adult_content',
  HATE_SPEECH = 'hate_speech',
  ILLEGAL_ACTIVITIES = 'illegal_activities',
  SELF_HARM = 'self_harm',
  HARASSMENT = 'harassment',
  MISINFORMATION = 'misinformation',
  COPYRIGHT = 'copyright',
  PERSONAL_INFO = 'personal_info',
  SPAM = 'spam',
}

// Content policy result interface
export interface ContentPolicyResult {
  allowed: boolean
  violations: ViolationType[]
  confidence: number
  reason?: string
  flaggedTerms?: string[]
}

// Prohibited content patterns organized by category
const CONTENT_PATTERNS = {
  [ViolationType.VIOLENCE]: [
    // Violence and weapons
    /\b(violence|gore|blood|death|kill|murder|weapon|gun|knife|bomb|explosion|torture|assault|attack|fight|war|battle)\b/gi,
    /\b(shoot|stab|cut|hurt|harm|injure|wound|beat|punch|kick|slap|choke|strangle)\b/gi,
    /\b(terrorist|terrorism|massacre|genocide|execution|assassination|suicide bomber)\b/gi,
    /\b(rifle|pistol|shotgun|machine gun|ak-47|ar-15|grenade|dynamite|c4|tnt)\b/gi,
  ],

  [ViolationType.ADULT_CONTENT]: [
    // Adult and sexual content
    /\b(nude|naked|sex|porn|explicit|adult|nsfw|erotic|sexual|intimate|seductive)\b/gi,
    /\b(breast|nipple|penis|vagina|genitals|orgasm|masturbat|intercourse)\b/gi,
    /\b(lingerie|underwear|bikini|topless|bottomless|revealing|provocative)\b/gi,
    /\b(escort|prostitute|brothel|strip|stripper|cam girl|onlyfans)\b/gi,
  ],

  [ViolationType.HATE_SPEECH]: [
    // Hate speech and discrimination
    /\b(hate|racist|racism|discrimination|slur|nazi|fascist|supremacist)\b/gi,
    /\b(terrorist|jihad|infidel|kafir|goyim|kike|nigger|faggot|retard)\b/gi,
    /\b(holocaust denial|ethnic cleansing|racial purity|master race)\b/gi,
    /\b(burn|lynch|hang|gas|exterminate|cleanse|purge)\s+(jews|muslims|blacks|whites|asians|latinos|gays|trans)/gi,
  ],

  [ViolationType.ILLEGAL_ACTIVITIES]: [
    // Illegal activities and substances
    /\b(drugs|cocaine|heroin|meth|marijuana|cannabis|weed|lsd|ecstasy|mdma|crack|fentanyl)\b/gi,
    /\b(trafficking|smuggling|laundering|counterfeiting|fraud|scam|ponzi|pyramid)\b/gi,
    /\b(hacking|phishing|malware|virus|ransomware|ddos|botnet|exploit)\b/gi,
    /\b(child abuse|child porn|pedophile|minor|underage|loli|shota)\b/gi,
  ],

  [ViolationType.SELF_HARM]: [
    // Self-harm and suicide
    /\b(suicide|self-harm|cutting|overdose|hanging|jumping|pills|poison)\b/gi,
    /\b(kill myself|end my life|want to die|better off dead|suicide method)\b/gi,
    /\b(razor|blade|cut myself|hurt myself|harm myself|self-injury)\b/gi,
    /\b(anorexia|bulimia|eating disorder|starving|purging|binge)\b/gi,
  ],

  [ViolationType.HARASSMENT]: [
    // Harassment and bullying
    /\b(bully|harass|stalk|threaten|intimidate|doxx|swat|revenge)\b/gi,
    /\b(ugly|fat|stupid|worthless|loser|freak|disgusting|pathetic)\b/gi,
    /\b(kill yourself|kys|neck yourself|rope|an hero)\b/gi,
  ],

  [ViolationType.MISINFORMATION]: [
    // Medical and health misinformation
    /\b(covid.*hoax|vaccine.*autism|bleach.*cure|miracle.*cure|cancer.*conspiracy)\b/gi,
    /\b(flat earth|chemtrails|5g.*covid|microchip.*vaccine|plandemic)\b/gi,
    /\b(election.*stolen|voter.*fraud|deep state|qanon|pizzagate)\b/gi,
  ],

  [ViolationType.COPYRIGHT]: [
    // Copyright and trademark violations
    /\b(disney|marvel|dc comics|star wars|harry potter|pokemon|nintendo|sony|microsoft)\b/gi,
    /\b(mickey mouse|superman|batman|spiderman|pikachu|mario|sonic)\b/gi,
    /\b(coca cola|pepsi|mcdonalds|starbucks|apple logo|nike swoosh)\b/gi,
  ],

  [ViolationType.PERSONAL_INFO]: [
    // Personal information patterns
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
    /\b\d{16}\b/g, // Credit card pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number pattern
  ],

  [ViolationType.SPAM]: [
    // Spam and promotional content
    /\b(click here|buy now|limited time|act now|free money|get rich quick)\b/gi,
    /\b(viagra|cialis|weight loss|crypto|bitcoin|investment|forex)\b/gi,
    /\b(make money|work from home|earn \$\d+|guaranteed income)\b/gi,
  ],
}

// Severity levels for different violation types
const VIOLATION_SEVERITY = {
  [ViolationType.VIOLENCE]: 'high',
  [ViolationType.ADULT_CONTENT]: 'high',
  [ViolationType.HATE_SPEECH]: 'critical',
  [ViolationType.ILLEGAL_ACTIVITIES]: 'critical',
  [ViolationType.SELF_HARM]: 'critical',
  [ViolationType.HARASSMENT]: 'high',
  [ViolationType.MISINFORMATION]: 'medium',
  [ViolationType.COPYRIGHT]: 'medium',
  [ViolationType.PERSONAL_INFO]: 'high',
  [ViolationType.SPAM]: 'low',
} as const

/**
 * Main content policy enforcement function
 * Checks if content contains harmful or inappropriate material
 */
export function containsHarmfulContent(prompt: string): ContentPolicyResult {
  const violations: ViolationType[] = []
  const flaggedTerms: string[] = []
  let maxConfidence = 0

  // Normalize the prompt for analysis
  const normalizedPrompt = prompt.toLowerCase().trim()

  // Check against each violation category
  for (const [violationType, patterns] of Object.entries(CONTENT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalizedPrompt.match(pattern)
      if (matches) {
        violations.push(violationType as ViolationType)
        flaggedTerms.push(...matches)
        
        // Calculate confidence based on severity and number of matches
        const severity = VIOLATION_SEVERITY[violationType as ViolationType]
        const confidence = severity === 'critical' ? 0.9 : severity === 'high' ? 0.8 : severity === 'medium' ? 0.6 : 0.4
        maxConfidence = Math.max(maxConfidence, confidence + (matches.length * 0.1))
        
        break // Move to next category after first match
      }
    }
  }

  // Remove duplicates
  const uniqueViolations = [...new Set(violations)]
  const uniqueFlaggedTerms = [...new Set(flaggedTerms)]

  const allowed = uniqueViolations.length === 0
  const confidence = Math.min(maxConfidence, 1.0)

  return {
    allowed,
    violations: uniqueViolations,
    confidence,
    reason: allowed ? undefined : `Content violates policy: ${uniqueViolations.join(', ')}`,
    flaggedTerms: uniqueFlaggedTerms.length > 0 ? uniqueFlaggedTerms : undefined,
  }
}

/**
 * Advanced content analysis with context awareness
 */
export function analyzeContentContext(prompt: string, referenceImage?: string): ContentPolicyResult {
  // First run basic content policy check
  const basicResult = containsHarmfulContent(prompt)

  // If basic check fails, return immediately
  if (!basicResult.allowed) {
    return basicResult
  }

  // Additional context-aware checks
  const contextViolations: ViolationType[] = []

  // Check for subtle adult content requests
  const subtleAdultPatterns = [
    /\b(barely legal|teen|young|innocent|schoolgirl|cheerleader)\b/gi,
    /\b(tight|revealing|see-through|transparent|sheer)\b/gi,
    /\b(bedroom|shower|bath|changing|undressing)\b/gi,
  ]

  for (const pattern of subtleAdultPatterns) {
    if (pattern.test(prompt)) {
      contextViolations.push(ViolationType.ADULT_CONTENT)
      break
    }
  }

  // Check for violence in creative contexts that might be missed
  const contextualViolencePatterns = [
    /\b(blood.*art|gore.*aesthetic|violence.*beautiful|death.*artistic)\b/gi,
    /\b(torture.*scene|murder.*mystery|crime.*scene|autopsy)\b/gi,
  ]

  for (const pattern of contextualViolencePatterns) {
    if (pattern.test(prompt)) {
      contextViolations.push(ViolationType.VIOLENCE)
      break
    }
  }

  if (contextViolations.length > 0) {
    return {
      allowed: false,
      violations: [...basicResult.violations, ...contextViolations],
      confidence: 0.7,
      reason: `Content may violate policy in creative context: ${contextViolations.join(', ')}`,
      flaggedTerms: basicResult.flaggedTerms,
    }
  }

  return basicResult
}

/**
 * Log content policy violations for monitoring and improvement
 */
export async function logContentViolation(
  userId: string,
  prompt: string,
  violations: ViolationType[],
  confidence: number,
  flaggedTerms?: string[]
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    
    await supabase.from('content_violations').insert({
      user_id: userId,
      prompt_hash: hashPrompt(prompt), // Store hash for privacy
      violations,
      confidence,
      flagged_terms: flaggedTerms,
      created_at: new Date().toISOString(),
    })

    // Log for monitoring
    console.warn('Content policy violation:', {
      userId,
      violations,
      confidence,
      flaggedTerms,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log content violation:', error)
  }
}

/**
 * Hash prompt for privacy-preserving logging
 */
function hashPrompt(prompt: string): string {
  // Simple hash function for privacy
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Check if user has too many recent violations (abuse detection)
 */
export async function checkUserViolationHistory(userId: string): Promise<{
  shouldBlock: boolean
  violationCount: number
  reason?: string
}> {
  try {
    const supabase = createServiceRoleClient()
    
    // Check violations in the last 24 hours
    const { data: violations, error } = await supabase
      .from('content_violations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Failed to check violation history:', error)
      return { shouldBlock: false, violationCount: 0 }
    }

    const violationCount = violations?.length || 0

    // Block users with more than 5 violations in 24 hours
    if (violationCount >= 5) {
      return {
        shouldBlock: true,
        violationCount,
        reason: 'Too many content policy violations in the last 24 hours',
      }
    }

    return { shouldBlock: false, violationCount }
  } catch (error) {
    console.error('Failed to check violation history:', error)
    return { shouldBlock: false, violationCount: 0 }
  }
}

/**
 * Content policy middleware for API routes
 */
export async function enforceContentPolicy(
  prompt: string,
  userId: string,
  referenceImage?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Check user violation history first
  const historyCheck = await checkUserViolationHistory(userId)
  if (historyCheck.shouldBlock) {
    return {
      allowed: false,
      reason: historyCheck.reason,
    }
  }

  // Analyze content
  const result = analyzeContentContext(prompt, referenceImage)

  // Log violations
  if (!result.allowed) {
    await logContentViolation(
      userId,
      prompt,
      result.violations,
      result.confidence,
      result.flaggedTerms
    )
  }

  return {
    allowed: result.allowed,
    reason: result.reason,
  }
}
