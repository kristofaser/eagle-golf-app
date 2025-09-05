import { Suspense } from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import { getCourses, getDepartments } from '@/lib/services/courses';
import type { GolfCourse } from '@/types/golf-course';
import CourseFilters from '@/components/features/courses/CourseFilters';
import Pagination from '@/components/features/courses/Pagination';
import CourseActions from '@/components/features/courses/CourseActions';
import CreateCourseButton from '@/components/features/courses/CreateCourseButton';

// Composant de chargement
function CoursesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow animate-pulse">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Composant pour afficher un parcours
function CourseCard({ course }: { course: GolfCourse }) {
  const formatLocation = () => {
    const parts = [course.city, course.postal_code, course.department].filter(Boolean);
    return parts.join(', ') || 'Non spécifié';
  };

  const formatWebsite = (website: string | null) => {
    if (!website) return null;
    return website.startsWith('http') ? website : `https://${website}`;
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {formatLocation()}
            </div>
          </div>
          <CourseActions course={course} />
        </div>

        {course.holes_count && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {course.holes_count} trous
            </span>
          </div>
        )}

        {course.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
        )}

        <div className="space-y-2 text-sm">
          {course.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{course.phone}</span>
            </div>
          )}
          {course.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{course.email}</span>
            </div>
          )}
          {course.website && (
            <div className="flex items-center text-gray-600">
              <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
              <a
                href={formatWebsite(course.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-primary"
              >
                {course.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant principal des parcours
async function CoursesList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const page = parseInt((params?.page as string) || '1') || 1;
  const search = (params?.search as string) || '';
  const department = (params?.department as string) || '';
  const minHoles = params?.minHoles ? parseInt(params.minHoles as string) : undefined;
  const maxHoles = params?.maxHoles ? parseInt(params.maxHoles as string) : undefined;
  
  const { data: courses, count } = await getCourses(
    { search, department, minHoles, maxHoles },
    page,
    12
  );

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Aucun parcours trouvé</div>
        <p className="text-gray-400">Essayez de modifier vos filtres de recherche</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      
      {count > 12 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalItems={count}
            itemsPerPage={12}
          />
        </div>
      )}
    </>
  );
}

export default async function CoursesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Récupérer les départements pour les filtres
  const departments = await getDepartments();

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

      {/* Search and Filters */}
      <div className="mb-6">
        <CourseFilters departments={departments} />
      </div>

      {/* Courses List */}
      <Suspense fallback={<CoursesLoading />}>
        <CoursesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}