import type { Application, ActivityEvent, Stage } from './types'

interface SeedSpec {
  company: string
  role: string
  location: string
  remote: boolean
  stage: Stage
  salaryMin: number | null
  salaryMax: number | null
  source: string
  tags: string[]
  url: string
  notes: string
  /** Days before "now" the application was created. */
  createdDaysAgo: number
  /** Days before "now" it was last touched. */
  updatedDaysAgo: number
  /** Days before "now" it was sent, or null while it is only saved. */
  appliedDaysAgo: number | null
}

const SEED_SPECS: SeedSpec[] = [
  {
    company: 'Northwind Labs',
    role: 'Senior Frontend Engineer',
    location: 'Berlin, DE',
    remote: true,
    stage: 'onsite',
    salaryMin: 85000,
    salaryMax: 105000,
    source: 'Referral',
    tags: ['react', 'design-systems'],
    url: 'https://example.com/northwind/senior-frontend',
    notes: 'Referred by Priya. Team owns the component library.',
    createdDaysAgo: 41,
    updatedDaysAgo: 3,
    appliedDaysAgo: 38,
  },
  {
    company: 'Cobalt Interactive',
    role: 'Frontend Engineer',
    location: 'Remote (EU)',
    remote: true,
    stage: 'screen',
    salaryMin: 70000,
    salaryMax: 88000,
    source: 'LinkedIn',
    tags: ['react', 'gaming'],
    url: 'https://example.com/cobalt/frontend',
    notes: 'Screen booked with the hiring manager.',
    createdDaysAgo: 22,
    updatedDaysAgo: 6,
    appliedDaysAgo: 20,
  },
  {
    company: 'Harbourline',
    role: 'Product Engineer',
    location: 'Amsterdam, NL',
    remote: false,
    stage: 'applied',
    salaryMin: 65000,
    salaryMax: 80000,
    source: 'Company site',
    tags: ['product', 'typescript'],
    url: 'https://example.com/harbourline/product-engineer',
    notes: 'Small team, they build in the open.',
    createdDaysAgo: 31,
    updatedDaysAgo: 29,
    appliedDaysAgo: 29,
  },
  {
    company: 'Vellum Health',
    role: 'Senior Software Engineer, Web',
    location: 'London, UK',
    remote: true,
    stage: 'offer',
    salaryMin: 95000,
    salaryMax: 115000,
    source: 'Recruiter',
    tags: ['health', 'react', 'accessibility'],
    url: 'https://example.com/vellum/senior-web',
    notes: 'Verbal offer, waiting on written terms.',
    createdDaysAgo: 55,
    updatedDaysAgo: 1,
    appliedDaysAgo: 52,
  },
  {
    company: 'Ledgerbird',
    role: 'Frontend Engineer, Payments',
    location: 'Remote (global)',
    remote: true,
    stage: 'rejected',
    salaryMin: 78000,
    salaryMax: 92000,
    source: 'Job board',
    tags: ['fintech', 'react'],
    url: 'https://example.com/ledgerbird/payments-frontend',
    notes: 'Rejected after the take-home. Feedback: wanted more backend depth.',
    createdDaysAgo: 64,
    updatedDaysAgo: 34,
    appliedDaysAgo: 60,
  },
  {
    company: 'Studio Kestrel',
    role: 'Creative Developer',
    location: 'Lisbon, PT',
    remote: false,
    stage: 'saved',
    salaryMin: null,
    salaryMax: null,
    source: 'Newsletter',
    tags: ['animation', 'webgl'],
    url: 'https://example.com/kestrel/creative-developer',
    notes: 'Portfolio-led process — needs a proper writeup first.',
    createdDaysAgo: 8,
    updatedDaysAgo: 8,
    appliedDaysAgo: null,
  },
  {
    company: 'Meridian Analytics',
    role: 'Data Visualisation Engineer',
    location: 'Dublin, IE',
    remote: true,
    stage: 'applied',
    salaryMin: 72000,
    salaryMax: 90000,
    source: 'Referral',
    tags: ['dataviz', 'd3'],
    url: 'https://example.com/meridian/dataviz',
    notes: 'Chased once, no reply yet.',
    createdDaysAgo: 47,
    updatedDaysAgo: 40,
    appliedDaysAgo: 45,
  },
  {
    company: 'Orchard Systems',
    role: 'UI Engineer',
    location: 'Manchester, UK',
    remote: false,
    stage: 'screen',
    salaryMin: 60000,
    salaryMax: 74000,
    source: 'Job board',
    tags: ['react', 'accessibility'],
    url: 'https://example.com/orchard/ui-engineer',
    notes: 'Accessibility-first team, good sign.',
    createdDaysAgo: 17,
    updatedDaysAgo: 4,
    appliedDaysAgo: 15,
  },
  {
    company: 'Fathom Six',
    role: 'Full Stack Engineer',
    location: 'Remote (EU)',
    remote: true,
    stage: 'rejected',
    salaryMin: 68000,
    salaryMax: 84000,
    source: 'LinkedIn',
    tags: ['fullstack', 'node'],
    url: 'https://example.com/fathom-six/full-stack',
    notes: 'Role closed before the screen.',
    createdDaysAgo: 73,
    updatedDaysAgo: 58,
    appliedDaysAgo: 70,
  },
  {
    company: 'Brightsound',
    role: 'Frontend Engineer, Player',
    location: 'Stockholm, SE',
    remote: true,
    stage: 'saved',
    salaryMin: 74000,
    salaryMax: 89000,
    source: 'Company site',
    tags: ['audio', 'react'],
    url: 'https://example.com/brightsound/player',
    notes: 'Wants a cover letter — draft one this week.',
    createdDaysAgo: 3,
    updatedDaysAgo: 3,
    appliedDaysAgo: null,
  },
  {
    company: 'Tessellate',
    role: 'Design Engineer',
    location: 'Remote (global)',
    remote: true,
    stage: 'onsite',
    salaryMin: 88000,
    salaryMax: 102000,
    source: 'Referral',
    tags: ['design-systems', 'react'],
    url: 'https://example.com/tessellate/design-engineer',
    notes: 'Final round is a systems design conversation.',
    createdDaysAgo: 36,
    updatedDaysAgo: 2,
    appliedDaysAgo: 33,
  },
  {
    company: 'Quaymark',
    role: 'Software Engineer II',
    location: 'Bristol, UK',
    remote: false,
    stage: 'applied',
    salaryMin: 58000,
    salaryMax: 70000,
    source: 'Job board',
    tags: ['typescript'],
    url: 'https://example.com/quaymark/software-engineer-ii',
    notes: 'Applied through their portal, auto-acknowledged.',
    createdDaysAgo: 12,
    updatedDaysAgo: 11,
    appliedDaysAgo: 11,
  },
]

