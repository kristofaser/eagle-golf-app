-- =====================================================
-- TRIGGERS DE NOTIFICATIONS AUTOMATIQUES
-- Date: 2025-09-15
-- Description: Triggers pour créer automatiquement des notifications
-- lors des événements métier (bookings, payments, pro_validation)
-- =====================================================

-- 1. FONCTION UTILITAIRE - Vérifier les préférences utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION should_send_notification(
    p_user_id UUID,
    p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    prefs RECORD;
    notification_category TEXT;
BEGIN
    -- Récupérer les préférences utilisateur
    SELECT * INTO prefs
    FROM travel_notification_preferences
    WHERE user_id = p_user_id;

    -- Si pas de préférences, créer avec valeurs par défaut
    IF NOT FOUND THEN
        INSERT INTO travel_notification_preferences (user_id, enabled, in_app_enabled)
        VALUES (p_user_id, true, true)
        ON CONFLICT (user_id) DO NOTHING;
        RETURN true; -- Par défaut, envoyer les notifications
    END IF;

    -- Vérifier si les notifications sont activées globalement
    IF NOT prefs.in_app_enabled THEN
        RETURN false;
    END IF;

    -- Déterminer la catégorie de notification
    notification_category := CASE
        WHEN p_notification_type LIKE 'booking_%' THEN 'booking'
        WHEN p_notification_type LIKE 'payment_%' THEN 'payment'
        WHEN p_notification_type LIKE 'pro_%' THEN 'pro_status'
        WHEN p_notification_type = 'travel_alert' THEN 'travel_alert'
        ELSE 'system'
    END;

    -- Vérifier les préférences par catégorie
    IF prefs.notification_types IS NOT NULL THEN
        RETURN (prefs.notification_types->notification_category)::boolean = true;
    END IF;

    -- Par défaut, autoriser toutes les notifications métier
    RETURN notification_category != 'system';
END;
$$ LANGUAGE plpgsql;

-- 2. TRIGGER - Notifications pour les réservations (bookings)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_booking_changes()
RETURNS TRIGGER AS $$
DECLARE
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
    notification_data JSONB;
    target_user_id UUID;
BEGIN
    -- Déterminer le type de notification selon le statut
    CASE NEW.status
        WHEN 'confirmed' THEN
            notification_type := 'booking_confirmed';
            notification_title := 'Réservation confirmée';
            notification_message := 'Votre réservation a été confirmée par le professionnel.';

        WHEN 'cancelled' THEN
            notification_type := 'booking_cancelled';
            notification_title := 'Réservation annulée';
            notification_message := 'Votre réservation a été annulée.';

        WHEN 'modified' THEN
            notification_type := 'booking_modified';
            notification_title := 'Réservation modifiée';
            notification_message := 'Votre réservation a été modifiée. Veuillez vérifier les détails.';

        ELSE
            RETURN NEW; -- Pas de notification pour les autres statuts
    END CASE;

    -- L'amateur reçoit la notification
    target_user_id := NEW.amateur_id;

    -- Préparer les données contextuelles
    notification_data := jsonb_build_object(
        'booking_id', NEW.id,
        'status', NEW.status,
        'date_start', NEW.date_start,
        'date_end', NEW.date_end,
        'total_price', NEW.total_price,
        'deep_link', '/booking/' || NEW.id
    );

    -- Vérifier les préférences et créer la notification
    IF should_send_notification(target_user_id, notification_type) THEN
        PERFORM create_notification(
            target_user_id,
            notification_type,
            notification_title,
            notification_message,
            notification_data
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table bookings
DROP TRIGGER IF EXISTS trigger_notify_booking_changes ON bookings;
CREATE TRIGGER trigger_notify_booking_changes
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_booking_changes();

-- 3. TRIGGER - Notifications pour les paiements
-- =====================================================
CREATE OR REPLACE FUNCTION notify_payment_changes()
RETURNS TRIGGER AS $$
DECLARE
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
    notification_data JSONB;
    target_user_id UUID;
    booking_record RECORD;
BEGIN
    -- Vérifier les conditions du trigger
    IF TG_OP = 'INSERT' THEN
        -- Pour les insertions, uniquement si le statut est 'succeeded' ou 'failed'
        IF NEW.status NOT IN ('succeeded', 'failed') THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Pour les mises à jour, uniquement si le statut a changé et est dans les valeurs surveillées
        IF OLD.status IS NOT DISTINCT FROM NEW.status OR NEW.status NOT IN ('succeeded', 'failed', 'refunded') THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Récupérer les infos de la réservation
    SELECT * INTO booking_record
    FROM bookings
    WHERE id = NEW.booking_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Déterminer le type de notification selon le statut du paiement
    CASE NEW.status
        WHEN 'succeeded' THEN
            notification_type := 'payment_received';
            notification_title := 'Paiement confirmé';
            notification_message := 'Votre paiement de ' || NEW.amount || '€ a été traité avec succès.';

        WHEN 'failed' THEN
            notification_type := 'payment_failed';
            notification_title := 'Problème de paiement';
            notification_message := 'Votre paiement de ' || NEW.amount || '€ a échoué. Veuillez réessayer.';

        WHEN 'refunded' THEN
            notification_type := 'payment_refunded';
            notification_title := 'Remboursement effectué';
            notification_message := 'Votre remboursement de ' || NEW.amount || '€ a été traité.';

        ELSE
            RETURN NEW; -- Pas de notification pour les autres statuts
    END CASE;

    -- L'amateur reçoit la notification
    target_user_id := booking_record.amateur_id;

    -- Préparer les données contextuelles
    notification_data := jsonb_build_object(
        'payment_id', NEW.id,
        'booking_id', NEW.booking_id,
        'status', NEW.status,
        'amount', NEW.amount,
        'payment_method', NEW.payment_method,
        'deep_link', '/booking/' || NEW.booking_id
    );

    -- Vérifier les préférences et créer la notification
    IF should_send_notification(target_user_id, notification_type) THEN
        PERFORM create_notification(
            target_user_id,
            notification_type,
            notification_title,
            notification_message,
            notification_data
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table payments
DROP TRIGGER IF EXISTS trigger_notify_payment_changes ON payments;
CREATE TRIGGER trigger_notify_payment_changes
    AFTER INSERT OR UPDATE OF status ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_changes();

-- 4. TRIGGER - Notifications pour les validations professionnelles
-- =====================================================
CREATE OR REPLACE FUNCTION notify_pro_validation_changes()
RETURNS TRIGGER AS $$
DECLARE
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
    notification_data JSONB;
    target_user_id UUID;
BEGIN
    -- Déterminer le type de notification selon le statut
    CASE NEW.status
        WHEN 'approved' THEN
            notification_type := 'pro_approved';
            notification_title := 'Compte professionnel approuvé ! 🎉';
            notification_message := 'Félicitations ! Votre demande professionnelle a été approuvée. Vous pouvez maintenant recevoir des réservations.';

        WHEN 'rejected' THEN
            notification_type := 'pro_rejected';
            notification_title := 'Demande professionnelle mise à jour';
            notification_message := 'Votre demande professionnelle nécessite des ajustements. Consultez les détails pour plus d\'informations.';

        WHEN 'pending_documents' THEN
            notification_type := 'pro_document_required';
            notification_title := 'Documents requis';
            notification_message := 'Des documents supplémentaires sont nécessaires pour finaliser votre demande professionnelle.';

        ELSE
            RETURN NEW; -- Pas de notification pour les autres statuts
    END CASE;

    -- L'utilisateur demandeur reçoit la notification
    target_user_id := NEW.user_id;

    -- Préparer les données contextuelles
    notification_data := jsonb_build_object(
        'request_id', NEW.id,
        'status', NEW.status,
        'reason', COALESCE(NEW.rejection_reason, ''),
        'documents_required', COALESCE(NEW.required_documents, '[]'::jsonb),
        'deep_link', '/profile/pro-request/' || NEW.id
    );

    -- Vérifier les préférences et créer la notification
    IF should_send_notification(target_user_id, notification_type) THEN
        PERFORM create_notification(
            target_user_id,
            notification_type,
            notification_title,
            notification_message,
            notification_data
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table pro_validation_requests
DROP TRIGGER IF EXISTS trigger_notify_pro_validation_changes ON pro_validation_requests;
CREATE TRIGGER trigger_notify_pro_validation_changes
    AFTER UPDATE OF status ON pro_validation_requests
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_pro_validation_changes();

-- 5. FONCTION - Notification manuelle pour les voyages/événements
-- =====================================================
CREATE OR REPLACE FUNCTION create_travel_notification(
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_target_users UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    user_id UUID;
BEGIN
    -- Si aucun utilisateur spécifié, envoyer à tous ceux qui ont activé les alertes voyage
    IF p_target_users IS NULL THEN
        FOR user_id IN
            SELECT tnp.user_id
            FROM travel_notification_preferences tnp
            WHERE tnp.enabled = true
            AND tnp.in_app_enabled = true
            AND (tnp.notification_types IS NULL OR (tnp.notification_types->>'travel_alert')::boolean = true)
        LOOP
            PERFORM create_notification(
                user_id,
                'travel_alert',
                p_title,
                p_message,
                p_data
            );
            notification_count := notification_count + 1;
        END LOOP;
    ELSE
        -- Envoyer aux utilisateurs spécifiés
        FOREACH user_id IN ARRAY p_target_users
        LOOP
            IF should_send_notification(user_id, 'travel_alert') THEN
                PERFORM create_notification(
                    user_id,
                    'travel_alert',
                    p_title,
                    p_message,
                    p_data
                );
                notification_count := notification_count + 1;
            END IF;
        END LOOP;
    END IF;

    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FONCTION - Notification système pour maintenance/annonces
-- =====================================================
CREATE OR REPLACE FUNCTION create_system_notification(
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_target_all BOOLEAN DEFAULT true
)
RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    user_id UUID;
BEGIN
    IF p_target_all THEN
        -- Envoyer à tous les utilisateurs actifs
        FOR user_id IN
            SELECT DISTINCT p.id
            FROM profiles p
            WHERE p.user_type IN ('amateur', 'pro')
        LOOP
            PERFORM create_notification(
                user_id,
                'system_maintenance',
                p_title,
                p_message,
                p_data
            );
            notification_count := notification_count + 1;
        END LOOP;
    END IF;

    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. COMMENTAIRES ET DOCUMENTATION
-- =====================================================
COMMENT ON FUNCTION should_send_notification(UUID, TEXT) IS
'Vérifie les préférences utilisateur pour déterminer si une notification doit être envoyée';

COMMENT ON FUNCTION notify_booking_changes() IS
'Trigger function pour notifier les changements de statut des réservations';

COMMENT ON FUNCTION notify_payment_changes() IS
'Trigger function pour notifier les changements de statut des paiements';

COMMENT ON FUNCTION notify_pro_validation_changes() IS
'Trigger function pour notifier les changements de validation professionnelle';

COMMENT ON FUNCTION create_travel_notification(TEXT, TEXT, JSONB, UUID[]) IS
'Fonction pour créer des notifications de voyage/événements à destination ciblée';

COMMENT ON FUNCTION create_system_notification(TEXT, TEXT, JSONB, BOOLEAN) IS
'Fonction pour créer des notifications système (maintenance, annonces)';

-- 8. PERMISSIONS POUR ROLE SERVICE
-- =====================================================
-- Ces fonctions peuvent être appelées par le service role pour les tâches automatisées
GRANT EXECUTE ON FUNCTION create_travel_notification(TEXT, TEXT, JSONB, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION create_system_notification(TEXT, TEXT, JSONB, BOOLEAN) TO service_role;

-- =====================================================
-- FIN DES TRIGGERS DE NOTIFICATIONS
-- =====================================================