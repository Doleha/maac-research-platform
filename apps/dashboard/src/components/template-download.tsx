'use client';

import { Download, FileSpreadsheet, FileJson } from 'lucide-react';

// MAAC-compatible CSV template headers
const CSV_TEMPLATE_HEADERS = [
  'task_id',
  'task_title',
  'task_description',
  'business_context',
  'domain',
  'scenario_type',
  'complexity_level',
  'requirements',
  'success_criteria',
  'expected_calculations',
  'expected_insights',
  'estimated_duration',
  'metadata',
];

const CSV_EXAMPLE_ROWS = [
  {
    task_id: 'ps_001',
    task_title: 'Quarterly Budget Variance Analysis',
    task_description: 'Analyze Q3 budget variances across departments and identify cost-saving opportunities',
    business_context: 'CFO needs comprehensive budget analysis for board meeting. Company facing 12% cost overrun in operations.',
    domain: 'problem_solving',
    scenario_type: 'control',
    complexity_level: 'moderate',
    requirements: 'Financial analysis|Trend identification|Recommendations',
    success_criteria: 'Identify all variances >5%|Provide actionable insights|Include ROI projections',
    expected_calculations: '{"variance_percentage":true,"cost_savings":true,"roi":true}',
    expected_insights: 'Department comparison|Seasonal trends|Cost optimization areas',
    estimated_duration: '45-60 minutes',
    metadata: '{"department":"finance","priority":"high"}',
  },
  {
    task_id: 'cw_001',
    task_title: 'Product Launch Campaign Narrative',
    task_description: 'Create compelling narrative for new AI product launch targeting enterprise clients',
    business_context: 'Tech startup launching revolutionary AI tool. Need story that resonates with CTOs and VPs of Engineering.',
    domain: 'creative_writing',
    scenario_type: 'test',
    complexity_level: 'complex',
    requirements: 'Target audience analysis|Brand voice alignment|Technical credibility',
    success_criteria: 'Engaging hook|Clear value proposition|Emotional connection|Technical accuracy',
    expected_calculations: '{}',
    expected_insights: 'Customer pain points|Competitive differentiation|Call to action',
    estimated_duration: '60-90 minutes',
    metadata: '{"industry":"technology","audience":"enterprise"}',
  },
  {
    task_id: 'da_001',
    task_title: 'Customer Churn Prediction Analysis',
    task_description: 'Analyze customer usage patterns and identify high-risk churn candidates',
    business_context: 'SaaS company experiencing 8% monthly churn. Need predictive model to proactively retain customers.',
    domain: 'data_analysis',
    scenario_type: 'control',
    complexity_level: 'complex',
    requirements: 'Pattern recognition|Risk scoring|Segmentation|Retention strategy',
    success_criteria: 'Identify 80%+ of churners|Actionable segments|Retention tactics per segment',
    expected_calculations: '{"churn_probability":true,"lifetime_value":true,"engagement_score":true}',
    expected_insights: 'Usage patterns|Risk indicators|Intervention timing|Success metrics',
    estimated_duration: '90-120 minutes',
    metadata: '{"vertical":"saas","urgency":"critical"}',
  },
];

