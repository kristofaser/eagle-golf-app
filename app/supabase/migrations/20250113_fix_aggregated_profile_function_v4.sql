-- Correction de la fonction RPC - Utilisation de la table reviews pour les ratings
-- Corrige l'erreur "column b.rating does not exist"

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
  -- Récupérer les données du profil avec SEULEMENT les colonnes qui existent
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
        'created_at', pp.created_at
      )
      FROM pro_profiles pp
      WHERE pp.user_id = p.id
    ),
    'amateur_profiles', (
      SELECT json_build_object(
        'user_id', ap.user_id,
        'handicap', ap.handicap,
        'play_frequency', ap.play_frequency,
        'play_days', ap.play_days,
        'prefers_morning', ap.prefers_morning,
        'home_course', ap.home_course,
        'seeking_pro_tips', ap.seeking_pro_tips,
        'created_at', ap.created_at
      )
      FROM amateur_profiles ap
      WHERE ap.user_id = p.id
    )
  ) INTO profile_data
  FROM profiles p
  WHERE p.id = profile_id;

  -- Récupérer les disponibilités
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', pa.id,
        'pro_id', pa.pro_id,
        'start_date', pa.start_date,
        'end_date', pa.end_date,
        'days_of_week', pa.days_of_week,
        'start_time', pa.start_time,
        'end_time', pa.end_time,
        'is_active', pa.is_active,
        'created_at', pa.created_at,
        'updated_at', pa.updated_at
      )
      ORDER BY pa.start_date
    ),
    '[]'::json
  ) INTO availabilities_data
  FROM pro_availabilities pa
  WHERE pa.pro_id = profile_id
    AND pa.is_active = true
    AND (start_date IS NULL OR pa.end_date >= start_date)
    AND (end_date IS NULL OR pa.start_date <= end_date);

  -- Récupérer les tarifs
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', pp.id,
        'pro_id', pp.pro_id,
        'holes', pp.holes,
        'players_count', pp.players_count,
        'price', pp.price,
        'created_at', pp.created_at,
        'updated_at', pp.updated_at
      )
      ORDER BY pp.holes, pp.players_count
    ),
    '[]'::json
  ) INTO pricing_data
  FROM pro_pricing pp
  WHERE pp.pro_id = profile_id;

  -- Calculer les statistiques avec jointure sur la table reviews
  SELECT json_build_object(
    'totalBookings', COUNT(DISTINCT CASE WHEN b.status IN ('confirmed', 'completed') THEN b.id END),
    'averageRating', COALESCE(
      AVG(r.rating)::numeric(3,1),
      4.5
    ),
    'totalReviews', COUNT(DISTINCT r.id),
    'completionRate', 
      CASE 
        WHEN COUNT(DISTINCT b.id) > 0 THEN 
          (COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::float / COUNT(DISTINCT b.id)::float * 100)
        ELSE 0
      END
  ) INTO stats_data
  FROM bookings b
  LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewee_id = profile_id
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

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_aggregated_pro_profile(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_aggregated_pro_profile(UUID, DATE, DATE) TO anon;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.get_aggregated_pro_profile IS 'Récupère toutes les données agrégées d''un profil professionnel incluant les statistiques depuis la table reviews';