-- Create payment logs table for tracking Stripe payments
CREATE TABLE payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL, -- amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'eur',
    metadata JSONB,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_payment_logs_payment_intent_id ON payment_logs(payment_intent_id);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_processed_at ON payment_logs(processed_at);

-- Add RLS policy (logs are only readable by service role)
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write payment logs for security
CREATE POLICY "Service role can manage payment logs"
ON payment_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add columns to bookings table for payment tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

-- Add indexes on booking payment fields
CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id ON bookings(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);