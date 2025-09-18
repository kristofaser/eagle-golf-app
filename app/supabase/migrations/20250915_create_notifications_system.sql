-- =====================================================
-- MIGRATION: Système de Notifications Eagle
-- Date: 2025-09-15
-- Description: Création de l'infrastructure complète de notifications
-- =====================================================

-- 1. TABLE NOTIFICATIONS - Stockage de l'historique des notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'booking_confirmed', 'booking_cancelled', 'booking_modified',
        'payment_received', 'payment_failed', 'payment_refunded',
        'pro_approved', 'pro_rejected', 'pro_document_required',
        'travel_alert', 'system_maintenance', 'custom'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE PUSH_TOKENS - Gestion des tokens pour push notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EXTENSION DE TRAVEL_NOTIFICATION_PREFERENCES
-- =====================================================
-- Ajouter les nouvelles colonnes aux préférences existantes
ALTER TABLE public.travel_notification_preferences
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS in_app_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME,
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME,
ADD COLUMN IF NOT EXISTS notification_types JSONB DEFAULT '{
    "booking": true,
    "payment": true,
    "pro_status": true,
    "travel_alert": true,
    "system": false
}'::jsonb;

-- 4. INDEXES POUR OPTIMISATION DES PERFORMANCES
-- =====================================================

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications(user_id, read_at)
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type_created
    ON public.notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON public.notifications(created_at DESC);

-- Index pour push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
    ON public.push_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_active
    ON public.push_tokens(user_id, is_active)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_tokens_platform
    ON public.push_tokens(platform, is_active);

-- 5. TRIGGERS POUR UPDATED_AT
-- =====================================================

-- Trigger pour notifications
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Trigger pour push_tokens
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_push_tokens_updated_at();

-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins peuvent gérer toutes les notifications
CREATE POLICY "Admins can manage all notifications"
    ON public.notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND user_type = 'admin'
        )
    );

-- Les services peuvent créer des notifications
CREATE POLICY "Service role can create notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- RLS pour push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
    ON public.push_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own push tokens"
    ON public.push_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins peuvent voir tous les tokens (pour debug)
CREATE POLICY "Admins can view all push tokens"
    ON public.push_tokens
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND user_type = 'admin'
        )
    );

-- 7. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer comme lue
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET read_at = timezone('utc'::text, now())
    WHERE id = p_notification_id
    AND user_id = p_user_id
    AND read_at IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE user_id = p_user_id
        AND read_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.notifications IS
'Stockage de l''historique des notifications utilisateurs Eagle';

COMMENT ON COLUMN public.notifications.type IS
'Type de notification: booking_*, payment_*, pro_*, travel_alert, system_*, custom';

COMMENT ON COLUMN public.notifications.data IS
'Données additionnelles JSON pour deep linking et contexte';

COMMENT ON TABLE public.push_tokens IS
'Stockage des tokens pour push notifications (iOS, Android, Web)';

COMMENT ON COLUMN public.push_tokens.device_info IS
'Informations sur le device: model, OS version, app version, etc.';

-- 9. DONNÉES DE TEST (OPTIONNEL - SEULEMENT EN DEV)
-- =====================================================
-- Décommentez pour ajouter des données de test
/*
-- Test notification pour développement
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Prendre le premier utilisateur pour test
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        PERFORM create_notification(
            test_user_id,
            'system',
            'Système de notifications activé',
            'Le nouveau système de notifications Eagle est maintenant opérationnel !',
            '{"version": "1.0", "priority": "info"}'::jsonb
        );
    END IF;
END $$;
*/

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================