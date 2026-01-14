# CleanHome AI

## Type
PWA App (Productivity / Home Management)

## One-Liner
AI-powered cleaning assistant that analyzes room photos and generates personalized cleaning plans with task tracking, progress charts, and smart reminders.

## Problem
Keeping a home consistently clean is overwhelming. People don't know where to start, underestimate time needed, lose motivation mid-task, and struggle to maintain habits. Traditional cleaning apps are just todo lists without intelligence.

## Solution
A PWA that uses AI vision to analyze photos of rooms, automatically identifies areas needing attention, generates prioritized task lists with time estimates, and gamifies the cleaning process with progress tracking, badges, and smart reminders.

## Core Features (MVP)
1. **Photo → Plan**: Snap/upload a photo, AI analyzes and generates cleaning tasks
2. **Smart Task Lists**: Tasks with titles, step-by-step instructions, time estimates, difficulty, and priority
3. **Room Management**: Customizable rooms with types, sizes, and sensitivity tags
4. **Execution Mode**: Focus view showing one task at a time with done/skip/reschedule
5. **Progress Charts**: Visual tracking by day/week with Recharts
6. **Achievement Badges**: Gamification for streaks, completions, room-specific milestones
7. **Multi-User**: Invite household members, assign tasks, see who did what
8. **Smart Reminders**: Web Push notifications based on habits and schedules
9. **Templates**: Save AI-generated plans as reusable templates

## Storage Needs
Supabase (Postgres + Auth + Storage) - Required for:
- User accounts and authentication
- Multi-user/household support
- Image storage for room photos
- Persistent task history and analytics
- Subscription management

## Target Users
- Busy professionals who want structured cleaning routines
- Households with multiple members sharing cleaning duties
- People with ADHD or executive function challenges who benefit from step-by-step guidance
- Anyone overwhelmed by cleaning who needs AI-powered assistance

## Technical Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **PWA**: Web manifest + Service Worker for installability
- **Camera**: getUserMedia API + file upload fallback
- **Charts**: Recharts for progress visualization
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **AI**: OpenAI GPT-4 Vision or Claude for image analysis
- **Payments**: Stripe for subscriptions
- **Notifications**: Web Push (VAPID)

## Data Model
- users, homes, home_members (roles)
- rooms (name, type, size_hint, sensitivity_tags)
- scans (room_id, image_url, ai_raw_json, score)
- plans (scan_id, status, estimated/actual minutes)
- tasks (plan_id, title, category, priority, estimated_minutes, difficulty, status)
- badges, user_badges, recurrences, notification_prefs

## Monetization
- **Free tier**: 5 scans/month, basic tracking, 1 home
- **Premium ($9.99/mo)**: Unlimited scans, advanced analytics, multi-user, templates
- 7-day free trial

## Privacy Features
- Clear disclosure when photos are uploaded
- Option to delete photos/scans completely
- Configurable retention (30 days default)
- "Don't save image" option (keeps only tasks)

## Notes
- Mobile-first design (primary use case is phone camera)
- Offline support for viewing tasks (PWA cache)
- AI must return structured JSON, not vague advice
- Quick wins always suggested (2-5 min tasks) to reduce friction
- Calibration: learn from user's actual task completion times
