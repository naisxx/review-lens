import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  MessagesSquare,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react'

/**
 * AI-authored strategic narrative. These cards are intentionally STATIC —
 * they represent a model's qualitative read of the authenticity posture and
 * do not recompute when filters change (per product spec). They are visibly
 * badged as AI so users never mistake them for live metrics.
 */

export interface Insight {
  icon: LucideIcon
  title: string
  body: string
}

export const OPPORTUNITIES: Insight[] = [
  {
    icon: BadgeCheck,
    title: 'Convert unverified reviewers',
    body: 'Roughly three in ten reviews still lack a verified-purchase signal. Post-purchase email and QR prompts can lift verified share above 80% and harden trust.',
  },
  {
    icon: MessagesSquare,
    title: 'Grow on-site native reviews',
    body: 'Native (on-site) reviews already dominate the mix. Doubling down with review reminders at delivery keeps authenticity high and reduces syndicated drag.',
  },
  {
    icon: ScanSearch,
    title: 'Close content gaps in Q&A',
    body: 'Categories with thin native coverage over-index on external sources. Seeding first-party Q&A and photos shifts weight back to owned channels.',
  },
  {
    icon: UserCheck,
    title: 'Reward top native reviewers',
    body: 'Recognizing high-signal native reviewers sustains a durable pipeline of authentic, verified content that outperforms incentivized external reviews.',
  },
]

export const THREATS: Insight[] = [
  {
    icon: ShieldAlert,
    title: 'External rating drag',
    body: 'Where external sources rate below native, blended star ratings are suppressed. Monitor syndicated feeds that pull the visible average down.',
  },
  {
    icon: ShieldAlert,
    title: 'Elevated unverified complaints',
    body: 'A rising share of one- and two-star reviews among unverified reviewers can indicate seeding, retaliation, or off-platform noise entering the mix.',
  },
  {
    icon: ShieldAlert,
    title: 'Source concentration risk',
    body: 'Over-reliance on a single external partner for review volume creates fragility if that feed changes moderation or syndication policy.',
  },
  {
    icon: ShieldAlert,
    title: 'Competitor verified lead',
    body: 'Leading brands in the category convert verified purchases at a higher rate, compounding their authenticity advantage over time.',
  },
]

export interface Takeaway {
  icon: LucideIcon
  accent: string
  title: string
  body: string
}

export const EXECUTIVE_TAKEAWAYS: Takeaway[] = [
  {
    icon: ShieldCheck,
    accent: 'text-positive',
    title: 'Authentic foundation',
    body: 'High native share and solid verified rates give the focus brand a credible, defensible review base above the category norm.',
  },
  {
    icon: TrendingUp,
    accent: 'text-brand',
    title: 'Grow verified, win trust',
    body: 'Driving more verified reviews is the single highest-leverage move to lift authenticity scores and shopper conversion.',
  },
  {
    icon: Sparkles,
    accent: 'text-external',
    title: 'Manage external drag',
    body: 'Where syndicated sources rate lower than native, invest in first-party content and support to protect the visible star rating.',
  },
  {
    icon: MessagesSquare,
    accent: 'text-warning',
    title: 'Protect against seeding',
    body: 'Watch unverified complaint patterns and source concentration to catch inauthentic activity before it distorts the signal.',
  },
]
