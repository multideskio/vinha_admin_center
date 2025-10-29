/**
 * Tipos TypeScript compartilhados para o sistema de contribuições
 */

// Tipos básicos
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto'
export type ContributionType = 'dizimo' | 'oferta'
export type UserRole = 'supervisor' | 'manager' | 'pastor' | 'igreja'
export type PaymentStep = 1 | 2 | 3
export type PixStatus = 'idle' | 'pending' | 'confirmed' | 'expired'

// Dados da contribuição
export interface ContributionData {
  amount: number
  contributionType: ContributionType
  description?: string
  paymentMethod: PaymentMethod
}

// Dados do cartão de crédito
export interface CardData {
  number: string
  holder: string
  expirationDate: string
  securityCode: string
  brand: string
}

// Dados completos do formulário
export interface ContributionFormData extends ContributionData {
  card?: CardData
}

// Estado do pagamento
export interface PaymentState {
  currentStep: PaymentStep
  isProcessing: boolean
  paymentDetails: CieloPaymentResponse | null
  transactionId: string | null
  pixStatus: PixStatus
  countdown: number
  showPaymentDetails: boolean
}

// Resposta da API Cielo
export interface CieloPaymentResponse {
  QrCodeBase64Image?: string
  QrCodeString?: string
  DigitableLine?: string
  Url?: string
  PaymentId?: string
}

// Estado do cartão (react-credit-cards-2)
export interface CardState {
  number: string
  expiry: string
  cvc: string
  name: string
  focus: 'number' | 'expiry' | 'cvc' | 'name' | ''
}

// Props do componente principal
export interface ContributionFormProps {
  userRole?: UserRole
  onSuccess?: (transaction: any) => void
  onError?: (error: string) => void
  className?: string
}

// Props dos componentes de formulário
export interface ContributionDataFormProps {
  onSubmit: (data: ContributionData) => void
  onChange?: (data: Partial<ContributionData>) => void
  isLoading?: boolean
  defaultValues?: Partial<ContributionData>
}

export interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

export interface ContributionSummaryProps {
  data: ContributionData
  onEdit: () => void
  onSubmit: () => void
  isLoading?: boolean
}

// Props dos componentes de pagamento
export interface PixPaymentProps {
  amount: number
  transactionId: string
  paymentDetails: CieloPaymentResponse
  countdown: number
  onSuccess: () => void
  onExpired: () => void
  onBack: () => void
  onManualCheck: () => void
  isChecking?: boolean
}

export interface CreditCardPaymentProps {
  amount: number
  onSubmit: (cardData: CardData) => void
  onBack: () => void
  isLoading?: boolean
}

export interface BoletoPaymentProps {
  amount: number
  paymentDetails: CieloPaymentResponse
  onBack: () => void
}

export interface PaymentSuccessProps {
  amount: number
  contributionType: ContributionType
  onNewContribution: () => void
}

// Props dos componentes de UI
export interface ProgressIndicatorProps {
  currentStep: PaymentStep
  className?: string
}

export interface SecurityBadgesProps {
  className?: string
}

export interface CountdownTimerProps {
  seconds: number
  onExpired?: () => void
  className?: string
}

export interface PaymentStatusCardProps {
  status: PixStatus
  countdown: number
  onManualCheck: () => void
  isChecking?: boolean
  className?: string
}

// Hooks
export interface UseContributionOptions {
  onSuccess?: (transaction: any) => void
  onError?: (error: string) => void
}

export interface UseContributionReturn {
  // Estado
  formData: ContributionFormData
  paymentState: PaymentState
  cardState: CardState
  
  // Ações
  updateFormData: (data: Partial<ContributionFormData>) => void
  updateCardState: (state: Partial<CardState>) => void
  setCurrentStep: (step: PaymentStep) => void
  setPixStatus: (status: PixStatus) => void
  
  // Handlers
  handleFormSubmit: (data: ContributionData) => Promise<void>
  handleCardPayment: (cardData: CardData) => Promise<void>
  handleReset: () => void
  handleBack: () => void
}

export interface UsePaymentSyncOptions {
  transactionId: string | null
  paymentMethod: PaymentMethod
  pixStatus: PixStatus
  onSuccess: () => void
  onError: (error: string) => void
}

export interface UsePaymentSyncReturn {
  isChecking: boolean
  checkPaymentManually: () => Promise<void>
}

export interface UsePaymentTimerOptions {
  initialSeconds: number
  isActive: boolean
  onExpired: () => void
}

export interface UsePaymentTimerReturn {
  seconds: number
  isExpired: boolean
  reset: () => void
  formatTime: (seconds: number) => string
}

// Utilitários
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  transaction?: {
    id: string
    Payment?: {
      Status: number
    }
  }
}

// Constantes
export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: string; description: string }> = {
  pix: {
    label: 'PIX',
    icon: 'QrCode',
    description: 'Instantâneo e gratuito'
  },
  credit_card: {
    label: 'Cartão de Crédito',
    icon: 'CreditCard', 
    description: 'Parcelamento disponível'
  },
  boleto: {
    label: 'Boleto Bancário',
    icon: 'Banknote',
    description: 'Qualquer banco • 3 dias úteis'
  }
}

export const CONTRIBUTION_TYPES: Record<ContributionType, { label: string; description: string }> = {
  dizimo: {
    label: 'Dízimo',
    description: '10% da renda'
  },
  oferta: {
    label: 'Oferta', 
    description: 'Contribuição voluntária'
  }
}

export const PIX_COUNTDOWN_SECONDS = 180 // 3 minutos
export const PIX_MAX_ATTEMPTS = 25
export const PIX_INITIAL_DELAY = 10000 // 10 segundos
export const PIX_MIN_DELAY = 8000 // 8 segundos
export const PIX_MAX_DELAY = 15000 // 15 segundos
export const PIX_ERROR_DELAY = 12000 // 12 segundos
export const PIX_ERROR_MAX_DELAY = 20000 // 20 segundos