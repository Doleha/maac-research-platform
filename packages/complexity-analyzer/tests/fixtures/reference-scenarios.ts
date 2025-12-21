/**
 * Reference Scenario Library
 *
 * Known-complexity test scenarios for validation testing.
 * These scenarios have been manually validated to ensure
 * they match their designated complexity tiers.
 */

import type { ComplexityTier } from '@maac/types';

export interface ReferenceScenario {
  id: string;
  name: string;
  tier: ComplexityTier;
  content: string;
  calculationSteps: string[];
  domain: string;
  expectedScoreRange: {
    min: number;
    max: number;
  };
  validationNotes: string;
}

/**
 * Simple Tier Reference Scenarios
 *
 * Characteristics:
 * - 1-3 calculation steps
 * - Single data source
 * - No trade-offs or ambiguity
 * - Direct path to solution
 */
export const simpleReferenceScenarios: ReferenceScenario[] = [
  {
    id: 'ref-simple-001',
    name: 'Tip Calculation',
    tier: 'simple',
    content: `
      Calculate the tip amount for a restaurant bill.
      Bill total: $78.50
      Desired tip percentage: 18%
      What is the tip amount?
    `,
    calculationSteps: ['Multiply bill by tip percentage'],
    domain: 'analytical',
    expectedScoreRange: { min: 0, max: 10 },
    validationNotes: 'Single calculation, no ambiguity, direct answer',
  },
  {
    id: 'ref-simple-002',
    name: 'Percentage Change',
    tier: 'simple',
    content: `
      Last month's sales: $45,000
      This month's sales: $52,000
      Calculate the percentage increase in sales.
    `,
    calculationSteps: ['Calculate difference', 'Divide by original', 'Convert to percentage'],
    domain: 'analytical',
    expectedScoreRange: { min: 0, max: 12 },
    validationNotes: 'Linear multi-step but single solution path',
  },
  {
    id: 'ref-simple-003',
    name: 'Unit Conversion',
    tier: 'simple',
    content: `
      Convert 2.5 kilometers to miles.
      Conversion factor: 1 kilometer = 0.621371 miles
    `,
    calculationSteps: ['Multiply kilometers by conversion factor'],
    domain: 'analytical',
    expectedScoreRange: { min: 0, max: 8 },
    validationNotes: 'Single operation, provided conversion factor',
  },
  {
    id: 'ref-simple-004',
    name: 'Average Calculation',
    tier: 'simple',
    content: `
      Calculate the average of the following test scores:
      85, 92, 78, 88, 95
    `,
    calculationSteps: ['Sum all scores', 'Divide by count'],
    domain: 'analytical',
    expectedScoreRange: { min: 0, max: 10 },
    validationNotes: 'Standard arithmetic operation',
  },
  {
    id: 'ref-simple-005',
    name: 'Discount Calculation',
    tier: 'simple',
    content: `
      Original price: $150
      Discount: 25%
      Calculate the sale price.
    `,
    calculationSteps: ['Calculate discount amount', 'Subtract from original'],
    domain: 'analytical',
    expectedScoreRange: { min: 0, max: 10 },
    validationNotes: 'Two-step calculation, single path',
  },
];

/**
 * Moderate Tier Reference Scenarios
 *
 * Characteristics:
 * - 4-7 calculation steps
 * - Multiple data sources
 * - Some comparison or ranking
 * - May have conditional logic
 */
