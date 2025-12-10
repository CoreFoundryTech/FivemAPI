-- ============================================
-- CASERIO MARKETPLACE - LISTINGS TABLE (P2P)
-- ============================================
-- Ejecutar este script en tu base de datos FiveM
-- ============================================

CREATE TABLE IF NOT EXISTS caserio_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_citizenid VARCHAR(50) NOT NULL,
    seller_name VARCHAR(100),
    type ENUM('vehicle', 'weapon') NOT NULL,
    item_data JSON NOT NULL,
    price INT NOT NULL,
    status ENUM('ACTIVE', 'SOLD', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP NULL,
    buyer_citizenid VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear índices por separado
CREATE INDEX idx_status ON caserio_listings (status);
CREATE INDEX idx_type ON caserio_listings (type);
CREATE INDEX idx_seller ON caserio_listings (seller_citizenid);
CREATE INDEX idx_created ON caserio_listings (created_at);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT * FROM caserio_listings WHERE status = 'ACTIVE' LIMIT 10;
