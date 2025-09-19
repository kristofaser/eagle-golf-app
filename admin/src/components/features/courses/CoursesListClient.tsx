'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import type { GolfCourse } from '@/types/golf-course';
import { useCourses } from '@/hooks/useCourses';
import CourseFilters from './CourseFilters';
import CourseActions from './CourseActions';

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

// Pagination client-side simple
function ClientPagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Précédent
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            page === currentPage
              ? 'text-white bg-primary border border-primary'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
}

export default function CoursesListClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { courses, count, totalPages, currentPage, isLoading, error } = useCourses({
    search,
    page,
    limit: 12
  });

  // Reset page lors d'un changement de recherche
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-2">Erreur lors du chargement</div>
        <p className="text-gray-400">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres de recherche */}
      <CourseFilters
        search={search}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
      />

      {/* Liste des parcours */}
      {isLoading && courses.length === 0 ? (
        <CoursesLoading />
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">Aucun parcours trouvé</div>
          <p className="text-gray-400">Essayez de modifier votre recherche</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          <ClientPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}