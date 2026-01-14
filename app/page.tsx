import Link from 'next/link'
import { Camera, CheckCircle, BarChart2, Users, Sparkles, Clock, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui'
import { APP_NAME } from '@/lib/constants'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Tu hogar limpio,{' '}
              <span className="text-emerald-600">impulsado por IA</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Saca una foto de cualquier habitación y obtén un plan de limpieza personalizado
              con tareas detalladas, tiempos estimados y seguimiento de progreso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Comenzar gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              7 días de prueba gratuita. Sin tarjeta de crédito.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tres simples pasos para un hogar más limpio y organizado
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              icon={Camera}
              title="Saca una foto"
              description="Fotografía cualquier habitación o espacio que necesite atención. La IA analizará automáticamente qué necesita limpieza."
            />
            <StepCard
              number={2}
              icon={CheckCircle}
              title="Obtén tu plan"
              description="Recibe una lista de tareas personalizadas con pasos detallados, tiempos estimados y prioridades."
            />
            <StepCard
              number={3}
              icon={BarChart2}
              title="Sigue tu progreso"
              description="Completa tareas, gana insignias y visualiza tu progreso con gráficos motivadores."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Funcionalidades diseñadas para hacer la limpieza más fácil y motivadora
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Sparkles}
              title="Análisis con IA"
              description="Identifica automáticamente áreas que necesitan atención"
            />
            <FeatureCard
              icon={Clock}
              title="Tiempos estimados"
              description="Sabe exactamente cuánto tardará cada tarea"
            />
            <FeatureCard
              icon={Zap}
              title="Quick wins"
              description="Tareas rápidas para días con poco tiempo"
            />
            <FeatureCard
              icon={Users}
              title="Multi-usuario"
              description="Invita a tu familia y asigna tareas"
            />
            <FeatureCard
              icon={BarChart2}
              title="Progreso visual"
              description="Gráficos y estadísticas de tu limpieza"
            />
            <FeatureCard
              icon={CheckCircle}
              title="Insignias"
              description="Gana logros y mantén tu racha"
            />
            <FeatureCard
              icon={Camera}
              title="PWA instalable"
              description="Usa la app desde tu celular como nativa"
            />
            <FeatureCard
              icon={Shield}
              title="Privacidad"
              description="Tus fotos seguras y bajo tu control"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planes simples
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Empieza gratis y actualiza cuando lo necesites
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gratis</h3>
              <p className="text-gray-500 mb-4">Para empezar a organizar tu hogar</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature>5 escaneos por mes</PricingFeature>
                <PricingFeature>1 hogar</PricingFeature>
                <PricingFeature>Tracking básico</PricingFeature>
                <PricingFeature>Insignias y rachas</PricingFeature>
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full">
                  Comenzar gratis
                </Button>
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-emerald-600 rounded-2xl p-8 text-white relative">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium</h3>
              <p className="text-emerald-100 mb-4">Para hogares que quieren más</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-emerald-100">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                <PricingFeature light>Escaneos ilimitados</PricingFeature>
                <PricingFeature light>Hasta 5 hogares</PricingFeature>
                <PricingFeature light>Multi-usuario (10 por hogar)</PricingFeature>
                <PricingFeature light>Analytics avanzados</PricingFeature>
                <PricingFeature light>Plantillas personalizadas</PricingFeature>
                <PricingFeature light>Recordatorios inteligentes</PricingFeature>
              </ul>
              <Link href="/signup?plan=premium">
                <Button variant="secondary" className="w-full bg-white text-emerald-600 hover:bg-emerald-50">
                  7 días gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Empieza hoy
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Únete a miles de personas que ya están usando {APP_NAME} para mantener
            sus hogares impecables con menos esfuerzo.
          </p>
          <Link href="/signup">
            <Button size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacidad
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Términos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StepCard({ number, icon: Icon, title, description }: { number: number; icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="relative inline-flex mb-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

function PricingFeature({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${light ? 'text-emerald-200' : 'text-emerald-600'}`} />
      <span className={light ? 'text-emerald-50' : 'text-gray-600'}>{children}</span>
    </li>
  )
}
