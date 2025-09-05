# Instructions pour corriger le schéma Supabase

## Étapes à suivre :

1. **Aller sur https://supabase.com/dashboard/project/vrpsulmidpgxmkybgtwn/sql/new**

2. **Coller et exécuter ce SQL :**

```sql
-- Ajouter les colonnes de paiement à la table bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Ajouter les index pour les performances
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Créer la table payment_logs si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'eur',
    metadata JSONB,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les index sur payment_logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_intent_id ON payment_logs(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_processed_at ON payment_logs(processed_at);

-- Activer RLS sur payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour payment_logs (lecture/écriture par service role seulement)
DROP POLICY IF EXISTS "Service role can manage payment logs" ON payment_logs;
CREATE POLICY "Service role can manage payment logs"
ON payment_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

3. **Vérifier que tout s'est bien passé en exécutant :**

```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('payment_intent_id', 'payment_status');

-- Vérifier que la table payment_logs existe
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'payment_logs' AND table_schema = 'public';
```

Une fois exécuté, la fonctionnalité Stripe sera complètement opérationnelle !