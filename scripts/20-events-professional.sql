-- Événements publics : tarification multi-tiers, attentes paiement, liste d'attente, lien caisse.
-- Exécuter après les scripts créant `events` et `event_tickets`.

ALTER TABLE events ADD COLUMN IF NOT EXISTS price_adult DECIMAL(10, 2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_child DECIMAL(10, 2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_vip DECIMAL(10, 2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_group DECIMAL(10, 2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS group_party_size INTEGER DEFAULT 6;
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_hold_minutes INTEGER DEFAULT 20;
ALTER TABLE events ADD COLUMN IF NOT EXISTS waitlist_offer_minutes INTEGER DEFAULT 120;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_online_pay BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_pay_at_venue BOOLEAN DEFAULT true;

COMMENT ON COLUMN events.price_adult IS 'Tarif adulte (EUR). Si NULL, utiliser la colonne legacy price.';
COMMENT ON COLUMN events.group_party_size IS 'Nombre de personnes couvertes par un tarif groupe.';

ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'stripe';
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS vip_seats INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS group_packages INTEGER NOT NULL DEFAULT 0;
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS linked_table_session_id UUID;
ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS event_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_name VARCHAR(200) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(40),
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  offered_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ,
  notification_sent_at TIMESTAMPTZ,
  notification_channel VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event_status ON event_waitlist(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_created ON event_waitlist(event_id, created_at);

CREATE TABLE IF NOT EXISTS event_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  waitlist_id UUID REFERENCES event_waitlist(id) ON DELETE SET NULL,
  channel VARCHAR(30) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
