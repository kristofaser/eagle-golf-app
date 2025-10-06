import CreateCourseButton from '@/components/features/courses/CreateCourseButton';
import CoursesListClient from '@/components/features/courses/CoursesListClient';

export default function CoursesPage() {
  return (
    <div>
      <div className="mb-6 flex justify-end">
        <CreateCourseButton />
      </div>

      <CoursesListClient />
    </div>
  );
}