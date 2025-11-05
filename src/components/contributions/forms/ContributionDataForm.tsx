/**
 * Componente de formulário para dados da contribuição
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { ContributionDataFormProps, ContributionData } from '../types'
import { CONTRIBUTION_TYPES } from '../types'
import { formatCurrency, sanitizeInput } from '../utils'

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
    isLoading = false,
    defaultValues
}: ContributionDataFormProps) {
    const form = useForm<ContributionFormData>({
        resolver: zodResolver(contributionDataSchema),
        defaultValues: {
            amount: defaultValues?.amount || 0,
            contributionType: defaultValues?.contributionType || 'dizimo',
            description: defaultValues?.description || ''
        },
    })

    const handleSubmit = (data: ContributionFormData) => {
        // Sanitiza a descrição antes de enviar
        const sanitizedData: ContributionData = {
            ...data,
            paymentMethod: defaultValues?.paymentMethod || 'pix', // Adiciona o método de pagamento
            description: data.description ? sanitizeInput(data.description) : undefined
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
                paymentMethod: defaultValues?.paymentMethod || 'pix'
            })
        }
    }, [watchedAmount, watchedContributionType, watchedDescription, defaultValues?.paymentMethod, onChange])

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold mb-1">Dados da Contribuição</h3>
                <p className="text-xs text-muted-foreground">Preencha as informações</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {/* Valor da Contribuição */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-medium">
                                    Valor da Contribuição *
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                            R$
                                        </span>
                                        <Input
                                            type="number"
                                            placeholder="0,00"
                                            className="pl-10 text-lg font-medium"
                                            min="1"
                                            step="0.01"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Valor mínimo: R$ 1,00
                                    </p>
                                    {watchedAmount > 0 && (
                                        <p className="text-xs text-primary font-medium">
                                            {formatCurrency(watchedAmount)}
                                        </p>
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Tipo de Contribuição */}
                    <FormField
                        control={form.control}
                        name="contributionType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base font-medium">
                                    Tipo de Contribuição *
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Selecione o tipo de contribuição" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(CONTRIBUTION_TYPES).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{config.label}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {config.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <FormLabel className="text-base font-medium">
                                    Descrição (Opcional)
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Ex: Dízimo do mês de outubro, Oferta para missões, etc..."
                                        className="min-h-[80px] resize-none"
                                        maxLength={500}
                                        {...field}
                                    />
                                </FormControl>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-muted-foreground">
                                        Adicione uma descrição para identificar melhor sua contribuição
                                    </p>
                                    {field.value && (
                                        <p className="text-xs text-muted-foreground">
                                            {field.value.length}/500
                                        </p>
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