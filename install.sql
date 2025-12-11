-- =========================================================================================
-- CASERIO MARKETPLACE & SHOP - OFFICIAL INSTALLATION SCRIPT
-- =========================================================================================

-- 1. P2P MARKETPLACE LISTINGS
CREATE TABLE IF NOT EXISTS `caserio_listings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `seller_citizenid` VARCHAR(50) NOT NULL,
    `seller_name` VARCHAR(100),
    `type` ENUM('vehicle', 'weapon') NOT NULL,
    `item_data` JSON NOT NULL,
    `price` INT NOT NULL,
    `status` ENUM('ACTIVE', 'SOLD', 'CANCELLED') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `sold_at` TIMESTAMP NULL,
    `buyer_citizenid` VARCHAR(50) NULL,
    INDEX `idx_status` (`status`),
    INDEX `idx_type` (`type`),
    INDEX `idx_seller` (`seller_citizenid`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. OFFICIAL SHOP ITEMS (Dynamic Shop)
CREATE TABLE IF NOT EXISTS `shop_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `item_id` VARCHAR(50) NOT NULL,
    `type` ENUM('vehicle', 'weapon') NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `price` INT NOT NULL,
    `model` VARCHAR(50) NOT NULL,
    `category` VARCHAR(50) DEFAULT 'general',
    `item_data` JSON DEFAULT NULL,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `stock` INT DEFAULT -1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. DEFAULT DATA INSERTION (Safe & Idempotent)

INSERT INTO `shop_items` (`item_id`, `type`, `label`, `price`, `model`, `category`, `item_data`)
SELECT 'adder', 'vehicle', 'Adder', 1000000, 'adder', 'supercar', NULL
WHERE NOT EXISTS (SELECT 1 FROM `shop_items` WHERE `item_id` = 'adder');

INSERT INTO `shop_items` (`item_id`, `type`, `label`, `price`, `model`, `category`, `item_data`)
SELECT 'zentorno', 'vehicle', 'Zentorno', 725000, 'zentorno', 'supercar', NULL
WHERE NOT EXISTS (SELECT 1 FROM `shop_items` WHERE `item_id` = 'zentorno');

INSERT INTO `shop_items` (`item_id`, `type`, `label`, `price`, `model`, `category`, `item_data`)
SELECT 'insurgent', 'vehicle', 'Insurgent', 1500000, 'insurgent', 'military', NULL
WHERE NOT EXISTS (SELECT 1 FROM `shop_items` WHERE `item_id` = 'insurgent');

INSERT INTO `shop_items` (`item_id`, `type`, `label`, `price`, `model`, `category`, `item_data`)
SELECT 'pistol', 'weapon', 'Pistola', 500, 'weapon_pistol', 'pistols', NULL
WHERE NOT EXISTS (SELECT 1 FROM `shop_items` WHERE `item_id` = 'pistol');

INSERT INTO `shop_items` (`item_id`, `type`, `label`, `price`, `model`, `category`, `item_data`)
SELECT 'smg', 'weapon', 'SMG', 1500, 'weapon_smg', 'smgs', NULL
WHERE NOT EXISTS (SELECT 1 FROM `shop_items` WHERE `item_id` = 'smg');

INSERT INTO `shop_items` (`item_id`, `type`, `label`, `price`, `model`, `category`, `item_data`)
SELECT 'pistol_gold', 'weapon', 'Pistola Dorada', 5000, 'weapon_pistol', 'pistols', '{"tint": 5}'
WHERE NOT EXISTS (SELECT 1 FROM `shop_items` WHERE `item_id` = 'pistol_gold');

-- 4. PLAYER COINS SUPPORT (JSON UPDATE)
-- Esto inyecta "coins": 0 en la columna JSON 'money' de los jugadores si no existe.
-- Requiere MySQL 5.7+ o MariaDB 10.2+

UPDATE `players` 
SET `money` = JSON_SET(`money`, '$.coins', 0) 
WHERE JSON_EXTRACT(`money`, '$.coins') IS NULL;
