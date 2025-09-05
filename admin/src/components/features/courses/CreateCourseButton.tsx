'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createCourse } from '@/lib/actions/courses';
import { Button } from '@/components/ui/Button';
import CourseModal from './CourseModal';

export default function CreateCourseButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = async (formData: Record<string, unknown>) => {
    const result = await createCourse(formData);
    if (!result.success) {
      throw new Error(result.error);
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Ajouter un parcours
      </Button>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={null}
        onSave={handleCreate}
      />
    </>
  );
}