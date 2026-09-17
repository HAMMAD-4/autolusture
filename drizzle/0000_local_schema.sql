CREATE TABLE IF NOT EXISTS customers (
  id CHAR(26) PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(16) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  state CHAR(3) NOT NULL,
  postcode CHAR(4) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY customers_email_phone_uq (email, phone),
  KEY customers_phone_idx (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(26) PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','rep') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY users_role_active_idx (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicles (
  id CHAR(26) PRIMARY KEY,
  customer_id CHAR(26) NOT NULL,
  rego VARCHAR(10) NOT NULL,
  state CHAR(3) NOT NULL,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY vehicles_rego_state_uq (rego, state),
  KEY vehicles_customer_idx (customer_id),
  CONSTRAINT vehicles_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS services (
  id CHAR(26) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description_md TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  duration_minutes SMALLINT NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY services_active_order_idx (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id CHAR(26) PRIMARY KEY,
  reference_code VARCHAR(12) NOT NULL UNIQUE,
  customer_id CHAR(26) NOT NULL,
  vehicle_id CHAR(26) NOT NULL,
  service_id CHAR(26) NOT NULL,
  assigned_rep_id CHAR(26) NULL,
  booking_type ENUM('pre_booked','on_arrival') NOT NULL,
  scheduled_at DATETIME(3) NULL,
  UNIQUE KEY bookings_scheduled_slot_uq (scheduled_at),
  status ENUM('pending','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  service_notes TEXT NULL,
  bill_amount DECIMAL(10,2) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY bookings_status_scheduled_idx (status, scheduled_at),
  KEY bookings_customer_idx (customer_id),
  KEY bookings_rep_idx (assigned_rep_id),
  CONSTRAINT bookings_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT bookings_vehicle_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT bookings_service_fk FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_logs (
  id CHAR(26) PRIMARY KEY,
  booking_id CHAR(26) NOT NULL,
  event_name VARCHAR(40) NOT NULL,
  metadata JSON NULL,
  occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY service_logs_booking_idx (booking_id, occurred_at),
  CONSTRAINT service_logs_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id CHAR(26) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT NULL,
  vendor VARCHAR(120) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(26) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(40) NOT NULL UNIQUE,
  on_hand INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unit VARCHAR(40) NOT NULL DEFAULT 'units',
  category VARCHAR(80) NOT NULL DEFAULT 'Supplies',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
