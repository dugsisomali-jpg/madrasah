import { StudentsList } from './StudentsList';

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Students</h1>
      <StudentsList />
    </div>
  );
}
