-- Sample Tasks Data
-- Run this in your Supabase SQL editor

-- Insert sample tasks with different statuses and priorities
INSERT INTO tasks (text, status, priority, starred, created_at, updated_at) VALUES
  -- High priority DOING tasks
  ('Implement user authentication', 'DOING', 1, true, NOW() - INTERVAL '2 days', NOW()),
  ('Fix critical bug in payment flow', 'DOING', 2, true, NOW() - INTERVAL '1 day', NOW()),
  ('Review PR #234 - Database optimization', 'DOING', 3, false, NOW() - INTERVAL '3 hours', NOW()),

  -- PLANNED tasks
  ('Design new dashboard layout', 'PLANNED', 4, true, NOW() - INTERVAL '5 days', NOW()),
  ('Setup CI/CD pipeline', 'PLANNED', 5, false, NOW() - INTERVAL '4 days', NOW()),
  ('Write API documentation', 'PLANNED', 6, false, NOW() - INTERVAL '3 days', NOW()),
  ('Add dark mode support', 'PLANNED', 7, true, NOW() - INTERVAL '2 days', NOW()),

  -- BACKLOG tasks
  ('Refactor authentication service', 'BACKLOG', 10, false, NOW() - INTERVAL '10 days', NOW()),
  ('Add unit tests for user module', 'BACKLOG', 11, false, NOW() - INTERVAL '9 days', NOW()),
  ('Implement email notifications', 'BACKLOG', 12, false, NOW() - INTERVAL '8 days', NOW()),
  ('Setup monitoring and alerts', 'BACKLOG', 13, false, NOW() - INTERVAL '7 days', NOW()),
  ('Optimize database queries', 'BACKLOG', 14, false, NOW() - INTERVAL '6 days', NOW()),
  ('Create user onboarding flow', 'BACKLOG', 15, false, NOW() - INTERVAL '5 days', NOW()),

  -- BLOCKED tasks
  ('Deploy to production', 'BLOCKED', 8, true, NOW() - INTERVAL '1 day', NOW()),
  ('Get design approval from stakeholders', 'BLOCKED', 9, false, NOW() - INTERVAL '2 days', NOW()),
  ('Wait for third-party API access', 'BLOCKED', 16, false, NOW() - INTERVAL '4 days', NOW()),

  -- DONE tasks
  ('Setup project repository', 'DONE', 101, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
  ('Create database schema', 'DONE', 102, false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days'),
  ('Implement basic CRUD operations', 'DONE', 103, false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days'),
  ('Setup development environment', 'DONE', 104, false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),

  -- CANCELLED tasks
  ('Migrate to GraphQL', 'CANCELLED', 201, false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days'),
  ('Implement real-time chat', 'CANCELLED', 202, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days');

-- Query to verify the data
SELECT
  id,
  text,
  status,
  priority,
  starred,
  created_at
FROM tasks
ORDER BY
  CASE status
    WHEN 'DOING' THEN 1
    WHEN 'PLANNED' THEN 2
    WHEN 'BLOCKED' THEN 3
    WHEN 'BACKLOG' THEN 4
    WHEN 'DONE' THEN 5
    WHEN 'CANCELLED' THEN 6
  END,
  priority ASC;

-- Useful queries for your app

-- Get all active tasks by priority
SELECT * FROM tasks
WHERE status IN ('BACKLOG', 'PLANNED', 'DOING', 'BLOCKED')
ORDER BY priority ASC;

-- Get today's tasks (starred, not done)
SELECT * FROM tasks
WHERE starred = true
  AND status NOT IN ('DONE', 'CANCELLED')
ORDER BY priority ASC;

-- Get tasks by status
SELECT * FROM tasks
WHERE status = 'DOING'
ORDER BY priority ASC;

-- Get count by status
SELECT status, COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY
  CASE status
    WHEN 'DOING' THEN 1
    WHEN 'PLANNED' THEN 2
    WHEN 'BLOCKED' THEN 3
    WHEN 'BACKLOG' THEN 4
    WHEN 'DONE' THEN 5
    WHEN 'CANCELLED' THEN 6
  END;
