import { MemorizationContent } from './MemorizationContent';

export default function MemorizationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Memorization</h1>
      <MemorizationContent />
    </div>
  );
}