export const moderateReferenceScenarios: ReferenceScenario[] = [
  {
    id: 'ref-moderate-001',
    name: 'Multi-Department Comparison',
    tier: 'moderate',
    content: `
      Compare quarterly performance across 4 departments:
      
      Engineering: Revenue $2.1M, Costs $1.6M, Headcount 42
      Sales: Revenue $3.8M, Costs $1.9M, Headcount 35
      Marketing: Revenue $0, Costs $750K, Headcount 18
      Support: Revenue $0, Costs $900K, Headcount 25
      
      Tasks:
      1. Calculate profit margin for revenue-generating departments
      2. Calculate cost per employee for all departments
      3. Rank departments by cost efficiency
      4. Identify which department should receive additional budget
    `,
    calculationSteps: [
      'Calculate Engineering margin',
      'Calculate Sales margin',
      'Calculate cost per employee for each',
      'Create efficiency ranking',
      'Analyze and recommend',
    ],
    domain: 'analytical',
    expectedScoreRange: { min: 12, max: 22 },
    validationNotes: 'Multiple calculations, comparison, simple recommendation',
  },
  {
    id: 'ref-moderate-002',
    name: 'Investment Portfolio Analysis',
    tier: 'moderate',
    content: `
      Analyze a 3-asset investment portfolio:
      
      Asset A: Initial $10,000, Current $11,500, Annual Dividend $200
      Asset B: Initial $15,000, Current $14,200, Annual Dividend $450
      Asset C: Initial $8,000, Current $9,100, Annual Dividend $0
      
      Calculate:
      1. Total return (capital gains + dividends) for each asset
      2. Return percentage for each asset
      3. Portfolio-weighted average return
      4. Identify best and worst performers
      5. Suggest rebalancing if any asset exceeds 50% of portfolio
    `,
    calculationSteps: [
      'Calculate Asset A total return',
      'Calculate Asset B total return',
      'Calculate Asset C total return',
      'Calculate return percentages',
      'Calculate portfolio weights',
      'Calculate weighted average',
      'Rank performance',
      'Check rebalancing threshold',
    ],
    domain: 'planning',
    expectedScoreRange: { min: 14, max: 24 },
    validationNotes: 'Multiple assets, various metrics, simple decision',
  },
  {
    id: 'ref-moderate-003',
    name: 'Vendor Selection',
    tier: 'moderate',
    content: `
      Select a software vendor based on weighted criteria:
      
      Criteria and Weights:
      - Price (30%): Lower is better
      - Features (25%): Higher is better
      - Support (20%): Higher is better
      - Integration (15%): Higher is better
      - Security (10%): Higher is better
      
      Vendor Scores (1-10):
      Vendor A: Price 8, Features 7, Support 9, Integration 6, Security 8
      Vendor B: Price 6, Features 9, Support 7, Integration 8, Security 7
      Vendor C: Price 9, Features 6, Support 8, Integration 7, Security 9
      
      Calculate weighted scores and recommend.
    `,
    calculationSteps: [
      'Calculate Vendor A weighted score',
      'Calculate Vendor B weighted score',
      'Calculate Vendor C weighted score',
      'Rank vendors',
      'Make recommendation',
    ],
    domain: 'planning',
    expectedScoreRange: { min: 13, max: 23 },
    validationNotes: 'Structured decision with clear weights',
  },
  {
    id: 'ref-moderate-004',
    name: 'Marketing Campaign ROI',
    tier: 'moderate',
    content: `
      Analyze ROI for 3 marketing campaigns over Q1:
      
      Email Campaign:
      - Cost: $5,000
      - Leads generated: 450
      - Conversion rate: 12%
      - Average sale value: $200
      
      Social Media Campaign:
      - Cost: $8,000
      - Leads generated: 680
      - Conversion rate: 8%
      - Average sale value: $180
      
      PPC Campaign:
      - Cost: $12,000
      - Leads generated: 920
      - Conversion rate: 15%
      - Average sale value: $220
      
      Calculate revenue, profit, and ROI for each. Recommend budget allocation.
    `,
    calculationSteps: [
      'Calculate Email conversions and revenue',
      'Calculate Social Media conversions and revenue',
      'Calculate PPC conversions and revenue',
      'Calculate profit for each',
      'Calculate ROI percentages',
      'Rank by ROI',
      'Recommend allocation',
    ],
    domain: 'analytical',
    expectedScoreRange: { min: 14, max: 24 },
    validationNotes: 'Multiple campaigns, various metrics, optimization',
  },
  {
    id: 'ref-moderate-005',
    name: 'Project Timeline Estimation',
    tier: 'moderate',
    content: `
      Estimate project completion with the following tasks:
      
      Task A: 5 days, no dependencies
      Task B: 8 days, depends on A
      Task C: 3 days, depends on A
      Task D: 6 days, depends on B and C
      Task E: 4 days, depends on D
      
      Account for:
      - 20% buffer for uncertainty
      - Only 5 working days per week
      - Team available 80% of time
      
      Calculate critical path and estimated completion.
    `,
    calculationSteps: [
      'Identify parallel paths',
      'Calculate path durations',
      'Identify critical path',
      'Apply uncertainty buffer',
      'Adjust for working days',
      'Adjust for availability',
      'Calculate final estimate',
    ],
    domain: 'planning',
    expectedScoreRange: { min: 15, max: 25 },
    validationNotes: 'Dependencies, multiple adjustments, structured logic',
  },
];

