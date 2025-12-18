/**
 * Domain Pattern Examples
 *
 * Extracted from n8n workflow: MAAC - Tier 1a - Experiment Processing - Scenario Generation Only.json
 * Node: "Domain Pattern Examples" (toolCode node)
 *
 * These patterns provide self-contained business scenarios with embedded data
 * for each domain/tier combination. Used as templates for scenario generation.
 */

import { AllDomainPatterns, DomainPattern } from './types';
import { Domain } from '@maac/types';

/**
 * Complete domain patterns extracted from n8n workflow
 * 5 patterns per domain, optimized for diversity and statistical power
 */
export const DOMAIN_PATTERNS: AllDomainPatterns = {
  // ============================================================
  // ANALYTICAL DOMAIN
  // Focus: complexity_handling, content_quality, hallucination_control
  // ============================================================
  analytical: {
    controlPatterns: [
      // Pattern 1: Multi-layered variance analysis
      {
        patternType: 'multi_layered_variance_analysis',
        example:
          'Your company had the following quarterly performance with market context: Q1 Budget: $100K, Q1 Actual: $85K, Industry Growth: 8%; Q2 Budget: $110K, Q2 Actual: $125K, Industry Growth: 12%; Q3 Budget: $120K, Q3 Actual: $140K, Industry Growth: 10%. Calculate budget variance percentages, compare to industry performance, and identify strategic insights.',
        expectedInsight:
          'Q1: -15% vs budget but -7% vs industry (market slowdown). Q2: +13.6% vs budget, +1.6% vs industry (outperforming). Q3: +16.7% vs budget, +6.7% vs industry (accelerating growth). Shows improving execution and market capture.',
        calculation: '((Actual - Budget) / Budget) * 100 and industry comparison analysis',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'content_quality', 'knowledge_transfer'],
        memoryIntegrationOpportunity: 'Cross-quarter trend analysis requiring synthesis',
      },
      // Pattern 2: Customer segmentation analysis
      {
        patternType: 'customer_segmentation_analysis',
        example:
          'Customer analytics for targeted marketing: Segment A (n=2,500): Avg spend $450, Purchase frequency 4.2/year, Churn rate 12%, CLV $1,890; Segment B (n=1,800): Avg spend $280, Purchase frequency 6.1/year, Churn rate 8%, CLV $2,100; Segment C (n=3,200): Avg spend $180, Purchase frequency 2.8/year, Churn rate 25%, CLV $504. Marketing budget $150K. Analyze segment profitability, recommend resource allocation, and identify retention strategies.',
        expectedInsight:
          'Segment B highest CLV despite lower spend (frequency + retention). Segment C high volume, low value, high churn risk. Allocation: 50% to Segment B (scale success), 30% to Segment A (upsell), 20% to Segment C (retention). Focus: B2B sales growth, premium services for A, automation for C.',
        calculation: 'CLV analysis, churn impact modeling, marketing ROI optimization',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'memory_integration', 'knowledge_transfer'],
        memoryIntegrationOpportunity: 'Customer behavior pattern recognition across segments',
      },
      // Pattern 3: Competitive intelligence analysis
      {
        patternType: 'competitive_intelligence_analysis',
        example:
          'Market competitive positioning: Our company - Market share 15%, Revenue $45M, Growth 8%, Customer satisfaction 4.2/5; Competitor A - Market share 22%, Revenue $66M, Growth 12%, Customer satisfaction 4.0/5; Competitor B - Market share 18%, Revenue $54M, Growth 5%, Customer satisfaction 4.5/5; Competitor C - Market share 10%, Revenue $30M, Growth 20%, Customer satisfaction 3.8/5. Industry growth 9%. Analyze competitive position, identify strategic gaps, and recommend positioning strategy.',
        expectedInsight:
          "Competitive analysis: A (market leader, growth momentum), B (customer excellence, slow growth), C (disruptor, experience gaps), Us (solid position, growth lag). Strategic opportunities: Match A's growth (operational efficiency), leverage B's satisfaction model, counter C's disruption. Focus areas: Customer experience enhancement, growth acceleration, market share defense.",
        calculation: 'Competitive gap analysis with strategic positioning matrix',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'memory_integration', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Competitive landscape pattern recognition and strategic synthesis',
      },
      // Pattern 4: Supply chain optimization
      {
        patternType: 'supply_chain_optimization',
        example:
          'Supply chain cost analysis: Supplier A - Unit cost $45, Lead time 14 days, Quality 98%, Capacity 10K units/month; Supplier B - Unit cost $52, Lead time 7 days, Quality 99.5%, Capacity 15K units/month; Supplier C - Unit cost $41, Lead time 21 days, Quality 96%, Capacity 8K units/month. Demand forecast: 12K units/month with 15% seasonality. Current inventory cost $8/unit/month. Optimize supplier mix considering cost, risk, and service levels.',
        expectedInsight:
          'Mixed strategy optimal: Primary Supplier B (60%, premium for reliability), Secondary Supplier A (30%, cost balance), Buffer Supplier C (10%, cost minimum). Total cost $571K vs single-source $624K. Risk mitigation through diversification. Inventory target: 1.2 months (seasonal buffer).',
        calculation: 'Multi-criteria optimization with risk-adjusted total cost of ownership',
        embeddedData: true,
        acpaCognitiveDemands: [
          'complexity_handling',
          'processing_efficiency',
          'construct_validity',
        ],
        memoryIntegrationOpportunity: 'Supply chain risk-return optimization synthesis',
      },
      // Pattern 5: Financial ratio analysis
      {
        patternType: 'financial_ratio_analysis',
        example:
          'Company financial health assessment over 3 years: 2023 - Current Ratio 1.8, Quick Ratio 1.2, Debt/Equity 0.6, ROE 15%, ROA 8%, Gross Margin 42%; 2024 - Current Ratio 1.6, Quick Ratio 1.0, Debt/Equity 0.8, ROE 12%, ROA 6%, Gross Margin 39%; 2025 - Current Ratio 1.4, Quick Ratio 0.9, Debt/Equity 1.1, ROE 9%, ROA 4%, Gross Margin 36%. Industry averages: Current 1.5, Quick 1.1, D/E 0.7, ROE 11%, ROA 6%, GM 40%. Analyze financial trends and recommend strategic actions.',
        expectedInsight:
          'Deteriorating financial health: Liquidity declining (current ratio 1.8→1.4), Leverage increasing (D/E 0.6→1.1), Profitability eroding (ROE 15%→9%). Below industry in all metrics except liquidity. Priority actions: 1) Improve working capital management, 2) Reduce debt burden, 3) Enhance operational efficiency, 4) Review pricing strategy for margin recovery.',
        calculation: 'Multi-year ratio trend analysis with industry benchmarking',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'content_quality', 'memory_integration'],
        memoryIntegrationOpportunity:
          'Financial trend analysis requiring historical pattern synthesis',
      },
    ],
    testPatterns: [
      'Multi-product revenue analysis with embedded sales data across different channels requiring pattern synthesis and strategic recommendations',
      'Customer lifetime value calculation with provided behavior metrics requiring statistical reasoning and business insight integration',
      'Competitive market position analysis using embedded data requiring multi-dimensional assessment and strategic positioning',
      'Financial ratio trend analysis requiring historical comparison and industry benchmarking',
      'Market segmentation study with customer behavior data requiring cluster analysis and targeting strategy',
    ],
  },

  // ============================================================
  // PLANNING DOMAIN
  // Focus: cognitive_load, tool_execution, processing_efficiency
  // ============================================================
  planning: {
    controlPatterns: [
      // Pattern 1: Complex project scheduling
      {
        patternType: 'complex_project_scheduling',
        example:
          'Plan a multi-phase software release with dependencies and constraints: Phase 1 - Requirements (3 days), Architecture (4 days, needs Requirements); Phase 2 - Frontend Dev (8 days, needs Architecture), Backend Dev (10 days, needs Architecture), Database (6 days, needs Architecture); Phase 3 - Integration (5 days, needs Frontend+Backend+Database), Testing (6 days, needs Integration), Deployment (2 days, needs Testing). Team constraints: 2 developers max on any task, 1 architect available. Create optimized timeline and resource allocation.',
        expectedInsight:
          'Critical path: Requirements(3)→Architecture(4)→Backend Dev(10)→Integration(5)→Testing(6)→Deployment(2) = 30 days. Parallel opportunities: Frontend/Database with Backend. Resource optimization: Architect on Requirements+Architecture (7 days), then available for consulting. Minimum timeline: 30 days with proper resource management.',
        calculation: 'Critical path method with resource constraints and optimization analysis',
        embeddedData: true,
        acpaCognitiveDemands: ['cognitive_load', 'tool_execution', 'processing_efficiency'],
        memoryIntegrationOpportunity:
          'Multi-constraint optimization requiring systematic planning synthesis',
      },
      // Pattern 2: Strategic roadmap development
      {
        patternType: 'strategic_roadmap_development',
        example:
          '5-year technology roadmap planning: Year 1 priorities - Cloud migration ($2.5M, 8 months, 15% efficiency gain), API modernization ($1.8M, 6 months, 25% dev speed increase); Year 2 - AI/ML platform ($3.2M, 12 months, 30% automation), Mobile platform ($2.1M, 9 months, 40% user engagement); Year 3 - Data analytics ($2.8M, 10 months, 20% decision speed), IoT integration ($1.9M, 8 months, 15% operational insight); Years 4-5 - Advanced AI ($4.5M, 18 months), Quantum computing research ($3.0M, 24 months). Budget constraint: $8M/year. Plan phased implementation with dependencies and ROI optimization.',
        expectedInsight:
          'Optimal phasing: Y1 foundation (Cloud+API, $4.3M), Y2 intelligence (AI/ML+Analytics start, $6.0M), Y3 completion (Analytics+Mobile+IoT, $6.8M), Y4-5 advanced (AI+Quantum, $7.5M total). Dependencies: Cloud enables AI, API enables Mobile, Analytics requires data foundation. ROI sequence: 15%→40%→50%→65% cumulative efficiency gains.',
        calculation: 'Multi-year strategic planning with dependency mapping and ROI optimization',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'cognitive_load', 'knowledge_transfer'],
        memoryIntegrationOpportunity:
          'Strategic timeline synthesis with technology dependency mapping',
      },
      // Pattern 3: Crisis response planning
      {
        patternType: 'crisis_response_planning',
        example:
          'Pandemic business continuity plan: Scenarios - Mild (20% workforce affected, 3-month duration), Moderate (45% workforce affected, 6-month duration), Severe (70% workforce affected, 12-month duration). Critical functions: Customer service (100% continuity required), Production (80% minimum), Sales (60% minimum), Admin (40% minimum). Resources: Remote work capability 65%, Cross-training coverage 30%, Vendor backup options. Develop response strategy with triggers, resource allocation, and recovery timeline.',
        expectedInsight:
          'Tiered response plan: Mild scenario (remote work sufficient, maintain operations), Moderate scenario (prioritize critical functions, 20% staff reduction, vendor partnerships), Severe scenario (survival mode, 40% operations, 6-month cash preservation). Triggers: Absence rates 15%/35%/55%. Pre-positioning: Cross-train 50% staff, Secure vendor agreements, Build 9-month cash reserve.',
        calculation: 'Scenario planning with resource allocation and business impact modeling',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'memory_integration', 'knowledge_transfer'],
        memoryIntegrationOpportunity:
          'Crisis planning requiring multi-scenario strategic thinking and resource synthesis',
      },
      // Pattern 4: Budget allocation planning
      {
        patternType: 'budget_allocation_planning',
        example:
          'Annual department budget allocation: Total budget $12M. Departments requesting: Sales $3.2M (revenue target +18%), Marketing $2.8M (lead gen +25%), R&D $4.1M (3 new products), Operations $2.9M (efficiency +12%), IT $1.8M (infrastructure upgrade), HR $1.4M (talent acquisition). Historical ROI: Sales 4.2x, Marketing 3.1x, R&D 2.8x (delayed), Operations 3.8x, IT 2.1x, HR 1.9x. Strategic priorities: Growth (40%), Efficiency (35%), Innovation (25%). Optimize allocation for maximum organizational value.',
        expectedInsight:
          'Strategic allocation optimization: Sales $3.0M (growth priority), Operations $3.1M (efficiency focus), R&D $3.5M (innovation investment), Marketing $2.4M (efficient growth support). Total $12M. Expected outcomes: Revenue +16%, Efficiency +14%, Innovation pipeline maintained. Trade-offs: Slightly reduced marketing spend offset by sales efficiency, IT infrastructure delayed 6 months.',
        calculation: 'Multi-criteria budget optimization with strategic weighting and ROI analysis',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'cognitive_load', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Budget planning requiring strategic priority synthesis and resource optimization',
      },
      // Pattern 5: Workforce development planning
      {
        patternType: 'workforce_development_planning',
        example:
          '3-year talent development strategy: Current state - 450 employees, 25% senior level, 35% mid-level, 40% junior level, Skill gaps: Data analytics (60% need training), Cloud computing (45% need training), Leadership (30% promotion-ready). Attrition: Senior 8%/year, Mid 12%/year, Junior 22%/year. Growth plan: +15% headcount/year. Training costs: Technical $3K/person, Leadership $8K/person, External hire premium 25%. Develop comprehensive workforce development plan with succession planning and cost optimization.',
        expectedInsight:
          'Development strategy: Accelerate internal promotion (reduce external hiring 40%), Implement technical training program (270 people/year), Leadership pipeline development (45 people/year). Results: Succession coverage 85% (vs 55% current), Training investment $1.2M/year, External hiring savings $2.1M/year, Net ROI 175%. Timeline: Year 1 infrastructure, Year 2 scale programs, Year 3 full capability.',
        calculation: 'Workforce planning with skill gap analysis and development ROI modeling',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'memory_integration', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Workforce planning requiring talent development and succession synthesis',
      },
    ],
    testPatterns: [
      'Multi-stakeholder enterprise project with embedded constraint data, competing priorities, and resource optimization requirements',
      'Strategic roadmap development with embedded market timing, competitive factors, and technology evolution considerations',
      'Crisis response planning requiring rapid assessment, resource mobilization, and stakeholder coordination with embedded scenario data',
      'Budget allocation optimization with department priorities and resource constraints requiring strategic decision-making',
      'Workforce development planning with skill gap analysis and succession planning requirements',
    ],
  },

  // ============================================================
  // COMMUNICATION DOMAIN
  // Focus: content_quality, knowledge_transfer, construct_validity
  // ============================================================
  communication: {
    controlPatterns: [
      // Pattern 1: Multi-audience crisis communication
      {
        patternType: 'multi_audience_crisis_communication',
        example:
          'Draft communications for a data security incident affecting multiple stakeholders. Incident details: Attempted breach detected at 3:15 AM, systems isolated by 3:22 AM, no data accessed, 2,500 customers experienced 45-minute service outage, investigation completed by 8:00 AM, enhanced security implemented. Audiences: Customers (email), Employees (internal memo), Regulators (formal report), Media (press statement). Each message must address audience-specific concerns while maintaining consistent facts.',
        expectedInsight:
          'Customer message: Focus on service restoration, no data compromise, enhanced security. Employee message: Operational response effectiveness, security protocol success, pride in response. Regulatory message: Technical details, compliance demonstration, preventive measures. Media message: Transparency, competence, customer protection priority.',
        guideline:
          'Crisis communication with audience adaptation requiring tone, detail, and focus modifications',
        embeddedData: true,
        acpaCognitiveDemands: ['content_quality', 'knowledge_transfer', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Multi-audience message consistency requiring communication framework synthesis',
      },
      // Pattern 2: Strategic stakeholder alignment
      {
        patternType: 'strategic_stakeholder_alignment',
        example:
          'Create quarterly business review presentation for diverse stakeholder group. Data: Revenue growth 15%, customer acquisition cost increased 20%, customer lifetime value up 25%, employee satisfaction 78% (target 85%), operational efficiency improved 12%, competitive market share gained 3%. Audiences: Board (strategic focus), Employees (operational pride), Customers (value demonstration), Investors (financial performance). Tailor messaging while maintaining data integrity.',
        expectedInsight:
          'Board: Strategic wins (market share gain) and challenges (CAC increase), recommend efficiency investment. Employees: Operational success stories, improvement opportunities, growth trajectory. Customers: Value delivery evidence, service improvements, innovation pipeline. Investors: Strong unit economics (LTV/CAC improving), growth sustainability, operational leverage.',
        guideline:
          'Multi-stakeholder value proposition communication requiring perspective adaptation',
        embeddedData: true,
        acpaCognitiveDemands: ['content_quality', 'knowledge_transfer', 'memory_integration'],
        memoryIntegrationOpportunity:
          'Stakeholder perspective synthesis requiring business context integration',
      },
      // Pattern 3: Cross-cultural business proposal
      {
        patternType: 'cross_cultural_business_proposal',
        example:
          'Develop partnership proposal for Japanese technology company. Context: US software company seeking Asian market entry, Japanese company values long-term relationships, consensus decision-making, technological excellence, risk mitigation. Proposal elements: Revenue sharing (60/40 initially, transitioning to 50/50), technology transfer, market development timeline (18-month pilot), success metrics (customer acquisition, revenue targets, brand recognition). Adapt communication style and structure for cultural effectiveness.',
        expectedInsight:
          'Structure: Executive summary with long-term vision, detailed technical specifications, risk mitigation framework, relationship-building timeline. Tone: Respectful, detailed, patient, emphasizing mutual benefit and long-term partnership. Key elements: Technology excellence demonstration, risk sharing, consensus-building process, honor commitment to relationship development.',
        guideline:
          'Cross-cultural business communication requiring cultural intelligence and relationship focus',
        embeddedData: true,
        acpaCognitiveDemands: ['content_quality', 'knowledge_transfer', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Cultural context integration requiring business and cultural knowledge synthesis',
      },
      // Pattern 4: Change management communication
      {
        patternType: 'change_management_communication',
        example:
          'Develop communication strategy for major organizational restructuring: Changes - 3 divisions merging into 2, 15% workforce reduction, new technology platform implementation, leadership changes in 4 departments, office consolidation from 5 to 3 locations. Timeline: 6 months implementation. Stakeholders: Affected employees, remaining staff, customers, vendors, local communities. Address concerns: job security, service continuity, relationship maintenance, community impact.',
        expectedInsight:
          'Phased communication: Week 1 (leadership announcement, rationale, support resources), Month 1 (individual impact notifications, transition planning), Month 3 (progress updates, success stories), Month 6 (completion celebration, future vision). Messaging: Transparency about challenges, commitment to people, service continuity assurance, community partnership maintenance.',
        guideline:
          'Organizational change communication requiring sensitivity, transparency, and stakeholder-specific messaging',
        embeddedData: true,
        acpaCognitiveDemands: ['content_quality', 'memory_integration', 'knowledge_transfer'],
        memoryIntegrationOpportunity: 'Change impact synthesis across multiple stakeholder groups',
      },
      // Pattern 5: Executive summary creation
      {
        patternType: 'executive_summary_creation',
        example:
          'Transform detailed market research report into executive summary for C-suite decision-making. Source data: 150-page market analysis covering 5 target markets, 12 competitor profiles, 3 technology trends, regulatory landscape in 8 countries, customer survey data from 2,500 respondents, financial projections with 3 scenarios. Executive priorities: Market entry decision, resource allocation, timeline planning, risk assessment. Constraints: 2-page maximum, focused on actionable insights and strategic recommendations.',
        expectedInsight:
          'Executive summary structure: Strategic recommendation (market entry priority), key market opportunity ($45M TAM, 15% growth), competitive landscape (2 major players, opportunity for differentiation), resource requirements ($8M investment, 18-month timeline), risk mitigation (regulatory compliance strategy, competitive response planning), financial projections (conservative: 12% ROI, optimistic: 28% ROI).',
        guideline:
          'Complex information distillation requiring strategic focus and executive-level presentation',
        embeddedData: true,
        acpaCognitiveDemands: ['content_quality', 'processing_efficiency', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Information synthesis requiring strategic prioritization and executive communication',
      },
    ],
    testPatterns: [
      'Multi-channel change management communication with embedded impact data, stakeholder concerns, and resistance mitigation strategies',
      'Executive summary creation from complex technical project requiring audience-appropriate abstraction and strategic framing',
      'Customer success story development with embedded metrics requiring narrative construction and value demonstration',
      'Cross-cultural business communication requiring cultural adaptation and relationship-building focus',
      'Crisis communication requiring multi-audience coordination with consistent messaging and tone adaptation',
    ],
  },

  // ============================================================
  // PROBLEM SOLVING DOMAIN
  // Focus: memory_integration, complexity_handling, knowledge_transfer
  // ============================================================
  problem_solving: {
    controlPatterns: [
      // Pattern 1: Systematic root cause analysis
      {
        patternType: 'systematic_root_cause_analysis',
        example:
          'Customer satisfaction dropped from 4.2/5 to 3.1/5 over 6 weeks. Timeline data: Week 1 - New order system launched, 4.1/5 satisfaction; Week 2 - Customer service training completed, 4.0/5; Week 3 - Pricing structure updated, 3.8/5; Week 4 - Product quality issues reported, 3.6/5; Week 5 - Shipping delays increased, 3.3/5; Week 6 - Competitor launched promotion, 3.1/5. Additional data: Order system errors 15%, training completion 85%, price increase 12%, quality complaints up 200%, shipping delays 3.2 days average. Identify primary cause and solution strategy.',
        expectedInsight:
          'Primary root cause: Product quality issues (Week 4, 200% complaint increase) compounded by shipping delays (Week 5). Order system and pricing are secondary factors. Solution strategy: 1) Immediate quality control audit, 2) Expedited shipping for affected orders, 3) Customer communication about improvements, 4) Order system bug fixes, 5) Pricing impact assessment.',
        method:
          'Timeline correlation analysis, impact magnitude assessment, systemic cause identification',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'memory_integration', 'knowledge_transfer'],
        memoryIntegrationOpportunity:
          'Multi-factor cause analysis requiring systematic problem-solving synthesis',
      },
      // Pattern 2: Multi-criteria optimization decision
      {
        patternType: 'multi_criteria_optimization_decision',
        example:
          'Select enterprise software solution from three options with weighted criteria. Option A: Cost $150K, Implementation 6 months, Features 85% match, Vendor stability High, Scalability Good, Support 24/7. Option B: Cost $200K, Implementation 4 months, Features 95% match, Vendor stability Medium, Scalability Excellent, Support Business hours. Option C: Cost $100K, Implementation 8 months, Features 75% match, Vendor stability Low, Scalability Limited, Support Email only. Weights: Cost (20%), Speed (25%), Features (30%), Stability (15%), Scalability (10%). Calculate weighted scores and recommend solution with justification.',
        expectedInsight:
          'Weighted analysis: A = 0.7×20 + 0.6×25 + 0.85×30 + 0.9×15 + 0.7×10 = 76.5. B = 0.5×20 + 0.8×25 + 0.95×30 + 0.6×15 + 0.9×10 = 77.5. C = 0.9×20 + 0.4×25 + 0.75×30 + 0.3×15 + 0.3×10 = 65.5. Recommendation: Option B (highest score) despite higher cost, due to superior features and implementation speed. Risk mitigation: Vendor stability assessment and backup plan.',
        calculation: 'Multi-criteria decision analysis with weighted scoring and risk assessment',
        embeddedData: true,
        acpaCognitiveDemands: [
          'complexity_handling',
          'processing_efficiency',
          'construct_validity',
        ],
        memoryIntegrationOpportunity:
          'Multi-dimensional evaluation requiring systematic decision framework synthesis',
      },
      // Pattern 3: Innovation challenge synthesis
      {
        patternType: 'innovation_challenge_synthesis',
        example:
          'Develop solution for urban delivery optimization challenge: Constraints - Traffic congestion (average 35% time increase during peak), Environmental regulations (emission limits in city center), Cost pressures (fuel costs up 40%, labor costs up 25%), Customer expectations (2-hour delivery windows). Available technologies: Electric vehicles (50% higher cost, 60% emission reduction), Route optimization AI (15% efficiency gain, $200K implementation), Drone delivery (regulatory approval pending, 70% cost reduction for <2kg packages), Micro-fulfillment centers (40% faster delivery, $2M setup cost). Design integrated solution.',
        expectedInsight:
          'Hybrid solution: Phase 1 - Route optimization AI + electric vehicle pilot (immediate 15% efficiency, gradual emission compliance), Phase 2 - Micro-fulfillment center in high-density area (40% delivery time reduction), Phase 3 - Drone integration for suitable packages (pending regulation). Expected outcomes: 45% emission reduction, 25% delivery time improvement, 15% cost reduction after 18-month implementation.',
        method:
          'Technology synthesis with constraint optimization and phased implementation planning',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'knowledge_transfer', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Innovation synthesis requiring technology integration and practical implementation',
      },
      // Pattern 4: Process optimization design
      {
        patternType: 'process_optimization_design',
        example:
          'Current customer onboarding process analysis and optimization: Current state - Application submission (manual, 45 min), Credit check (automated, 15 min), Document review (manual, 90 min), Approval decision (manual, 30 min), Account setup (semi-automated, 60 min), Welcome communication (manual, 15 min). Total: 4.25 hours, 65% automation. Target: 2 hours, 85% automation. Constraints: Regulatory compliance required for credit and approval steps, document review cannot be fully automated. Design optimized process with implementation plan.',
        expectedInsight:
          'Optimized process: Application (automated forms, 15 min), Credit check (existing, 15 min), Document review (AI pre-screening + human validation, 45 min), Approval (rule-based + exception handling, 15 min), Account setup (fully automated, 20 min), Welcome (automated, 5 min). Total: 1.75 hours, 85% automation. Implementation: Phase 1 - Application automation (2 weeks), Phase 2 - Document AI (6 weeks), Phase 3 - Account setup automation (4 weeks).',
        method:
          'Process mapping, bottleneck analysis, automation opportunity assessment, implementation planning',
        embeddedData: true,
        acpaCognitiveDemands: [
          'complexity_handling',
          'processing_efficiency',
          'knowledge_transfer',
        ],
        memoryIntegrationOpportunity:
          'Process design requiring systematic optimization and implementation strategy synthesis',
      },
      // Pattern 5: Strategic decision under uncertainty
      {
        patternType: 'strategic_decision_uncertainty',
        example:
          'Market entry decision for emerging technology sector: Market scenarios - Rapid adoption (40% probability, $50M opportunity, 18-month window), Gradual adoption (35% probability, $25M opportunity, 36-month window), Market resistance (25% probability, $5M opportunity, technology pivot required). Investment options: Full commitment ($15M investment, high reward/risk), Phased approach ($8M initial, additional $10M if successful), Partnership strategy ($5M investment, shared returns), Wait-and-see ($2M market monitoring, delayed entry). Stakeholder risk tolerance: Moderate. Analyze options and recommend strategy.',
        expectedInsight:
          'Expected value analysis: Full commitment $16.25M, Phased approach $14.8M, Partnership $12.5M, Wait-and-see $8.2M. Recommendation: Phased approach optimal given moderate risk tolerance. Phase 1: $8M investment targeting gradual adoption scenario. Decision gates: Month 12 market assessment, Month 18 expansion decision. Risk mitigation: Technology partnership for credibility, customer pilot program for validation, competitive monitoring for timing optimization.',
        method:
          'Decision tree analysis with expected value calculation and risk-adjusted strategy selection',
        embeddedData: true,
        acpaCognitiveDemands: ['complexity_handling', 'memory_integration', 'construct_validity'],
        memoryIntegrationOpportunity:
          'Strategic decision synthesis requiring uncertainty analysis and risk management',
      },
    ],
    testPatterns: [
      'Complex system performance optimization with embedded baseline metrics, constraint analysis, and multi-dimensional improvement targets',
      'Strategic decision-making under uncertainty with embedded scenario data, stakeholder analysis, and risk-return evaluation',
      'Innovation challenge requiring creative synthesis of embedded technology capabilities, market needs, and resource constraints',
      'Root cause analysis requiring systematic investigation of multi-factor problems with timeline correlation',
      'Process optimization requiring efficiency analysis and systematic improvement design with implementation planning',
    ],
  },
};

/**
 * Get pattern for a specific domain and scenario type
 * Uses 5-pattern cycling based on scenario number (from n8n workflow)
 */
export function getPatternForScenario(
  domain: Domain,
  scenarioType: 'control' | 'test',
  patternIndex: number = 0,
):
  | DomainPattern
  | { patternType: string; guidance: string; instruction: string; acpaFocus: string } {
  const patterns = DOMAIN_PATTERNS[domain];

  if (!patterns) {
    throw new Error(`Domain not found: ${domain}`);
  }

  if (scenarioType === 'control') {
    // Return control pattern with 5-pattern cycling
    const pattern = patterns.controlPatterns[patternIndex % 5] || patterns.controlPatterns[0];
    return {
      ...pattern,
    };
  } else {
    // Return test pattern guidance
    return {
      patternType: 'maac_enhanced_open_ended',
      guidance: patterns.testPatterns[patternIndex % 5] || patterns.testPatterns[0],
      instruction:
        'Create scenarios with all necessary data embedded that test MAAC cognitive dimensions',
      acpaFocus:
        'Design for complexity handling, knowledge transfer, and memory integration opportunities',
    };
  }
}

/**
 * Get MAAC usage guidance for scenario generation
 */
export const MAAC_USAGE_GUIDANCE = {
  forControl:
    'Use specific_pattern data and calculations to create measurable scenarios with embedded data that test multiple MAAC dimensions',
  forTest:
    'Create realistic scenarios with all necessary context and data embedded that challenge MAAC cognitive capabilities',
  keyPrinciple:
    'All scenarios must be self-contained with MAAC cognitive complexity - no external data dependencies',
  maacIntegration:
    'Ensure scenarios test complexity handling, memory integration, knowledge transfer, and other MAAC dimensions',
};

/**
 * Cognitive testing framework configuration
 */
export const COGNITIVE_TESTING_FRAMEWORK = {
  primaryDimensions: [
    'complexity_handling',
    'memory_integration',
    'knowledge_transfer',
    'content_quality',
  ],
  secondaryDimensions: ['processing_efficiency', 'tool_execution', 'construct_validity'],
  assessmentFocus: 'Multi-dimensional cognitive architecture evaluation',
};
