import { StudentReceivableViewContent } from './StudentReceivableViewContent';

export default async function StudentReceivablePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <div className="space-y-6">
      <StudentReceivableViewContent studentId={studentId} />
    </div>
  );
}