/**
 * Complex Tier Reference Scenarios
 *
 * Characteristics:
 * - 8+ calculation steps
 * - Multiple conflicting objectives
 * - Significant uncertainty
 * - Novel synthesis required
 * - Trade-offs with no clear answer
 */
export const complexReferenceScenarios: ReferenceScenario[] = [
  {
    id: 'ref-complex-001',
    name: 'Strategic Resource Allocation',
    tier: 'complex',
    content: `
      Strategic Resource Allocation Under Uncertainty
      
      Context: Technology company with $50M annual R&D budget
      facing market disruption across 3 product lines.
      
      Product Lines:
      - Legacy Enterprise: $25M revenue, declining 8%/year, high margin
      - Cloud Platform: $15M revenue, growing 35%/year, low margin
      - AI Solutions: $5M revenue, growing 120%/year, negative margin
      
      Constraints:
      - Cannot reduce Legacy by more than 30% (enterprise contracts)
      - Cloud requires minimum $12M to maintain competitive
      - AI needs $8M minimum to reach profitability
      - Total budget fixed at $50M
      
      Strategic Considerations:
      - Investors expect 25% growth in 3 years
      - Key talent divided across all products
      - Technology debt in Legacy could cause failures
      - Competitive threats emerging in Cloud
      - AI has regulatory uncertainty
      
      Stakeholder Conflicts:
      - CFO wants short-term profitability focus
      - CTO advocates for AI moonshot
      - Sales demands Legacy maintenance
      - Board wants balanced growth
      
      Required Analysis:
      1. Model 3 allocation scenarios
      2. Project 3-year outcomes with confidence intervals
      3. Identify key risks and mitigation strategies
      4. Consider talent retention implications
      5. Account for competitive dynamics
      6. Balance short-term vs long-term trade-offs
      7. Provide recommendation with rationale
    `,
    calculationSteps: [
      'Analyze current state',
      'Model conservative scenario',
      'Model balanced scenario',
      'Model aggressive scenario',
      'Calculate 3-year projections for each',
      'Assess uncertainty ranges',
      'Evaluate talent impact',
      'Analyze competitive response',
      'Calculate risk-adjusted returns',
      'Synthesize stakeholder requirements',
      'Develop mitigation strategies',
      'Formulate recommendation',
    ],
    domain: 'planning',
    expectedScoreRange: { min: 28, max: 45 },
    validationNotes: 'Multiple trade-offs, uncertainty, stakeholder conflicts',
  },
  {
    id: 'ref-complex-002',
    name: 'M&A Integration Analysis',
    tier: 'complex',
    content: `
      Post-Merger Integration Strategy
      
      Scenario: Acquiring company (5,000 employees, $800M revenue)
      is integrating target company (1,200 employees, $180M revenue)
      in overlapping market segments.
      
      Integration Challenges:
      - 40% product overlap with different technology stacks
      - Redundancy of approximately 300 positions
      - Cultural differences: startup vs traditional
      - Customer overlap of 25% with different pricing
      - Conflicting go-to-market strategies
      - Incompatible ERP and CRM systems
      
      Financial Considerations:
      - $50M integration budget over 2 years
      - Expected synergies of $35M/year (80% confidence)
      - Retention bonuses of $12M required for key talent
      - System integration costs estimated $20-40M
      - Potential customer churn: 10-20%
      
      Strategic Trade-offs:
      - Speed of integration vs risk of disruption
      - Cost synergies vs capability preservation
      - Unified culture vs innovation preservation
      - Customer retention vs pricing optimization
      
      Regulatory Considerations:
      - Antitrust concerns in 3 product categories
      - Data privacy compliance across 12 countries
      - Employment law variations
      
      Required Outputs:
      1. Integration roadmap with phases
      2. Synergy capture timeline with milestones
      3. Risk assessment with probability-weighted impact
      4. Organizational design recommendation
      5. Technology integration priority sequence
      6. Customer retention strategy
      7. Communication plan for stakeholders
      8. Success metrics and governance
    `,
    calculationSteps: [
      'Map organizational overlaps',
      'Analyze product portfolio',
      'Identify synergy opportunities',
      'Estimate integration costs',
      'Model customer churn scenarios',
      'Design org structure options',
      'Evaluate technology paths',
      'Calculate risk-adjusted value',
      'Develop phased roadmap',
      'Create retention strategy',
      'Design governance framework',
      'Build communication plan',
      'Define success metrics',
    ],
    domain: 'problem_solving',
    expectedScoreRange: { min: 30, max: 48 },
    validationNotes: 'Multi-dimensional, conflicting objectives, high uncertainty',
  },
  {
    id: 'ref-complex-003',
    name: 'Crisis Response Strategy',
    tier: 'complex',
    content: `
      Cybersecurity Incident Response and Recovery
      
      Situation: Major data breach discovered affecting:
      - 2.5 million customer records
      - Financial data for 500,000 customers
      - Ongoing attacker presence suspected
      - Regulatory notification deadlines: 72 hours
      - Stock price dropped 15% on rumors
      
      Immediate Unknowns:
      - Full extent of breach unclear
      - Entry point not yet identified
      - Duration of intrusion unknown
      - Whether attackers still have access
      - What data has been exfiltrated
      
      Stakeholder Pressures:
      - Board demanding immediate answers
      - Legal requiring careful disclosure
      - PR wanting to get ahead of story
      - Operations needing to restore services
      - Customers demanding information
      - Regulators expecting notification
      
      Resource Constraints:
      - IR team of 5 people
      - External forensics available in 48 hours
      - Legal counsel available immediately
      - PR agency on retainer
      - $2M emergency response budget
      
      Competing Priorities:
      - Investigate vs contain vs communicate
      - Speed vs accuracy of information
      - Business continuity vs security hardening
      - Transparency vs legal liability
      - Customer notification vs investigation integrity
      
      Required Strategy:
      1. Immediate 72-hour action plan
      2. Investigation and containment approach
      3. Stakeholder communication strategy
      4. Regulatory compliance plan
      5. Business continuity decisions
      6. Long-term remediation roadmap
      7. Budget allocation across priorities
      8. Decision escalation framework
    `,
    calculationSteps: [
      'Assess current state and unknowns',
      'Prioritize immediate actions',
      'Allocate resources across tracks',
      'Develop investigation timeline',
      'Create containment strategy',
      'Design communication cascade',
      'Map regulatory requirements',
      'Model business impact scenarios',
      'Plan recovery phases',
      'Build decision framework',
      'Allocate budget',
      'Define escalation criteria',
      'Establish success metrics',
    ],
    domain: 'problem_solving',
    expectedScoreRange: { min: 32, max: 50 },
    validationNotes: 'Crisis situation, high uncertainty, conflicting priorities, time pressure',
  },
  {
    id: 'ref-complex-004',
    name: 'Platform Ecosystem Strategy',
    tier: 'complex',
    content: `
      Platform Ecosystem Development Strategy
      
      Context: Enterprise SaaS company considering platform strategy
      to enable third-party developers and create ecosystem value.
      
      Current State:
      - Single-product company with $100M ARR
      - 2,000 enterprise customers
      - Strong in manufacturing vertical
      - API exists but limited (50 endpoints)
      - No partner program currently
      - Development team of 150 engineers
      
      Strategic Options:
      Option A: Open API Platform
      - Investment: $15M over 2 years
      - Revenue model: Freemium API access
      - Risk: Competitive exposure
      
      Option B: Curated Partner Marketplace
      - Investment: $8M over 2 years
      - Revenue model: Revenue share (15%)
      - Risk: Slower ecosystem growth
      
      Option C: Embedded Platform (White-label)
      - Investment: $20M over 3 years
      - Revenue model: OEM licensing
      - Risk: Channel conflict
      
      Evaluation Factors:
      - Ecosystem network effects potential
      - Developer experience requirements
      - Security and governance complexity
      - Support and quality assurance burden
      - Competitive moat creation
      - Existing customer impact
      - Technical debt implications
      - Team capability gaps
      
      Market Dynamics:
      - 2 competitors already have platforms
      - Developer tools market growing 25%/year
      - Enterprise platform fatigue emerging
      - Regulatory pressures on data sharing
      
      Required Analysis:
      1. Compare strategic options with weighted criteria
      2. Model 5-year financial projections for each
      3. Assess build vs buy vs partner for key capabilities
      4. Design governance model for selected approach
      5. Create phased implementation roadmap
      6. Identify key risks and mitigation strategies
      7. Define success metrics and decision gates
    `,
    calculationSteps: [
      'Define evaluation criteria and weights',
      'Score options against criteria',
      'Model financial projections',
      'Analyze ecosystem dynamics',
      'Assess capability gaps',
      'Evaluate build vs buy options',
      'Design governance framework',
      'Create implementation phases',
      'Identify risk factors',
      'Develop mitigation strategies',
      'Define decision gates',
      'Recommend approach with rationale',
    ],
    domain: 'planning',
    expectedScoreRange: { min: 30, max: 48 },
    validationNotes: 'Strategic decision, multiple options, long-term implications',
  },
  {
    id: 'ref-complex-005',
    name: 'Workforce Transformation',
    tier: 'complex',
    content: `
      AI-Driven Workforce Transformation Strategy
      
      Context: Financial services firm with 8,000 employees
      facing automation of 40% of current tasks within 5 years.
      
      Current Workforce:
      - Back office operations: 2,500 (60% automatable)
      - Customer service: 1,800 (45% automatable)
      - Professional services: 2,200 (25% automatable)
      - Technology: 1,000 (10% automatable)
      - Management: 500 (15% automatable)
      
      Financial Context:
      - Current labor costs: $600M annually
      - Automation investment required: $80-150M
      - Reskilling costs: $8,000-25,000 per employee
      - Severance obligations: Average 6 months
      - Annual attrition: 12%
      
      Constraints and Considerations:
      - Union agreements in 3 departments
      - Regulatory requirements for human oversight
      - Customer expectations for human service
      - Brand reputation for employee treatment
      - Local employment regulations (8 countries)
      - Skill availability in market
      - Cultural resistance to change
      
      Stakeholder Perspectives:
      - Board: Maximize shareholder value
      - Employees: Job security and growth
      - Customers: Service quality maintenance
      - Regulators: Responsible AI deployment
      - Communities: Local employment impact
      
      Strategic Options:
      - Aggressive automation with workforce reduction
      - Gradual automation with attrition-based reduction
      - Automation with full reskilling commitment
      - Hybrid approach with targeted interventions
      
      Required Outputs:
      1. Scenario analysis with financial and human impact
      2. Reskilling program design and capacity planning
      3. Change management and communication strategy
      4. Risk assessment including reputational risks
      5. Phased implementation roadmap
      6. Stakeholder engagement plan
      7. Success metrics across financial and human dimensions
      8. Governance and ethical framework
    `,
    calculationSteps: [
      'Analyze role-level automation potential',
      'Model financial scenarios',
      'Calculate workforce transition numbers',
      'Design reskilling programs',
      'Plan attrition-based absorption',
      'Create severance projections',
      'Map regulatory requirements',
      'Develop stakeholder strategy',
      'Build change management approach',
      'Calculate ROI with uncertainty',
      'Phase implementation timeline',
      'Define governance structure',
      'Establish ethical guidelines',
      'Create success metrics',
    ],
    domain: 'problem_solving',
    expectedScoreRange: { min: 35, max: 52 },
    validationNotes: 'Human impact, ethical considerations, multiple stakeholders, uncertainty',
  },
];

/**
 * All reference scenarios combined
 */
export const allReferenceScenarios: ReferenceScenario[] = [
  ...simpleReferenceScenarios,
  ...moderateReferenceScenarios,
  ...complexReferenceScenarios,
];

/**
 * Get reference scenarios by tier
 */
export function getReferencesByTier(tier: ComplexityTier): ReferenceScenario[] {
  return allReferenceScenarios.filter((s) => s.tier === tier);
}

/**
 * Get a random reference scenario for a given tier
 */
export function getRandomReference(tier: ComplexityTier): ReferenceScenario {
  const tierScenarios = getReferencesByTier(tier);
  const index = Math.floor(Math.random() * tierScenarios.length);
  return tierScenarios[index];
}
