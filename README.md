# CleanHome AI

PWA de asistente inteligente de limpieza del hogar. Saca una foto de cualquier habitación y obtén un plan de limpieza personalizado con tareas detalladas, tiempos estimados y seguimiento de progreso.

## Features

- **Análisis de fotos con IA**: Sube una foto y la IA identifica áreas que necesitan atención
- **Planes de limpieza personalizados**: Tareas con pasos detallados, tiempos estimados y prioridades
- **Habitaciones customizables**: Define tus espacios con características especiales
- **Modo ejecución**: Completa tareas una por una con tracking de tiempo
- **Progreso visual**: Gráficos de actividad y estadísticas
- **Insignias y logros**: Gamificación para mantener la motivación
- **Multi-usuario**: Invita a tu familia y asigna tareas
- **Recordatorios inteligentes**: Notificaciones push basadas en hábitos
- **PWA instalable**: Usa la app desde tu celular como nativa

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage)
- **AI**: OpenAI GPT-4 Vision
- **Pagos**: Stripe
- **Charts**: Recharts
- **PWA**: Web Manifest + Service Worker

## Setup

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd clean-home-ai
pnpm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ejecutar el SQL de migración en SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
3. Crear un bucket de storage llamado `room-scans` (privado)
4. Copiar las credenciales al `.env.local`

### 3. Configurar OpenAI

1. Obtener API key de [OpenAI](https://platform.openai.com)
2. Agregar al `.env.local`

### 4. Configurar Stripe

1. Crear cuenta en [Stripe](https://stripe.com)
2. Crear un producto y precio (ej: Premium $9.99/mes)
3. Configurar webhook para estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Agregar las keys al `.env.local`

### 5. Configurar Web Push (opcional)

1. Generar VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Agregar al `.env.local`

### 6. Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
cp .env.example .env.local
```

### 7. Ejecutar

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (recomendado)

```bash
vercel --prod --yes
```

Configurar las variables de entorno en el dashboard de Vercel.

### Stripe Webhook

El endpoint del webhook es: `https://tu-dominio.com/api/stripe/webhook`

## Estructura del proyecto

```
app/
├── (auth)/              # Páginas de autenticación
│   ├── login/
│   └── signup/
├── (dashboard)/         # Páginas protegidas
│   ├── dashboard/       # Home del usuario
│   ├── scan/            # Nueva evaluación
│   ├── tasks/           # Lista de tareas
│   ├── progress/        # Estadísticas
│   ├── rooms/           # Administrar habitaciones
│   ├── members/         # Miembros del hogar
│   └── settings/        # Configuración
├── api/
│   ├── ai/              # Análisis de imagen
│   ├── auth/            # Auth callback
│   ├── push/            # Web Push
│   └── stripe/          # Billing
├── invite/[token]/      # Aceptar invitación
└── onboarding/          # Setup inicial

components/
├── layout/              # Header, BottomNav, etc.
└── ui/                  # Componentes reutilizables

hooks/                   # Custom hooks
lib/                     # Utilidades y configuración
types/                   # TypeScript types
supabase/migrations/     # SQL schema
public/                  # PWA manifest, icons, sw.js
```

## AI Schema

El endpoint `/api/ai/analyze` devuelve un JSON con este formato:

```typescript
{
  room_guess: string | null,
  room_confidence: number | null,
  observations: Array<{
    description: string,
    severity: 'low' | 'medium' | 'high',
    location?: string,
    uncertain: boolean
  }>,
  tasks: Array<{
    title: string,
    description_steps: string[],
    category: 'order' | 'dust' | 'surfaces' | 'floor' | 'trash' | 'laundry' | 'kitchen' | 'bathroom' | 'general',
    estimated_minutes: number,
    difficulty: 1-5,
    priority: 1-10,
    supplies: string[],
    safety_notes: string[],
    assignable: boolean,
    quick_win: boolean
  }>,
  total_estimated_minutes: number,
  suggested_recurring_tasks: Array<{...}>,
  before_score: 0-100,
  summary: string,
  quick_wins_summary?: string
}
```

## Planes

| Feature | Free | Premium |
|---------|------|---------|
| Escaneos/mes | 5 | Ilimitados |
| Hogares | 1 | 5 |
| Miembros/hogar | 1 | 10 |
| Templates | ❌ | ✅ |
| Analytics avanzados | ❌ | ✅ |
| Precio | $0 | $9.99/mes |

## Licencia

Privado - Todos los derechos reservados
