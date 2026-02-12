/**
 * Componente de formulário para dados da contribuição
 * @lastReview 2025-01-05 15:30
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { ContributionDataFormProps, ContributionData, CONTRIBUTION_TYPES } from '../types'
import { sanitizeInput, formatMoneyInput, parseMoneyInput, validateMoneyAmount } from '../utils'

// Schema de validação
const contributionDataSchema = z.object({
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  contributionType: z.enum(['dizimo', 'oferta'], {
    required_error: 'O tipo de contribuição é obrigatório.',
  }),
  description: z.string().optional(),
})

// Tipo específico para o formulário
type ContributionFormData = z.infer<typeof contributionDataSchema>

export default function ContributionDataForm({
  onSubmit,
  onChange,
  isLoading: _isLoading = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  defaultValues,
}: ContributionDataFormProps) {
  // Estado para os dígitos brutos (em centavos)
  const [rawDigits, setRawDigits] = React.useState('')
  const [moneyError, setMoneyError] = React.useState<string | null>(null)

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionDataSchema),
    defaultValues: {
      amount: defaultValues?.amount || 0,
      contributionType: defaultValues?.contributionType || 'dizimo',
      description: defaultValues?.description || '',
    },
  })

  // Inicializa o campo de dinheiro com valor padrão
  React.useEffect(() => {
    if (defaultValues?.amount && defaultValues.amount > 0) {
      // Converte reais para centavos (string de dígitos)
      const cents = Math.round(defaultValues.amount * 100).toString()
      setRawDigits(cents)
    }
  }, [defaultValues?.amount])

  // Calcula o valor formatado a partir dos dígitos brutos
  const moneyInput = React.useMemo(() => {
    if (!rawDigits) return ''
    return formatMoneyInput(rawDigits)
  }, [rawDigits])

  const handleMoneyInputChange = React.useCallback(
    (inputValue: string, isNewDigit: boolean = false) => {
      let newRawDigits: string

      if (isNewDigit) {
        // Adiciona apenas o novo dígito aos dígitos existentes
        const newDigit = inputValue.replace(/[^\d]/g, '')
        if (!newDigit) return
        newRawDigits = (rawDigits + newDigit).slice(0, 9)
      } else {
        // Extrai apenas os dígitos do valor
        newRawDigits = inputValue.replace(/[^\d]/g, '').slice(0, 9)
      }

      // Se não há dígitos, limpa o campo
      if (!newRawDigits) {
        setRawDigits('')
        form.setValue('amount', 0)
        setMoneyError(null)
        return
      }

      // Calcula o valor em reais
      const amountInReais = Number(newRawDigits) / 100

      // Valida o valor
      const error = validateMoneyAmount(amountInReais)

      // Atualiza o estado
      setRawDigits(newRawDigits)
      form.setValue('amount', amountInReais)
      setMoneyError(error)
    },
    [form, rawDigits],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permite teclas de controle
      const allowedKeys = [
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ]

      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
        return
      }

      // Backspace - remove último dígito
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        if (rawDigits.length > 0) {
          const newRawDigits = rawDigits.slice(0, -1)
          setRawDigits(newRawDigits)
          const amountInReais = newRawDigits ? Number(newRawDigits) / 100 : 0
          form.setValue('amount', amountInReais)
          setMoneyError(newRawDigits ? validateMoneyAmount(amountInReais) : null)
        }
        return
      }

      // Se é um dígito, adiciona aos dígitos brutos
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        handleMoneyInputChange(e.key, true)
        return
      }

      // Bloqueia qualquer outra tecla
      e.preventDefault()
    },
    [form, rawDigits, handleMoneyInputChange],
  )

  const handleSubmit = (data: ContributionFormData) => {
    // Sanitiza a descrição e garante que amount é número
    const sanitizedData: ContributionData = {
      ...data,
      amount: Number(data.amount), // Garante conversão para número
      paymentMethod: defaultValues?.paymentMethod || 'pix', // Adiciona o método de pagamento
      description: data.description ? sanitizeInput(data.description) : undefined,
    }

    onSubmit(sanitizedData)
  }

  const watchedAmount = form.watch('amount')
  const watchedContributionType = form.watch('contributionType')
  const watchedDescription = form.watch('description')

  // Notifica mudanças em tempo real
  React.useEffect(() => {
    if (onChange) {
      onChange({
        amount: watchedAmount,
        contributionType: watchedContributionType,
        description: watchedDescription,
        paymentMethod: defaultValues?.paymentMethod || 'pix',
      })
    }
  }, [
    watchedAmount,
    watchedContributionType,
    watchedDescription,
    defaultValues?.paymentMethod,
    onChange,
  ])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg mb-1">Dados da Contribuição</h3>
        <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Valor da Contribuição com formatação de dinheiro */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Valor da Contribuição *</FormLabel>
                <div className="relative group">
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={moneyInput}
                      onChange={() => {
                        // Controlado via onKeyDown para evitar problemas de formatação
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        // Não precisa fazer nada especial no blur
                        // O estado rawDigits já está correto
                      }}
                      ref={field.ref}
                      className="text-2xl font-bold h-14 border-2 focus:border-videira-cyan focus:ring-2 focus:ring-videira-cyan/20 transition-all text-center"
                    />
                  </FormControl>
                  {/* Valores sugeridos */}
                  <div className="flex gap-2 mt-2">
                    {[50, 100, 200, 500].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          // Define diretamente os dígitos brutos (valor em centavos)
                          const cents = (value * 100).toString()
                          setRawDigits(cents)
                          form.setValue('amount', value)
                          setMoneyError(validateMoneyAmount(value))
                        }}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-videira-cyan/10 hover:text-videira-cyan border border-gray-200 hover:border-videira-cyan rounded-lg transition-all"
                      >
                        R$ {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground font-medium">
                    💡 Valor mínimo: R$ 1,00 • Máximo: R$ 100.000,00
                  </p>
                  {parseMoneyInput(moneyInput) > 0 && (
                    <div className="text-xs text-videira-cyan font-bold bg-videira-cyan/10 px-2 py-1 rounded">
                      ✓ Válido
                    </div>
                  )}
                </div>
                {moneyError && <p className="text-sm font-medium text-red-600">{moneyError}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Contribuição com seletor visual */}
          <FormField
            control={form.control}
            name="contributionType"
            render={({ field }) => (
              <FormItem role="radiogroup">
                <FormLabel className="text-base font-medium">Tipo de Contribuição *</FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CONTRIBUTION_TYPES).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => field.onChange(key)}
                      className={`p-4 border-2 rounded-xl transition-all text-left ${
                        field.value === key
                          ? 'border-videira-cyan bg-videira-cyan/10 text-videira-cyan'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            field.value === key
                              ? 'border-videira-cyan bg-videira-cyan'
                              : 'border-gray-300'
                          }`}
                        >
                          {field.value === key && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div>
                          <p className="font-semibold">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição Opcional */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Descrição (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Dízimo do mês de outubro, Oferta para missões, etc..."
                    className="min-h-[80px] resize-none border-2 focus:border-videira-cyan"
                    maxLength={500}
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Adicione uma descrição para identificar melhor sua contribuição
                  </p>
                  {field.value && (
                    <p className="text-xs text-muted-foreground">{field.value.length}/500</p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}