function isoDaysAgo(days: number, now: Date): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

function dateOnlyDaysAgo(days: number, now: Date): string {
  return isoDaysAgo(days, now).slice(0, 10)
}

/** Rebuilds the activity trail a real application would have accumulated:
 * a creation event, an application event once it was sent, and one event per
 * stage advance up to its current stage. */
function buildEvents(spec: SeedSpec, index: number, now: Date): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `evt_seed_${index}_created`,
      at: isoDaysAgo(spec.createdDaysAgo, now),
      kind: 'created',
    },
  ]

  if (spec.appliedDaysAgo !== null) {
    events.push({
      id: `evt_seed_${index}_applied`,
      at: isoDaysAgo(spec.appliedDaysAgo, now),
      kind: 'stage',
      from: 'saved',
      to: 'applied',
    })
  }

  if (spec.stage !== 'saved' && spec.stage !== 'applied') {
    events.push({
      id: `evt_seed_${index}_stage`,
      at: isoDaysAgo(spec.updatedDaysAgo, now),
      kind: 'stage',
      from: 'applied',
      to: spec.stage,
    })
  }

  return events
}

/** Deterministic starter data. Timestamps are relative to `now` so a fresh
 * install always looks like a search in progress rather than an archive. */
export function createSeedApplications(now: Date = new Date()): Application[] {
  return SEED_SPECS.map((spec, index) => ({
    id: `app_seed_${index + 1}`,
    company: spec.company,
    role: spec.role,
    location: spec.location,
    remote: spec.remote,
    stage: spec.stage,
    salaryMin: spec.salaryMin,
    salaryMax: spec.salaryMax,
    currency: 'EUR',
    source: spec.source,
    tags: spec.tags,
    url: spec.url,
    notes: spec.notes,
    appliedOn:
      spec.appliedDaysAgo === null ? null : dateOnlyDaysAgo(spec.appliedDaysAgo, now),
    createdAt: isoDaysAgo(spec.createdDaysAgo, now),
    updatedAt: isoDaysAgo(spec.updatedDaysAgo, now),
    events: buildEvents(spec, index + 1, now),
  }))
}
