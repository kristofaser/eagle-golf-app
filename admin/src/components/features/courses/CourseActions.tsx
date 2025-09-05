'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { updateCourse, deleteCourse } from '@/lib/actions/courses';
import type { GolfCourse } from '@/types/golf-course';
import CourseModal from './CourseModal';
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';

interface CourseActionsProps {
  course: GolfCourse;
}

export default function CourseActions({ course }: CourseActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = async (formData: Record<string, unknown>) => {
    const result = await updateCourse(course.id, formData);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce parcours ?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteCourse(course.id);
      if (!result.success) {
        alert(result.error);
      }
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dropdown
        trigger={
          <div className="text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical className="h-5 w-5" />
          </div>
        }
      >
        <DropdownItem onClick={() => setIsEditModalOpen(true)}>
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Modifier
          </div>
        </DropdownItem>
        <DropdownItem 
          onClick={handleDelete}
          variant="danger"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </div>
        </DropdownItem>
      </Dropdown>

      <CourseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        course={course}
        onSave={handleEdit}
      />
    </>
  );
}