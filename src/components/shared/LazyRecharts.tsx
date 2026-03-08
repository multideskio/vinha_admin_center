'use client'

/**
 * Re-exporta componentes do Recharts com lazy loading via next/dynamic.
 * Reduz o bundle inicial em ~200KB por página que usa gráficos.
 */
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Placeholder de carregamento para gráficos
const ChartSkeleton = () => <Skeleton className="h-[300px] w-full rounded-lg" />

// Componentes de gráfico com lazy loading
export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart })),
  { ssr: false, loading: ChartSkeleton },
)

export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart })),
  { ssr: false, loading: ChartSkeleton },
)

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { ssr: false, loading: ChartSkeleton },
)

// Sub-componentes do Recharts (não precisam de lazy loading individual,
// são carregados junto com o chart pai)
export {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Pie,
  Cell,
  Legend,
  Line,
} from 'recharts'
