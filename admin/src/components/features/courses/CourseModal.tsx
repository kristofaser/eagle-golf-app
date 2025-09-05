'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { GolfCourse } from '@/types/golf-course';

const courseSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  holes_count: z.coerce.number().int().min(1).max(54).optional(),
  description: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: GolfCourse | null;
  onSave: (data: CourseFormData) => Promise<void>;
}

export default function CourseModal({ isOpen, onClose, course, onSave }: CourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!course;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? {
      name: course.name,
      city: course.city || '',
      postal_code: course.postal_code || '',
      department: course.department || '',
      phone: course.phone || '',
      email: course.email || '',
      website: course.website || '',
      holes_count: course.holes_count || undefined,
      description: course.description || '',
    } : {
      name: '',
      city: '',
      postal_code: '',
      department: '',
      phone: '',
      email: '',
      website: '',
      holes_count: undefined,
      description: '',
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Modifier le parcours' : 'Ajouter un parcours'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations principales */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du parcours *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nom du parcours de golf"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                {...register('city')}
                type="text"
                id="city"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ville"
              />
            </div>

            <div>
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-2">
                Code postal
              </label>
              <input
                {...register('postal_code')}
                type="text"
                id="postal_code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="75001"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Département
              </label>
              <input
                {...register('department')}
                type="text"
                id="department"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="75"
              />
            </div>
          </div>

          <div>
            <label htmlFor="holes_count" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de trous
            </label>
            <select
              {...register('holes_count')}
              id="holes_count"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Sélectionner...</option>
              <option value="9">9 trous</option>
              <option value="18">18 trous</option>
              <option value="27">27 trous</option>
              <option value="36">36 trous</option>
            </select>
            {errors.holes_count && (
              <p className="mt-1 text-sm text-red-600">{errors.holes_count.message}</p>
            )}
          </div>
        </div>

        {/* Informations de contact */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informations de contact</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="01 23 45 67 89"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="contact@golf.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <input
              {...register('website')}
              type="url"
              id="website"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://www.golf.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-gray-200 pt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Description du parcours de golf..."
          />
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}