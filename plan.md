# CleanHome AI - Plan de implementación

## Overview
PWA de asistente inteligente de limpieza del hogar con análisis de fotos por IA, tracking de tareas, y gamificación.

## Complexity Assessment
- [x] Needs backend (Supabase) - Multi-user, image storage, persistent data
- [x] AI integration (OpenAI Vision)
- [x] Payments (Stripe)

## Features (MVP)
- [x] Foto → Plan de limpieza con IA
- [x] Tareas con pasos, tiempos, dificultad
- [x] Habitaciones customizables
- [x] Modo ejecución (una tarea a la vez)
- [x] Progreso con charts (Recharts)
- [x] Insignias y rachas
- [x] Multi-usuario (invitaciones)
- [x] Recordatorios (Web Push)
- [x] Suscripciones (Stripe)
- [x] PWA instalable

## Data Model
- users, homes, home_members
- rooms, room_zones
- user_preferences
- scans, plans, tasks
- task_events, recurrences
- badges, user_badges
- notification_prefs, push_subscriptions
- user_stats, task_feedback

## Pages/Routes
- `/` - Landing page
- `/login`, `/signup` - Auth
- `/onboarding` - Setup wizard
- `/dashboard` - Home del usuario
- `/scan` - Nueva evaluación
- `/tasks` - Lista y ejecución
- `/progress` - Stats y badges
- `/rooms` - Administrar habitaciones
- `/members` - Miembros del hogar
- `/settings` - Configuración y billing
- `/invite/[token]` - Aceptar invitación

## Implementation Order
1. ✅ Project setup (Next.js, Tailwind, Supabase)
2. ✅ Database schema
3. ✅ Authentication
4. ✅ Onboarding wizard
5. ✅ Dashboard
6. ✅ Camera/upload + AI analysis
7. ✅ Task management
8. ✅ Progress tracking
9. ✅ Multi-user
10. ✅ Stripe billing
11. ✅ PWA + Push notifications
12. ⏳ Testing
13. ⏳ Deployment

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID
- NEXT_PUBLIC_VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- NEXT_PUBLIC_APP_URL
