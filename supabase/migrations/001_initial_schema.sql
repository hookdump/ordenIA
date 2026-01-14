-- CleanHome AI Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('owner', 'member');
CREATE TYPE plan_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped', 'rescheduled');
CREATE TYPE task_category AS ENUM ('order', 'dust', 'surfaces', 'floor', 'trash', 'laundry', 'kitchen', 'bathroom', 'general');
CREATE TYPE detail_level AS ENUM ('brief', 'normal', 'detailed');
CREATE TYPE cleaning_standard AS ENUM ('quick', 'deep');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'incomplete');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status,
  stripe_customer_id TEXT UNIQUE,
  trial_ends_at TIMESTAMPTZ,
  scans_this_month INTEGER DEFAULT 0,
  last_scan_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homes table
CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Home members (for multi-user support)
CREATE TABLE home_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member',
  invited_email TEXT,
  invite_token TEXT UNIQUE,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(home_id, user_id)
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  size_hint TEXT,
  sensitivity_tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room zones (optional sub-areas)
CREATE TABLE room_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences per home
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  detail_level detail_level DEFAULT 'normal',
  cleaning_standard cleaning_standard DEFAULT 'quick',
  restrictions TEXT[] DEFAULT '{}',
  minutes_per_day INTEGER DEFAULT 30,
  days_per_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, home_id)
);

-- Scans (photo analysis records)
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  thumbnail_url TEXT,
  ai_model TEXT DEFAULT 'gpt-4-vision',
  ai_raw_json JSONB DEFAULT '{}',
  score_before INTEGER CHECK (score_before >= 0 AND score_before <= 100),
  score_after INTEGER CHECK (score_after >= 0 AND score_after <= 100),
  keep_image BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleaning plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Plan de limpieza',
  status plan_status DEFAULT 'draft',
  is_template BOOLEAN DEFAULT false,
  total_estimated_minutes INTEGER DEFAULT 0,
  total_actual_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks within plans
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description_steps TEXT[] DEFAULT '{}',
  category task_category DEFAULT 'general',
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  estimated_minutes INTEGER DEFAULT 5,
  actual_minutes INTEGER,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  supplies TEXT[] DEFAULT '{}',
  safety_notes TEXT[] DEFAULT '{}',
  status task_status DEFAULT 'pending',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task events for history tracking
CREATE TABLE task_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring task rules
CREATE TABLE recurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  task_template JSONB NOT NULL,
  rule TEXT NOT NULL, -- e.g., 'every 7 days', 'weekly on monday'
  next_due_at TIMESTAMPTZ NOT NULL,
  last_triggered_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badge definitions
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Notification preferences
CREATE TABLE notification_prefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  daily_reminder BOOLEAN DEFAULT true,
  daily_reminder_time TIME DEFAULT '09:00',
  due_reminders BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Web push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User statistics
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  home_id UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  total_tasks_completed INTEGER DEFAULT 0,
  total_minutes_cleaned INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, home_id)
);

-- Task feedback for learning
CREATE TABLE task_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  category task_category NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('skip_always', 'adjust_time', 'lower_priority')),
  adjustment_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_home_members_home ON home_members(home_id);
