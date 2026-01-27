/**
 * Decision PRO Branding Constants
 * Centralized branding configuration for logos, colors, and company information
 */

export const BRANDING = {
  logos: {
    icon: '/logos/logo_only.jpeg',
    lightBg: '/logos/logo_blue.jpeg',
    darkBg: '/logos/logo_white.jpeg',
    fullColor: '/logos/logo_blue.jpeg',
  },
  company: {
    name: 'Decision PRO',
    tagline: 'Intelligent Credit Decisions',
    fullName: 'Decision PRO - AIS Platform',
    shortName: 'DP',
  },
  metadata: {
    themeColor: '#0ea5e9',
    backgroundColor: '#ffffff',
    description: 'Decision PRO Admin Dashboard for Akafay Intelligent Services',
  },
  social: {
    website: 'https://decisionpro.ai',
    support: 'support@decisionpro.ai',
  },
} as const;

export type BrandingConfig = typeof BRANDING;
