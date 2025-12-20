import { ExperimentForm } from '@/components/experiment-form';

export default function NewExperimentPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Create New Experiment</h1>
        <p className="mt-2 text-gray-600">Configure and launch a new MAAC experiment</p>

        <div className="mt-8">
          <ExperimentForm />
        </div>
      </div>
    </div>
  );
}
