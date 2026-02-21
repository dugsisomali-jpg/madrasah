import { TeachersList } from './TeachersList';

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Teachers</h1>
      <TeachersList />
    </div>
  );
}
