import { ExamsContent } from './ExamsContent';

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Exam Results</h1>
      <ExamsContent />
    </div>
  );
}
