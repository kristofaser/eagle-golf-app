'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createCourse } from '@/lib/actions/courses';
import { Button } from '@/components/ui/Button';
import CourseSidebar from './CourseSidebar';
import { useCourses } from '@/hooks/useCourses';

export default function CreateCourseButton() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { mutate } = useCourses();

  const handleCreate = async (formData: Record<string, unknown>) => {
    const result = await createCourse(formData);
    if (!result.success) {
      throw new Error(result.error);
    }
    mutate();
  };

  return (
    <>
      <Button onClick={() => setIsSidebarOpen(true)}>
        <Plus className="h-5 w-5 mr-2" />
        Ajouter un parcours
      </Button>

      <CourseSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        course={null}
        onSave={handleCreate}
      />
    </>
  );
}