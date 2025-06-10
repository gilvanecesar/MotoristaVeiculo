-- Add GPS location tracking fields to drivers table
ALTER TABLE drivers 
ADD COLUMN current_latitude DECIMAL(10,7),
ADD COLUMN current_longitude DECIMAL(10,7),
ADD COLUMN last_location_update TIMESTAMP,
ADD COLUMN location_enabled BOOLEAN DEFAULT false;

-- Create driver location history table
CREATE TABLE driver_location_history (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  accuracy DECIMAL(6,2),
  speed DECIMAL(6,2),
  heading DECIMAL(6,2),
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  freight_id INTEGER REFERENCES freights(id)
);

-- Create indexes for better performance
CREATE INDEX idx_driver_location_history_driver_id ON driver_location_history(driver_id);
CREATE INDEX idx_driver_location_history_timestamp ON driver_location_history(timestamp);
CREATE INDEX idx_driver_location_history_freight_id ON driver_location_history(freight_id);
CREATE INDEX idx_drivers_location_enabled ON drivers(location_enabled);