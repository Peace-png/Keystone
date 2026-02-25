/**
 * SHADOW RESEARCH SERVICE HANDLER
 *
 * Processes research job requests for Zero Day Services
 * This is the core logic that runs when someone hires Shadow
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Types
interface Customer {
  platform: string;
  user_id: string;
  username: string;
}

interface Payment {
  method: 'stripe' | 'paypal' | 'crypto' | 'credits' | null;
  transaction_id: string | null;
  paid_at: string | null;
}

interface Job {
  id: string;
  customer: Customer;
  service: 'research';
  request: string;
  complexity: 'simple' | 'standard' | 'complex';
  price: number;
  status: 'pending' | 'quoted' | 'paid' | 'in_progress' | 'delivered' | 'completed' | 'refunded';
  payment: Payment;
  timeline: {
    requested_at: string;
    quoted_at: string | null;
    paid_at: string | null;
    started_at: string | null;
    delivered_at: string | null;
    completed_at: string | null;
  };
  deliverable: string | null;
  rating: number | null;
  feedback: string | null;
}

interface JobsDatabase {
  schema_version: string;
  active_jobs: Job[];
  completed_jobs: Job[];
  stats: {
    total_jobs: number;
    total_revenue: number;
    total_refunds: number;
    average_rating: number;
    customers: string[];
  };
}

// Pricing configuration
const PRICING = {
  simple: { price: 5, eta: '2-4 hours' },
  standard: { price: 10, eta: 'Same day' },
  complex: { price: 20, eta: '24 hours' },
  urgent_multiplier: 2,
};

// File path for job storage
const JOBS_PATH = join(__dirname, 'jobs.json');

// ============ DATABASE FUNCTIONS ============

function loadJobs(): JobsDatabase {
  if (!existsSync(JOBS_PATH)) {
    return {
      schema_version: '1.0',
      active_jobs: [],
      completed_jobs: [],
      stats: {
        total_jobs: 0,
        total_revenue: 0,
        total_refunds: 0,
        average_rating: 0,
        customers: [],
      },
    };
  }
  return JSON.parse(readFileSync(JOBS_PATH, 'utf-8'));
}

function saveJobs(jobs: JobsDatabase): void {
  writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2));
}

function generateJobId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `job_${date}_${random}`;
}

// ============ COMPLEXITY ASSESSMENT ============

function assessComplexity(request: string): 'simple' | 'standard' | 'complex' {
  const wordCount = request.split(/\s+/).length;
  const questionMarks = (request.match(/\?/g) || []).length;

  const complexIndicators = [
    'comprehensive', 'detailed', 'deep dive', 'thorough',
    'compare', 'vs', 'versus', 'analysis', 'multiple',
    'and', 'also', 'plus', 'including'
  ];

  const hasComplexIndicators = complexIndicators.some(i =>
    request.toLowerCase().includes(i)
  );

  if (wordCount > 50 || questionMarks > 3 || hasComplexIndicators) {
    return 'complex';
  } else if (wordCount > 20 || questionMarks > 1) {
    return 'standard';
  }
  return 'simple';
}

// ============ JOB MANAGEMENT ============

export function createJob(customer: Customer, request: string, urgent: boolean = false): Job {
  const jobs = loadJobs();
  const complexity = assessComplexity(request);
  let price = PRICING[complexity].price;

  if (urgent) {
    price *= PRICING.urgent_multiplier;
  }

  const job: Job = {
    id: generateJobId(),
    customer,
    service: 'research',
    request,
    complexity,
    price,
    status: 'pending',
    payment: {
      method: null,
      transaction_id: null,
      paid_at: null,
    },
    timeline: {
      requested_at: new Date().toISOString(),
      quoted_at: null,
      paid_at: null,
      started_at: null,
      delivered_at: null,
      completed_at: null,
    },
    deliverable: null,
    rating: null,
    feedback: null,
  };

  jobs.active_jobs.push(job);
  saveJobs(jobs);

  return job;
}

export function getQuoteMessage(job: Job): string {
  const eta = job.price > PRICING[job.complexity].price
    ? '1-2 hours (URGENT)'
    : PRICING[job.complexity].eta;

  return `
📋 RESEARCH REQUEST RECEIVED

Job ID: ${job.id}
Topic: "${job.request}"
Complexity: ${job.complexity.toUpperCase()}
Price: $${job.price}
ETA: ${eta}

✅ Confirm: !shadow confirm ${job.id}
❌ Cancel: !shadow cancel ${job.id}
`.trim();
}

export function confirmJob(jobId: string): Job | null {
  const jobs = loadJobs();
  const job = jobs.active_jobs.find(j => j.id === jobId);

  if (!job || job.status !== 'pending') {
    return null;
  }

  job.status = 'quoted';
  job.timeline.quoted_at = new Date().toISOString();
  saveJobs(jobs);

  return job;
}

export function processPayment(
  jobId: string,
  method: Payment['method'],
  transactionId: string
): { success: boolean; job?: Job; message?: string } {
  const jobs = loadJobs();
  const job = jobs.active_jobs.find(j => j.id === jobId);

  if (!job) {
    return { success: false, message: 'Job not found' };
  }

  if (job.status !== 'quoted') {
    return { success: false, message: 'Job not in quoted status' };
  }

  job.status = 'paid';
  job.payment = {
    method,
    transaction_id: transactionId,
    paid_at: new Date().toISOString(),
  };
  job.timeline.paid_at = new Date().toISOString();

  saveJobs(jobs);

  return {
    success: true,
    job,
    message: `
💳 PAYMENT CONFIRMED

Job ID: ${job.id}
Amount: $${job.price}
Transaction: ${transactionId}

Shadow is now working on your research!
Expected delivery: ${PRICING[job.complexity].eta}
    `.trim(),
  };
}

export function startJob(jobId: string): Job | null {
  const jobs = loadJobs();
  const job = jobs.active_jobs.find(j => j.id === jobId);

  if (!job || job.status !== 'paid') {
    return null;
  }

  job.status = 'in_progress';
  job.timeline.started_at = new Date().toISOString();
  saveJobs(jobs);

  return job;
}

export function deliverJob(jobId: string, deliverable: string): Job | null {
  const jobs = loadJobs();
  const job = jobs.active_jobs.find(j => j.id === jobId);

  if (!job || job.status !== 'in_progress') {
    return null;
  }

  job.status = 'delivered';
  job.deliverable = deliverable;
  job.timeline.delivered_at = new Date().toISOString();
  saveJobs(jobs);

  return job;
}

export function completeJob(jobId: string, rating: number, feedback?: string): Job | null {
  const jobs = loadJobs();
  const jobIndex = jobs.active_jobs.findIndex(j => j.id === jobId);

  if (jobIndex === -1) {
    return null;
  }

  const job = jobs.active_jobs[jobIndex];

  if (job.status !== 'delivered') {
    return null;
  }

  job.status = 'completed';
  job.rating = rating;
  job.feedback = feedback || null;
  job.timeline.completed_at = new Date().toISOString();

  // Update stats
  jobs.stats.total_jobs += 1;
  jobs.stats.total_revenue += job.price;
  jobs.stats.average_rating =
    (jobs.stats.average_rating * (jobs.stats.total_jobs - 1) + rating) /
    jobs.stats.total_jobs;

  if (!jobs.stats.customers.includes(job.customer.user_id)) {
    jobs.stats.customers.push(job.customer.user_id);
  }

  // Move to completed
  jobs.completed_jobs.push(job);
  jobs.active_jobs.splice(jobIndex, 1);

  saveJobs(jobs);

  return job;
}

export function refundJob(jobId: string, reason: string): Job | null {
  const jobs = loadJobs();
  const jobIndex = jobs.active_jobs.findIndex(j => j.id === jobId);

  if (jobIndex === -1) {
    return null;
  }

  const job = jobs.active_jobs[jobIndex];

  job.status = 'refunded';
  job.feedback = `REFUND: ${reason}`;
  job.timeline.completed_at = new Date().toISOString();

  jobs.stats.total_refunds += job.price;

  jobs.completed_jobs.push(job);
  jobs.active_jobs.splice(jobIndex, 1);

  saveJobs(jobs);

  return job;
}

export function getJobStatus(jobId: string): Job | null {
  const jobs = loadJobs();
  return jobs.active_jobs.find(j => j.id === jobId) ||
         jobs.completed_jobs.find(j => j.id === jobId) ||
         null;
}

export function getActiveJobs(): Job[] {
  return loadJobs().active_jobs;
}

export function getStats(): JobsDatabase['stats'] {
  return loadJobs().stats;
}

// ============ REPORT FORMATTER ============

export function formatDeliverable(
  topic: string,
  summary: string,
  keyPoints: string[],
  analysis: string,
  sources: { title: string; url: string }[],
  recommendations: string[]
): string {
  const border = '─'.repeat(42);

  return `
┌${border}┐
│                                            │
│         ZERO DAY SERVICES                  │
│         RESEARCH REPORT                    │
│                                            │
│ Topic: ${topic.slice(0, 36).padEnd(36)}│
│ Completed: ${new Date().toISOString().slice(0, 10)}                        │
│                                            │
├${border}┤
│ EXECUTIVE SUMMARY                           │
│                                            │
│ ${summary.slice(0, 40)}│
│                                            │
├${border}┤
│ KEY FINDINGS                                │
│                                            │
│ ${keyPoints.map(p => `► ${p}`.slice(0, 40)).join('│\n│ ')}│
│                                            │
├${border}┤
│ DETAILED ANALYSIS                           │
│                                            │
│ ${analysis.split('\n').map(line => line.slice(0, 40)).join('│\n│ ')}│
│                                            │
├${border}┤
│ SOURCES                                     │
│                                            │
│ ${sources.map(s => `• ${s.title}`.slice(0, 40)).join('│\n│ ')}│
│                                            │
├${border}┤
│ RECOMMENDATIONS                             │
│                                            │
│ ${recommendations.map(r => `→ ${r}`.slice(0, 40)).join('│\n│ ')}│
│                                            │
└${border}┘

Thank you for choosing Zero Day Services!
Rate: !shadow rate [JOB_ID] 1-5 [feedback]
`.trim();
}

// ============ COMMAND HANDLERS ============

export const commands = {
  research: (args: string[], customer: Customer): string => {
    if (args.length === 0) {
      return 'Usage: !shadow research "your topic here"';
    }
    const request = args.join(' ');
    const urgent = request.toLowerCase().includes('urgent');
    const job = createJob(customer, request, urgent);
    return getQuoteMessage(job);
  },

  status: (args: string[]): string => {
    if (args.length === 0) {
      return 'Usage: !shadow status JOB_ID';
    }
    const job = getJobStatus(args[0]);
    if (!job) {
      return `Job ${args[0]} not found.`;
    }
    return `
Job ID: ${job.id}
Status: ${job.status.toUpperCase()}
Request: "${job.request}"
Price: $${job.price}
${job.deliverable ? `\nDeliverable:\n${job.deliverable.slice(0, 500)}...` : ''}
    `.trim();
  },

  confirm: (args: string[]): string => {
    if (args.length === 0) {
      return 'Usage: !shadow confirm JOB_ID';
    }
    const job = confirmJob(args[0]);
    if (!job) {
      return `Could not confirm job ${args[0]}. It may not exist or already be confirmed.`;
    }
    return `
✅ JOB CONFIRMED

Job ID: ${job.id}
Price: $${job.price}

💳 PAYMENT REQUIRED
Pay via Stripe: [STRIPE_LINK]
Reference: ${job.id}

Once paid, Shadow will begin immediately.
    `.trim();
  },

  cancel: (args: string[]): string => {
    if (args.length === 0) {
      return 'Usage: !shadow cancel JOB_ID';
    }
    const refund = refundJob(args[0], 'Customer cancelled');
    if (!refund) {
      return `Could not cancel job ${args[0]}`;
    }
    return `❌ Job ${args[0]} cancelled. No payment was processed.`;
  },

  rate: (args: string[]): string => {
    if (args.length < 2) {
      return 'Usage: !shadow rate JOB_ID 1-5 [optional feedback]';
    }
    const jobId = args[0];
    const rating = parseInt(args[1]);
    const feedback = args.slice(2).join(' ') || undefined;

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return 'Rating must be a number between 1 and 5';
    }

    const job = completeJob(jobId, rating, feedback);
    if (!job) {
      return `Could not rate job ${jobId}. Make sure it was delivered first.`;
    }
    return `⭐ Thank you for rating! Your feedback helps Shadow improve.`;
  },

  stats: (): string => {
    const stats = getStats();
    return `
📊 ZERO DAY SERVICES STATS

Total Jobs: ${stats.total_jobs}
Total Revenue: $${stats.total_revenue}
Total Customers: ${stats.customers.length}
Average Rating: ${stats.average_rating.toFixed(1)}/5
    `.trim();
  },

  help: (): string => {
    return `
🥷 SHADOW - ZERO DAY SERVICES

Commands:
!shadow research "topic" - Request research
!shadow status JOB_ID - Check job status
!shadow confirm JOB_ID - Confirm and get payment link
!shadow cancel JOB_ID - Cancel a job
!shadow rate JOB_ID 1-5 [feedback] - Rate completed job
!shadow stats - View service statistics

Pricing:
Simple: $5 (2-4 hours)
Standard: $10 (Same day)
Complex: $20 (24 hours)
Urgent: +$10 (1-2 hours)
    `.trim();
  },
};

// ============ MAIN EXPORT ============

export const ShadowResearchService = {
  createJob,
  getQuoteMessage,
  confirmJob,
  processPayment,
  startJob,
  deliverJob,
  completeJob,
  refundJob,
  getJobStatus,
  getActiveJobs,
  getStats,
  formatDeliverable,
  commands,
};

export default ShadowResearchService;
