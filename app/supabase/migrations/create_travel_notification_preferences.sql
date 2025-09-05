-- Migration: Créer la table travel_notification_preferences
-- Cette table stocke les préférences de notification voyage des utilisateurs

CREATE TABLE IF NOT EXISTS public.travel_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte d'unicité : un utilisateur ne peut avoir qu'une seule préférence
    UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_travel_notification_preferences_user_id 
    ON public.travel_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_travel_notification_preferences_enabled 
    ON public.travel_notification_preferences(enabled) 
    WHERE enabled = true;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_travel_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_travel_notification_preferences_updated_at
    BEFORE UPDATE ON public.travel_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_travel_notification_preferences_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.travel_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs ne peuvent voir/modifier que leurs propres préférences
CREATE POLICY "Users can view their own travel notification preferences" 
    ON public.travel_notification_preferences 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel notification preferences" 
    ON public.travel_notification_preferences 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel notification preferences" 
    ON public.travel_notification_preferences 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel notification preferences" 
    ON public.travel_notification_preferences 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE public.travel_notification_preferences IS 
'Stocke les préférences de notification voyage des utilisateurs Eagle';

COMMENT ON COLUMN public.travel_notification_preferences.user_id IS 
'Référence vers l''utilisateur authentifié';

COMMENT ON COLUMN public.travel_notification_preferences.enabled IS 
'Indique si l''utilisateur souhaite recevoir les notifications de nouveaux voyages';

COMMENT ON COLUMN public.travel_notification_preferences.created_at IS 
'Date de création de la préférence';

COMMENT ON COLUMN public.travel_notification_preferences.updated_at IS 
'Date de dernière mise à jour de la préférence';