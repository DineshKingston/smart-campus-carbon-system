-- ============================================================
-- Smart Campus Carbon Tracker — Database Initialization
-- ============================================================

CREATE DATABASE IF NOT EXISTS carbon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carbon_db;

-- ── 1. Emission Categories ────────────────────────────────────
CREATE TABLE IF NOT EXISTS emission_categories (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(50)  NOT NULL,
    unit            VARCHAR(20)  NOT NULL,
    emission_factor DOUBLE       NOT NULL COMMENT 'kg CO2 per unit',
    description     VARCHAR(200)
);

-- ── 2. Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    username   VARCHAR(50)  UNIQUE NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL COMMENT 'BCrypt hash',
    role       ENUM('ADMIN','STUDENT') DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. Emission Records ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS emission_records (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT    NOT NULL,
    month       VARCHAR(7) NOT NULL COMMENT 'YYYY-MM format',
    value       DOUBLE NOT NULL,
    unit        VARCHAR(20) NOT NULL,
    co2_kg      DOUBLE NOT NULL COMMENT 'Calculated at insert time',
    recorded_by INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES emission_categories(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- ── 4. Predictions ────────────────────────────────────────────
-- Stores every ML prediction for historical comparison & Grafana trend
CREATE TABLE IF NOT EXISTS predictions (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    month         VARCHAR(7)   NOT NULL,
    predicted_co2 DOUBLE       NOT NULL,
    model_used    VARCHAR(50)  NOT NULL COMMENT 'e.g. random_forest_v1',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════
-- Grafana read-only user (security: no write access)
-- ═══════════════════════════════════════════════════════════════
CREATE USER IF NOT EXISTS 'grafana_user'@'%' IDENTIFIED BY 'GrafanaPass@2024';
GRANT SELECT ON carbon_db.* TO 'grafana_user'@'%';
FLUSH PRIVILEGES;

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Categories + emission factors (IPCC standard values)
INSERT INTO emission_categories (name, unit, emission_factor, description) VALUES
('Electricity', 'kWh',   0.82, 'Grid electricity consumption — 0.82 kg CO2 per kWh'),
('Diesel',      'Litre', 2.68, 'Diesel fuel usage — 2.68 kg CO2 per litre'),
('Transport',   'km',    0.21, 'Vehicle distance — 0.21 kg CO2 per km'),
('Waste',       'kg',    0.50, 'Solid waste disposed — 0.50 kg CO2 per kg');

-- Default admin user (password = Admin@123)
-- BCrypt hash generated with strength 10
INSERT IGNORE INTO users (username, email, password, role) VALUES
('admin', 'admin@campus.edu',
 '$2b$10$tlc.WeOudPbXBn28n8xCYO77YPVV1Nx8BUFYIb3l7P2gNKQ4pAhbfC',
 'ADMIN');

-- ──────────────────────────────────────────────────────────────
-- Historical emission records (24 months of realistic campus data)
-- ──────────────────────────────────────────────────────────────
INSERT INTO emission_records (category_id, month, value, unit, co2_kg, recorded_by) VALUES
-- Electricity (kWh × 0.82)
(1,'2024-01',14200,'kWh',11644.00,1),(1,'2024-02',13800,'kWh',11316.00,1),
(1,'2024-03',12500,'kWh',10250.00,1),(1,'2024-04',11900,'kWh', 9758.00,1),
(1,'2024-05',12100,'kWh', 9922.00,1),(1,'2024-06',15300,'kWh',12546.00,1),
(1,'2024-07',16800,'kWh',13776.00,1),(1,'2024-08',16500,'kWh',13530.00,1),
(1,'2024-09',14000,'kWh',11480.00,1),(1,'2024-10',13200,'kWh',10824.00,1),
(1,'2024-11',13500,'kWh',11070.00,1),(1,'2024-12',14800,'kWh',12136.00,1),
(1,'2025-01',14500,'kWh',11890.00,1),(1,'2025-02',14100,'kWh',11562.00,1),
(1,'2025-03',12800,'kWh',10496.00,1),(1,'2025-04',12200,'kWh', 9964.00,1),
(1,'2025-05',12400,'kWh',10168.00,1),(1,'2025-06',15600,'kWh',12792.00,1),
(1,'2025-07',17100,'kWh',14022.00,1),(1,'2025-08',16800,'kWh',13776.00,1),
(1,'2025-09',14300,'kWh',11726.00,1),(1,'2025-10',13500,'kWh',11070.00,1),
(1,'2025-11',13800,'kWh',11316.00,1),(1,'2025-12',15000,'kWh',12300.00,1),
-- Diesel (Litre × 2.68)
(2,'2024-01',320,'Litre', 857.60,1),(2,'2024-02',290,'Litre', 777.20,1),
(2,'2024-03',310,'Litre', 830.80,1),(2,'2024-04',280,'Litre', 750.40,1),
(2,'2024-05',300,'Litre', 804.00,1),(2,'2024-06',340,'Litre', 911.20,1),
(2,'2024-07',360,'Litre', 964.80,1),(2,'2024-08',350,'Litre', 938.00,1),
(2,'2024-09',320,'Litre', 857.60,1),(2,'2024-10',305,'Litre', 817.40,1),
(2,'2024-11',315,'Litre', 844.20,1),(2,'2024-12',335,'Litre', 897.80,1),
(2,'2025-01',325,'Litre', 871.00,1),(2,'2025-02',295,'Litre', 790.60,1),
(2,'2025-03',315,'Litre', 844.20,1),(2,'2025-04',285,'Litre', 763.80,1),
(2,'2025-05',305,'Litre', 817.40,1),(2,'2025-06',345,'Litre', 924.60,1),
(2,'2025-07',365,'Litre', 978.20,1),(2,'2025-08',355,'Litre', 951.40,1),
(2,'2025-09',325,'Litre', 871.00,1),(2,'2025-10',310,'Litre', 830.80,1),
(2,'2025-11',320,'Litre', 857.60,1),(2,'2025-12',340,'Litre', 911.20,1),
-- Transport (km × 0.21)
(3,'2024-01',8500,'km',1785.00,1),(3,'2024-02',7900,'km',1659.00,1),
(3,'2024-03',8200,'km',1722.00,1),(3,'2024-04',7600,'km',1596.00,1),
(3,'2024-05',8000,'km',1680.00,1),(3,'2024-06',9100,'km',1911.00,1),
(3,'2024-07',9800,'km',2058.00,1),(3,'2024-08',9600,'km',2016.00,1),
(3,'2024-09',8700,'km',1827.00,1),(3,'2024-10',8100,'km',1701.00,1),
(3,'2024-11',8300,'km',1743.00,1),(3,'2024-12',8900,'km',1869.00,1),
(3,'2025-01',8700,'km',1827.00,1),(3,'2025-02',8100,'km',1701.00,1),
(3,'2025-03',8400,'km',1764.00,1),(3,'2025-04',7800,'km',1638.00,1),
(3,'2025-05',8200,'km',1722.00,1),(3,'2025-06',9300,'km',1953.00,1),
(3,'2025-07',10000,'km',2100.00,1),(3,'2025-08',9800,'km',2058.00,1),
(3,'2025-09',8900,'km',1869.00,1),(3,'2025-10',8300,'km',1743.00,1),
(3,'2025-11',8500,'km',1785.00,1),(3,'2025-12',9100,'km',1911.00,1),
-- Waste (kg × 0.50)
(4,'2024-01',1100,'kg',550.00,1),(4,'2024-02',980,'kg',490.00,1),
(4,'2024-03',1020,'kg',510.00,1),(4,'2024-04',950,'kg',475.00,1),
(4,'2024-05',1000,'kg',500.00,1),(4,'2024-06',1150,'kg',575.00,1),
(4,'2024-07',1200,'kg',600.00,1),(4,'2024-08',1180,'kg',590.00,1),
(4,'2024-09',1050,'kg',525.00,1),(4,'2024-10',1010,'kg',505.00,1),
(4,'2024-11',1030,'kg',515.00,1),(4,'2024-12',1100,'kg',550.00,1),
(4,'2025-01',1120,'kg',560.00,1),(4,'2025-02',1000,'kg',500.00,1),
(4,'2025-03',1040,'kg',520.00,1),(4,'2025-04',970,'kg',485.00,1),
(4,'2025-05',1020,'kg',510.00,1),(4,'2025-06',1170,'kg',585.00,1),
(4,'2025-07',1220,'kg',610.00,1),(4,'2025-08',1200,'kg',600.00,1),
(4,'2025-09',1070,'kg',535.00,1),(4,'2025-10',1030,'kg',515.00,1),
(4,'2025-11',1050,'kg',525.00,1),(4,'2025-12',1120,'kg',560.00,1);
