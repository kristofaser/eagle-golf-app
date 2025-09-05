import { supabase } from '@/utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { PaginationParams } from '@/types/utils';

export interface ServiceResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export abstract class BaseService {
  protected supabase = supabase;

  protected handleError(error: any): Error {
    console.error('Service error:', error);

    if (error?.message) {
      return new Error(error.message);
    }

    return new Error("Une erreur inattendue s'est produite");
  }

  protected getPaginationRange(params: PaginationParams) {
    const { page = 1, limit = 10 } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return { from, to };
  }

  protected async handleResponse<T>(promise: Promise<any>): Promise<ServiceResponse<T>> {
    try {
      const response = await promise;

      if (response.error) {
        return {
          data: null,
          error: response.error,
        };
      }

      return {
        data: response.data,
        error: null,
      };
    } catch (error: any) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
}
