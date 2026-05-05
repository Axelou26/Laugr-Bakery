-- À exécuter une fois sur PostgreSQL (Neon / Render / local) si l’erreur indique :
-- column o1_0.promo_redemption_recorded does not exist
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_redemption_recorded boolean NOT NULL DEFAULT false;
