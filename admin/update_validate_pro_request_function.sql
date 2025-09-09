-- Mise à jour de la fonction validate_pro_request pour gérer les tarifs
-- À exécuter manuellement dans l'interface Supabase SQL Editor

CREATE OR REPLACE FUNCTION validate_pro_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_action text,
  p_admin_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request pro_validation_requests%ROWTYPE;
  v_user_id uuid;
  v_pro_profile_id uuid;
  v_result json;
BEGIN
  -- Vérifier que l'action est valide
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Action non valide: %', p_action;
  END IF;

  -- Récupérer et verrouiller la demande
  SELECT * INTO v_request
  FROM pro_validation_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;

  v_user_id := v_request.user_id;

  -- Mettre à jour le statut de la demande
  UPDATE pro_validation_requests
  SET 
    status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    validated_at = NOW(),
    admin_id = p_admin_id,
    admin_notes = p_admin_notes
  WHERE id = p_request_id;

  -- Si approuvé, convertir l'utilisateur en professionnel
  IF p_action = 'approve' THEN
    -- Appeler la fonction de conversion
    SELECT convert_amateur_to_pro(v_user_id, p_request_id) INTO v_result;
    
    -- Récupérer l'ID du profil pro créé
    SELECT id INTO v_pro_profile_id 
    FROM pro_profiles 
    WHERE user_id = v_user_id;

    -- Créer les entrées de tarifs si elles sont fournies dans la demande
    IF v_request.price_9_holes_1_player IS NOT NULL THEN
      INSERT INTO pro_pricing (pro_id, holes, players_count, price)
      VALUES (v_pro_profile_id, 9, 1, v_request.price_9_holes_1_player);
    END IF;

    IF v_request.price_9_holes_2_players IS NOT NULL THEN
      INSERT INTO pro_pricing (pro_id, holes, players_count, price)
      VALUES (v_pro_profile_id, 9, 2, v_request.price_9_holes_2_players);
    END IF;

    IF v_request.price_9_holes_3_players IS NOT NULL THEN
      INSERT INTO pro_pricing (pro_id, holes, players_count, price)
      VALUES (v_pro_profile_id, 9, 3, v_request.price_9_holes_3_players);
    END IF;

    IF v_request.price_18_holes_1_player IS NOT NULL THEN
      INSERT INTO pro_pricing (pro_id, holes, players_count, price)
      VALUES (v_pro_profile_id, 18, 1, v_request.price_18_holes_1_player);
    END IF;

    IF v_request.price_18_holes_2_players IS NOT NULL THEN
      INSERT INTO pro_pricing (pro_id, holes, players_count, price)
      VALUES (v_pro_profile_id, 18, 2, v_request.price_18_holes_2_players);
    END IF;

    IF v_request.price_18_holes_3_players IS NOT NULL THEN
      INSERT INTO pro_pricing (pro_id, holes, players_count, price)
      VALUES (v_pro_profile_id, 18, 3, v_request.price_18_holes_3_players);
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'action', p_action,
    'request_id', p_request_id,
    'user_id', v_user_id,
    'validated_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;