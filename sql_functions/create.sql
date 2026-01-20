-- Create custom widgets table for organizations
-- This table will track custom widget requests from users
-- Table name format: {organization_name}_custom_widgets

-- Example for chick_fil_a organization
CREATE TABLE IF NOT EXISTS chick_fil_a_custom_widgets (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  widget_title VARCHAR(255) NOT NULL,
  widget_description TEXT NOT NULL,
  chart_type VARCHAR(50) NOT NULL,
  data_points TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Optional fields for tracking implementation
  assigned_to VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  widget_config JSONB,
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  CONSTRAINT valid_chart_type CHECK (chart_type IN ('bar', 'pie', 'line', 'scatter', 'heatmap', 'stacked-bar', 'donut', 'other'))
);

-- Create index for faster queries
CREATE INDEX idx_chick_fil_a_custom_widgets_user_email ON chick_fil_a_custom_widgets(user_email);
CREATE INDEX idx_chick_fil_a_custom_widgets_status ON chick_fil_a_custom_widgets(status);
CREATE INDEX idx_chick_fil_a_custom_widgets_created_at ON chick_fil_a_custom_widgets(created_at DESC);

-- Add row level security
ALTER TABLE chick_fil_a_custom_widgets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own requests
CREATE POLICY "Users can view own requests" ON chick_fil_a_custom_widgets
  FOR SELECT
  USING (auth.email() = user_email);

-- Create policy to allow users to insert their own requests
CREATE POLICY "Users can create requests" ON chick_fil_a_custom_widgets
  FOR INSERT
  WITH CHECK (auth.email() = user_email);

-- Create policy to allow admins to view and update all requests
CREATE POLICY "Admins can manage all requests" ON chick_fil_a_custom_widgets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customer_information 
      WHERE organization_email = auth.email() 
      AND is_admin = true
    )
  );

-- Template for creating tables for other organizations
-- Replace 'organization_name' with the actual organization name (e.g., 'chick_fil_a')
/*
CREATE TABLE IF NOT EXISTS organization_name_custom_widgets (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  widget_title VARCHAR(255) NOT NULL,
  widget_description TEXT NOT NULL,
  chart_type VARCHAR(50) NOT NULL,
  data_points TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_to VARCHAR(255),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  widget_config JSONB,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  CONSTRAINT valid_chart_type CHECK (chart_type IN ('bar', 'pie', 'line', 'scatter', 'heatmap', 'stacked-bar', 'donut', 'other'))
);

CREATE INDEX idx_organization_name_custom_widgets_user_email ON organization_name_custom_widgets(user_email);
CREATE INDEX idx_organization_name_custom_widgets_status ON organization_name_custom_widgets(status);
CREATE INDEX idx_organization_name_custom_widgets_created_at ON organization_name_custom_widgets(created_at DESC);

ALTER TABLE organization_name_custom_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON organization_name_custom_widgets
  FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can create requests" ON organization_name_custom_widgets
  FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Admins can manage all requests" ON organization_name_custom_widgets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM customer_information 
      WHERE organization_email = auth.email() 
      AND is_admin = true
    )
  );
*/ 