// MAAC-compatible JSON template
const JSON_TEMPLATE = [
  {
    task_id: 'ps_001',
    task_title: 'Quarterly Budget Variance Analysis',
    task_description: 'Analyze Q3 budget variances across departments and identify cost-saving opportunities',
    business_context: 'CFO needs comprehensive budget analysis for board meeting. Company facing 12% cost overrun in operations.',
    domain: 'problem_solving',
    scenario_type: 'control',
    complexity_level: 'moderate',
    requirements: ['Financial analysis', 'Trend identification', 'Recommendations'],
    success_criteria: ['Identify all variances >5%', 'Provide actionable insights', 'Include ROI projections'],
    expected_calculations: {
      variance_percentage: true,
      cost_savings: true,
      roi: true,
    },
    expected_insights: ['Department comparison', 'Seasonal trends', 'Cost optimization areas'],
    estimated_duration: '45-60 minutes',
    metadata: {
      department: 'finance',
      priority: 'high',
    },
  },
  {
    task_id: 'cw_001',
    task_title: 'Product Launch Campaign Narrative',
    task_description: 'Create compelling narrative for new AI product launch targeting enterprise clients',
    business_context: 'Tech startup launching revolutionary AI tool. Need story that resonates with CTOs and VPs of Engineering.',
    domain: 'creative_writing',
    scenario_type: 'test',
    complexity_level: 'complex',
    requirements: ['Target audience analysis', 'Brand voice alignment', 'Technical credibility'],
    success_criteria: ['Engaging hook', 'Clear value proposition', 'Emotional connection', 'Technical accuracy'],
    expected_calculations: {},
    expected_insights: ['Customer pain points', 'Competitive differentiation', 'Call to action'],
    estimated_duration: '60-90 minutes',
    metadata: {
      industry: 'technology',
      audience: 'enterprise',
    },
  },
  {
    task_id: 'da_001',
    task_title: 'Customer Churn Prediction Analysis',
    task_description: 'Analyze customer usage patterns and identify high-risk churn candidates',
    business_context: 'SaaS company experiencing 8% monthly churn. Need predictive model to proactively retain customers.',
    domain: 'data_analysis',
    scenario_type: 'control',
    complexity_level: 'complex',
    requirements: ['Pattern recognition', 'Risk scoring', 'Segmentation', 'Retention strategy'],
    success_criteria: ['Identify 80%+ of churners', 'Actionable segments', 'Retention tactics per segment'],
    expected_calculations: {
      churn_probability: true,
      lifetime_value: true,
      engagement_score: true,
    },
    expected_insights: ['Usage patterns', 'Risk indicators', 'Intervention timing', 'Success metrics'],
    estimated_duration: '90-120 minutes',
    metadata: {
      vertical: 'saas',
      urgency: 'critical',
    },
  },
];

export function TemplateDownload() {
  const downloadCSV = () => {
    // Create CSV content
    const headers = CSV_TEMPLATE_HEADERS.join(',');
    const rows = CSV_EXAMPLE_ROWS.map((row) =>
      CSV_TEMPLATE_HEADERS.map((header) => {
        const value = row[header as keyof typeof row] || '';
        // Escape commas and quotes in values
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(','),
    );

    const csvContent = [headers, ...rows].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'scenario_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    // Create JSON content
    const jsonContent = JSON.stringify(JSON_TEMPLATE, null, 2);

    // Create download
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'scenario_template.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">Download Template</h3>
          <p className="mt-1 text-xs text-blue-700">
            Download a pre-formatted template with example data to ensure your scenarios match the
            required schema
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download CSV Template
            </button>
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
            >
              <FileJson className="h-4 w-4" />
              Download JSON Template
            </button>
          </div>

          {/* Schema Documentation */}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-blue-800 hover:text-blue-900">
              View MAAC Schema Requirements
            </summary>
            <div className="mt-2 space-y-2 rounded border border-blue-200 bg-white p-3 text-xs">
              <div>
                <span className="font-semibold text-gray-900">All Fields Required:</span>
                <ul className="ml-4 mt-1 list-disc space-y-1 text-gray-700">
                  <li>
                    <code className="rounded bg-gray-100 px-1">task_id</code> - Unique identifier
                    (string)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">task_title</code> - Short descriptive
                    title (string)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">task_description</code> - Detailed task
                    description (string)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">business_context</code> - Real-world
                    business scenario (string)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">domain</code> - One of:
                    problem_solving, creative_writing, data_analysis, technical_reasoning
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">scenario_type</code> - Must be "control"
                    or "test"
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">complexity_level</code> - Must be
                    "simple", "moderate", or "complex"
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">requirements</code> - Array of strings
                    or pipe-separated (must not be empty)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">success_criteria</code> - Array of
                    success metrics (must not be empty)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">expected_calculations</code> - JSON
                    object of expected computations (must not be empty)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">expected_insights</code> - Array of
                    insights to discover (must not be empty)
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">estimated_duration</code> - Time
                    estimate (e.g., "30-45 minutes")
                  </li>
                  <li>
                    <code className="rounded bg-gray-100 px-1">metadata</code> - JSON object with
                    additional properties (must not be empty)
                  </li>
                </ul>
              </div>
              <div className="mt-2 rounded bg-blue-50 p-2">
                <p className="text-xs font-medium text-blue-900">
                  ℹ️ This schema is compatible with the MAAC experimental framework and will be
                  processed by the MIMIC cognitive engine.
                </p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