CREATE INDEX idx_home_members_user ON home_members(user_id);
CREATE INDEX idx_rooms_home ON rooms(home_id);
CREATE INDEX idx_scans_room ON scans(room_id);
CREATE INDEX idx_scans_user ON scans(user_id);
CREATE INDEX idx_plans_home ON plans(home_id);
CREATE INDEX idx_plans_user ON plans(user_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_tasks_plan ON tasks(plan_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_recurrences_next_due ON recurrences(next_due_at) WHERE is_active = true;
CREATE INDEX idx_task_feedback_user ON task_feedback(user_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can read/update own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Homes: members can view, owners can modify
CREATE POLICY "Home members can view homes" ON homes FOR SELECT USING (
  id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can insert homes" ON homes FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update homes" ON homes FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete homes" ON homes FOR DELETE USING (owner_id = auth.uid());

-- Home members: visible to all members of the home
CREATE POLICY "Members can view home members" ON home_members FOR SELECT USING (
  home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can manage members" ON home_members FOR ALL USING (
  home_id IN (SELECT id FROM homes WHERE owner_id = auth.uid())
);

-- Rooms: members can view, owners can modify
CREATE POLICY "Members can view rooms" ON rooms FOR SELECT USING (
  home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can manage rooms" ON rooms FOR ALL USING (
  home_id IN (SELECT id FROM homes WHERE owner_id = auth.uid())
);

-- Room zones
CREATE POLICY "Members can view room zones" ON room_zones FOR SELECT USING (
  room_id IN (SELECT id FROM rooms WHERE home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Owners can manage room zones" ON room_zones FOR ALL USING (
  room_id IN (SELECT id FROM rooms WHERE home_id IN (SELECT id FROM homes WHERE owner_id = auth.uid()))
);

-- User preferences
CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL USING (user_id = auth.uid());

-- Scans
CREATE POLICY "Members can view scans" ON scans FOR SELECT USING (
  room_id IN (SELECT id FROM rooms WHERE home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can create scans" ON scans FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own scans" ON scans FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own scans" ON scans FOR DELETE USING (user_id = auth.uid());

-- Plans
CREATE POLICY "Members can view plans" ON plans FOR SELECT USING (
  home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can create plans" ON plans FOR INSERT WITH CHECK (
  home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Members can update plans" ON plans FOR UPDATE USING (
  home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can delete plans" ON plans FOR DELETE USING (user_id = auth.uid());

-- Tasks
CREATE POLICY "Members can view tasks" ON tasks FOR SELECT USING (
  plan_id IN (SELECT id FROM plans WHERE home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Members can manage tasks" ON tasks FOR ALL USING (
  plan_id IN (SELECT id FROM plans WHERE home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid()))
);

-- Task events
CREATE POLICY "Members can view task events" ON task_events FOR SELECT USING (
  task_id IN (SELECT id FROM tasks WHERE plan_id IN (SELECT id FROM plans WHERE home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())))
);
CREATE POLICY "Users can create task events" ON task_events FOR INSERT WITH CHECK (user_id = auth.uid());

-- Recurrences
CREATE POLICY "Members can view recurrences" ON recurrences FOR SELECT USING (
  home_id IN (SELECT home_id FROM home_members WHERE user_id = auth.uid())
);
CREATE POLICY "Owners can manage recurrences" ON recurrences FOR ALL USING (
  home_id IN (SELECT id FROM homes WHERE owner_id = auth.uid())
);

-- User badges
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert badges" ON user_badges FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notification prefs
CREATE POLICY "Users manage own notification prefs" ON notification_prefs FOR ALL USING (user_id = auth.uid());

-- Push subscriptions
CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- User stats
CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage stats" ON user_stats FOR ALL USING (user_id = auth.uid());

-- Task feedback
CREATE POLICY "Users manage own feedback" ON task_feedback FOR ALL USING (user_id = auth.uid());

-- Badges table is public read
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT TO authenticated USING (true);

-- Functions

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_homes_updated_at BEFORE UPDATE ON homes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_recurrences_updated_at BEFORE UPDATE ON recurrences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notification_prefs_updated_at BEFORE UPDATE ON notification_prefs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default badges
INSERT INTO badges (id, name, description, icon, category, requirement_type, requirement_value) VALUES
  ('streak_3', 'En racha', '3 días seguidos limpiando', 'Flame', 'streak', 'streak', 3),
  ('streak_7', 'Semana impecable', '7 días seguidos limpiando', 'Flame', 'streak', 'streak', 7),
  ('streak_30', 'Mes dedicado', '30 días seguidos limpiando', 'Flame', 'streak', 'streak', 30),
  ('tasks_10', 'Primeros pasos', '10 tareas completadas', 'CheckCircle', 'tasks', 'total_tasks', 10),
  ('tasks_50', 'Limpiador dedicado', '50 tareas completadas', 'CheckCircle', 'tasks', 'total_tasks', 50),
  ('tasks_100', 'Maestro del hogar', '100 tareas completadas', 'Trophy', 'tasks', 'total_tasks', 100),
  ('tasks_500', 'Leyenda', '500 tareas completadas', 'Crown', 'tasks', 'total_tasks', 500),
  ('time_60', 'Primera hora', '60 minutos de limpieza', 'Clock', 'time', 'total_minutes', 60),
  ('time_300', 'Medio día de trabajo', '5 horas de limpieza', 'Clock', 'time', 'total_minutes', 300),
  ('time_600', 'Día completo', '10 horas de limpieza', 'Timer', 'time', 'total_minutes', 600),
  ('kitchen_master', 'Chef limpio', 'Cocina limpia 10 veces', 'ChefHat', 'room', 'room_kitchen', 10),
  ('bathroom_master', 'Baño reluciente', 'Baño limpio 10 veces', 'Bath', 'room', 'room_bathroom', 10),
  ('bedroom_master', 'Dulces sueños', 'Dormitorio limpio 10 veces', 'Bed', 'room', 'room_bedroom', 10),
  ('quick_wins_10', 'Victorias rápidas', '10 tareas rápidas completadas', 'Zap', 'quick', 'quick_wins', 10),
  ('quick_wins_50', 'Eficiencia máxima', '50 tareas rápidas completadas', 'Zap', 'quick', 'quick_wins', 50),
  ('plans_5', 'Planificador', '5 planes completados', 'ClipboardCheck', 'plans', 'completed_plans', 5),
  ('plans_20', 'Estratega', '20 planes completados', 'Target', 'plans', 'completed_plans', 20);

-- Storage bucket for images
-- Run this in Supabase Dashboard > Storage > New bucket
-- Name: room-scans
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
