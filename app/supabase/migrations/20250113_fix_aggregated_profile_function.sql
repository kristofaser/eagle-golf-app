-- Correction de la fonction RPC pour récupérer toutes les données d'un profil pro
-- Corrige l'erreur "column pp.id does not exist"

DROP FUNCTION IF EXISTS public.get_aggregated_pro_profile(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION public.get_aggregated_pro_profile(
  profile_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  profile_data JSON;
  availabilities_data JSON;
  pricing_data JSON;
  stats_data JSON;
BEGIN
  -- Récupérer les données du profil
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone', p.phone,
    'city', p.city,
    'avatar_url', p.avatar_url,
    'user_type', p.user_type,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'pro_profiles', (
      SELECT json_build_object(
        'user_id', pp.user_id,
        'date_of_birth', pp.date_of_birth,
        'siret', pp.siret,
        'company_status', pp.company_status,
        'division', pp.division,
        'world_ranking', pp.world_ranking,
        'skill_driving', pp.skill_driving,
        'skill_irons', pp.skill_irons,
        'skill_wedging', pp.skill_wedging,
        'skill_chipping', pp.skill_chipping,
        'skill_putting', pp.skill_putting,
        'skill_mental', pp.skill_mental,
        'experience', pp.experience,
        'golf_affiliations', pp.golf_affiliations,
        'can_travel', pp.can_travel,
        'travel_radius_km', pp.travel_radius_km,
        'is_globally_available', pp.is_globally_available,
        'unavailable_reason', pp.unavailable_reason
      )
      FROM pro_profiles pp
      WHERE pp.user_id = p.id
    )
  ) INTO profile_data
  FROM profiles p
  WHERE p.id = profile_id;

  -- Si le profil n'existe pas, retourner une erreur
  IF profile_data IS NULL THEN
    RAISE EXCEPTION 'Profile not found: %', profile_id;
  END IF;

  -- Récupérer les disponibilités
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', pa.id,
        'pro_id', pa.pro_id,
        'golf_course_id', pa.golf_course_id,
        'date', pa.date,
        'start_time', pa.start_time,
        'end_time', pa.end_time,
        'is_available', pa.is_available,
        'notes', pa.notes,
        'created_at', pa.created_at,
        'golf_courses', (
          SELECT json_build_object(
            'id', gc.id,
            'name', gc.name,
            'city', gc.city
          )
          FROM golf_courses gc
          WHERE gc.id = pa.golf_course_id
        )
      )
      ORDER BY pa.date, pa.start_time
    ),
    '[]'::json
  ) INTO availabilities_data
  FROM pro_availabilities pa
  WHERE pa.pro_id = profile_id
    AND pa.date >= start_date
    AND pa.date <= end_date
    AND pa.is_available = true;

  -- Récupérer les tarifs
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', pp.id,
        'pro_id', pp.pro_id,
        'holes', pp.holes,
        'players_count', pp.players_count,
        'price', pp.price,
        'currency', pp.currency,
        'description', pp.description,
        'created_at', pp.created_at,
        'updated_at', pp.updated_at
      )
      ORDER BY pp.holes, pp.players_count
    ),
    '[]'::json
  ) INTO pricing_data
  FROM pro_pricing pp
  WHERE pp.pro_id = profile_id;

  -- Calculer les statistiques
  SELECT json_build_object(
    'totalBookings', COUNT(CASE WHEN b.status IN ('confirmed', 'completed') THEN 1 END),
    'averageRating', COALESCE(AVG(
      CASE 
        WHEN b.rating IS NOT NULL THEN b.rating
        ELSE NULL
      END
    ), 4.5),
    'completionRate', 
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(CASE WHEN b.status = 'completed' THEN 1 END)::float / COUNT(*)::float * 100)
        ELSE 0
      END
  ) INTO stats_data
  FROM bookings b
  WHERE b.pro_id = profile_id;

  -- Construire le résultat final
  result := json_build_object(
    'profile', profile_data,
    'availabilities', availabilities_data,
    'pricing', pricing_data,
    'stats', stats_data
  );

  RETURN result;
END;
$$;

-- Donner les permissions appropriées
GRANT EXECUTE ON FUNCTION public.get_aggregated_pro_profile(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_aggregated_pro_profile(UUID, DATE, DATE) TO anon;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION public.get_aggregated_pro_profile(UUID, DATE, DATE) IS 
'Récupère toutes les données d''un profil professionnel en une seule requête optimisée. 
Inclut le profil, les disponibilités, les tarifs et les statistiques. 
Utilisé pour améliorer les performances en réduisant le nombre d''appels API.';