'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const domains = [
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'creative_writing', label: 'Creative Writing' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'technical_reasoning', label: 'Technical Reasoning' },
];

const tiers = [
  { value: '1a', label: 'Tier 1a - Scenario Generation Only', description: 'Generate scenarios without running experiments' },
  { value: '1b', label: 'Tier 1b - MIMIC Experiment Processing', description: 'Run MIMIC experiments with cognitive engine' },
  { value: '2', label: 'Tier 2 - Advanced Analysis', description: 'Dataset-level statistical analysis' },
];

export function ExperimentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    tier: '',
    replicationCount: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Experiment name is required';
    }
    
    if (!formData.domain) {
      newErrors.domain = 'Please select a domain';
    }
    
    if (!formData.tier) {
      newErrors.tier = 'Please select a tier';
    }
    
    if (formData.replicationCount < 1 || formData.replicationCount > 100) {
      newErrors.replicationCount = 'Replication count must be between 1 and 100';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // TODO: Connect to API endpoint
      console.log('Submitting experiment:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to experiments list
      router.push('/experiments');
    } catch (error) {
      console.error('Failed to create experiment:', error);
      setErrors({ submit: 'Failed to create experiment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">Provide details about your experiment</p>
        
        <div className="mt-6 space-y-4">
          {/* Experiment Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Experiment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="e.g., GPT-4 Problem Solving Baseline"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe the purpose and goals of this experiment..."
            />
          </div>
        </div>
      </div>

      {/* Experiment Configuration */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
        <p className="mt-1 text-sm text-gray-500">Select domain and tier settings</p>
        
        <div className="mt-6 space-y-4">
          {/* Domain Selection */}
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Domain <span className="text-red-500">*</span>
            </label>
            <select
              id="domain"
              value={formData.domain}
              onChange={(e) => handleChange('domain', e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                errors.domain
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select a domain...</option>
              {domains.map((domain) => (
                <option key={domain.value} value={domain.value}>
                  {domain.label}
                </option>
              ))}
            </select>
            {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tier <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 space-y-2">
              {tiers.map((tier) => (
                <div
                  key={tier.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                    formData.tier === tier.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-300'
                  }`}
                  onClick={() => handleChange('tier', tier.value)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="tier"
                      value={tier.value}
                      checked={formData.tier === tier.value}
                      onChange={(e) => handleChange('tier', e.target.value)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      {tier.label}
                    </label>
                    <p className="text-sm text-gray-500">{tier.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors.tier && <p className="mt-1 text-sm text-red-600">{errors.tier}</p>}
          </div>

          {/* Replication Count */}
          <div>
            <label htmlFor="replicationCount" className="block text-sm font-medium text-gray-700">
              Replication Count
            </label>
            <input
              type="number"
              id="replicationCount"
              min="1"
              max="100"
              value={formData.replicationCount}
              onChange={(e) => handleChange('replicationCount', parseInt(e.target.value, 10))}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                errors.replicationCount
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of times to replicate each scenario (1-100)
            </p>
            {errors.replicationCount && (
              <p className="mt-1 text-sm text-red-600">{errors.replicationCount}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Experiment'}
        </button>
      </div>
    </form>
  );
}
