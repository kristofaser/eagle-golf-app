import CreateCourseButton from '@/components/features/courses/CreateCourseButton';
import CoursesListClient from '@/components/features/courses/CoursesListClient';

export default function CoursesPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parcours de golf</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les parcours de golf partenaires de la plateforme
            </p>
          </div>
          <CreateCourseButton />
        </div>
      </div>

      {/* Courses List with Client-side Search */}
      <CoursesListClient />
    </div>
  );
}