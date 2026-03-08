import {
  LayoutDashboard,
  Map,
  UserCheck,
  UserCog,
  User,
  Church,
  Settings,
  FileText,
  Shield,
  ArrowRightLeft,
} from 'lucide-react'

export const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'cyan' },
  { href: '/admin/transacoes', label: 'Transações', icon: ArrowRightLeft, gradient: 'blue' },
  { href: '/admin/regioes', label: 'Regiões', icon: Map, gradient: 'purple' },
  { href: '/admin/gerentes', label: 'Gerentes', icon: UserCheck, gradient: 'cyan' },
  { href: '/admin/supervisores', label: 'Supervisores', icon: UserCog, gradient: 'blue' },
  { href: '/admin/pastores', label: 'Pastores', icon: User, gradient: 'purple' },
  { href: '/admin/igrejas', label: 'Igrejas', icon: Church, gradient: 'cyan' },
  { href: '/admin/administradores', label: 'Administradores', icon: Shield, gradient: 'blue' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText, gradient: 'purple' },
]

export const ADMIN_SETTINGS_ITEM = {
  href: '/admin/configuracoes',
  label: 'Configurações',
  icon: Settings,
}
