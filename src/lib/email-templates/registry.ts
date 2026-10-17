import type { ComponentType } from 'react'
import { template as availabilityRequest } from './availability-request'
import { template as availabilityReceipt } from './availability-receipt'
import { template as replyConfirmation } from './reply-confirmation'
import { template as contactNotification } from './contact-notification'
import { template as offerApplication } from './offer-application'
import { template as applicationConfirmation } from './application-confirmation'
import { template as replyRequestNotification } from './reply-request-notification'
import { template as listingPublished } from './listing-published'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-notification': contactNotification,
  'offer-application': offerApplication,
  'application-confirmation': applicationConfirmation,
  'reply-request-notification': replyRequestNotification,
  'reply-confirmation': replyConfirmation,
  'availability-request': availabilityRequest,
  'availability-receipt': availabilityReceipt,
  'listing-published': listingPublished,
  // Add templates here as they are created, e.g.:
  // 'welcome': welcomeTemplate,
}
