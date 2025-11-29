-- V1__Create_tickets_tables.sql
-- Migration initiale pour le service de tickets

-- Table des tickets
CREATE TABLE tickets (
                         id UUID PRIMARY KEY,
                         user_id UUID NOT NULL,
                         trajet_id BIGINT NOT NULL,
                         quantity INTEGER NOT NULL DEFAULT 1,
                         status VARCHAR(20) NOT NULL,
                         price_amount INTEGER NOT NULL,
                         price_currency VARCHAR(3) NOT NULL DEFAULT 'MAD',
                         paid_at TIMESTAMP,
                         expires_at TIMESTAMP,
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT chk_quantity CHECK (quantity > 0 AND quantity <= 10),   
                         CONSTRAINT chk_status CHECK (status IN ('RESERVED', 'PAID', 'USED', 'CANCELLED', 'EXPIRED')),
                         CONSTRAINT chk_price CHECK (price_amount >= 0)
);

-- Index pour recherches fréquentes
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_trajet_id ON tickets(trajet_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_expires_at ON tickets(expires_at) WHERE status = 'RESERVED';

-- Table des paiements
CREATE TABLE payments (
                          id UUID PRIMARY KEY,
                          ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
                          payment_method VARCHAR(20) NOT NULL,
                          provider VARCHAR(50) NOT NULL DEFAULT 'MOCK',
                          status VARCHAR(20) NOT NULL,
                          transaction_id VARCHAR(255),
                          amount INTEGER NOT NULL,
                          currency VARCHAR(3) NOT NULL DEFAULT 'MAD',
                          error_code VARCHAR(100),
                          error_message TEXT,
                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT chk_payment_method CHECK (payment_method IN ('CARD', 'CASH', 'MOBILE')),
                          CONSTRAINT chk_payment_status CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'))
);

-- Index pour paiements
CREATE INDEX idx_payments_ticket_id ON payments(ticket_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- Table d'idempotence
CREATE TABLE idempotency_records (
                                     idempotency_key UUID PRIMARY KEY,
                                     request_path VARCHAR(255) NOT NULL,
                                     request_method VARCHAR(10) NOT NULL,
                                     response_status INTEGER NOT NULL,
                                     response_body TEXT NOT NULL,
                                     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                     expires_at TIMESTAMP NOT NULL
);

-- Index pour nettoyage automatique
CREATE INDEX idx_idempotency_expires_at ON idempotency_records(expires_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE tickets IS 'Table principale des tickets de transport';
COMMENT ON TABLE payments IS 'Table des paiements associés aux tickets';
COMMENT ON TABLE idempotency_records IS 'Cache des requêtes idempotentes pour éviter les doublons';

COMMENT ON COLUMN tickets.status IS 'Statut du ticket: RESERVED (réservé), PAID (payé), CANCELLED (annulé), EXPIRED (expiré)';
COMMENT ON COLUMN tickets.expires_at IS 'Date d''expiration de la réservation (30 minutes par défaut)';
COMMENT ON COLUMN payments.provider IS 'Provider de paiement (MOCK pour tests, STRIPE/PAYPAL en prod)';