'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

export async function createCourse(formData: CourseFormData) {
  try {
    // Validation des données
    const validatedData = courseSchema.parse(formData);
    
    // Nettoyer les chaînes vides
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('golf_parcours')
      .insert([{
        ...cleanData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création: ${error.message}`);
    }

    revalidatePath('/courses');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur createCourse:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides',
        details: error.errors 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

export async function updateCourse(id: string, formData: CourseFormData) {
  try {
    // Validation des données
    const validatedData = courseSchema.parse(formData);
    
    // Nettoyer les chaînes vides
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('golf_parcours')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    revalidatePath('/courses');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur updateCourse:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides',
        details: error.errors 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

export async function deleteCourse(id: string) {
  try {
    const supabase = await createServiceClient();

    // Vérifier s'il y a des réservations liées
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('golf_course_id', id)
      .limit(1);

    if (bookingsError) {
      throw new Error(`Erreur lors de la vérification: ${bookingsError.message}`);
    }

    if (bookings && bookings.length > 0) {
      return { 
        success: false, 
        error: 'Impossible de supprimer ce parcours car il a des réservations associées.' 
      };
    }

    const { error } = await supabase
      .from('golf_parcours')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }

    revalidatePath('/courses');
    return { success: true };
  } catch (error) {
    console.error('Erreur deleteCourse:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}