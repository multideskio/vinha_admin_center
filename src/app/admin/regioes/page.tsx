'use client'

import * as React from 'react'
import { MoreHorizontal, PlusCircle, Map, Palette, Edit, Trash2, RefreshCw } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const SUGGESTED_COLORS = [
  { name: 'Azul Oceano', color: '#0077BE' },
  { name: 'Verde Floresta', color: '#228B22' },
  { name: 'Roxo Real', color: '#6A0DAD' },
  { name: 'Laranja Vibrante', color: '#FF8C00' },
  { name: 'Vermelho Cardeal', color: '#C41E3A' },
  { name: 'Amarelo Dourado', color: '#FFD700' },
  { name: 'Rosa Coral', color: '#FF7F7F' },
  { name: 'Turquesa', color: '#40E0D0' },
  { name: 'Índigo', color: '#4B0082' },
  { name: 'Verde Esmeralda', color: '#50C878' },
]

const regionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  color: z
    .string()
    .min(7, { message: 'A cor deve estar no formato hexadecimal.' })
    .regex(/^#[0-9a-fA-F]{6}$/, {
      message: 'Cor inválida. Use o formato #RRGGBB.',
    }),
})

export type Region = z.infer<typeof regionSchema> & {
  companyId?: string | null
  deletedAt?: Date | null
  deletedBy?: string | null
  createdAt?: Date
  updatedAt?: Date | null
}

const RegionFormModal = ({
  region,
  onSave,
  children,
  existingRegions = [],
}: {
  region?: Region
  onSave: () => void
  children: React.ReactNode
  existingRegions?: Region[]
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [nameError, setNameError] = React.useState<string>('')
  const { toast } = useToast()
  const form = useForm<z.infer<typeof regionSchema>>({
    resolver: zodResolver(regionSchema),
    defaultValues: region || {
      name: '',
      color: '#3F51B5',
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        region || {
          name: '',
          color: '#3F51B5',
        },
      )
      setNameError('')
    }
  }, [isOpen, region, form])

  // Validação em tempo real do nome
  const validateName = React.useCallback((name: string) => {
    if (!name.trim()) {
      setNameError('')
      return
    }
    
    const isDuplicate = existingRegions.some(
      r => r.name.toLowerCase() === name.toLowerCase() && r.id !== region?.id
    )
    
    if (isDuplicate) {
      setNameError('Já existe uma região com este nome.')
    } else {
      setNameError('')
    }
  }, [existingRegions, region?.id])

  const handleSave = async (data: z.infer<typeof regionSchema>) => {
    if (nameError) {
      toast({
        title: 'Erro de validação',
        description: nameError,
        variant: 'destructive',
      })
      return
    }

    const method = data.id ? 'PUT' : 'POST'
    const url = data.id ? `/api/v1/regioes/${data.id}` : '/api/v1/regioes'

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao salvar a região.')
      }

      toast({
        title: 'Sucesso!',
        description: `Região ${data.id ? 'atualizada' : 'criada'} com sucesso.`,
        variant: 'success',
      })
      onSave()
      setIsOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao salvar região',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const usedColors = existingRegions
    .filter(r => r.id !== region?.id)
    .map(r => r.color.toLowerCase())

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Palette className="h-5 w-5 text-videira-blue" />
            {region ? 'Editar Região' : 'Nova Região'}
          </DialogTitle>
          <DialogDescription>
            {region ? 'Atualize as informações da região' : 'Adicione uma nova região ao sistema'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Região</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: Nordeste, Sul, Centro-Oeste"
                      onChange={(e) => {
                        field.onChange(e)
                        validateName(e.target.value)
                      }}
                      className={nameError ? 'border-destructive' : ''}
                    />
                  </FormControl>
                  {nameError && (
                    <p className="text-sm text-destructive">{nameError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor da Região</FormLabel>
                  <div className="space-y-4">
                    {/* Cores Sugeridas */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Cores sugeridas:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {SUGGESTED_COLORS.map((suggestedColor) => {
                          const isUsed = usedColors.includes(suggestedColor.color.toLowerCase())
                          const isSelected = field.value.toLowerCase() === suggestedColor.color.toLowerCase()
                          
                          return (
                            <button
                              key={suggestedColor.color}
                              type="button"
                              onClick={() => !isUsed && field.onChange(suggestedColor.color)}
                              disabled={isUsed}
                              className={cn(
                                "relative h-12 w-12 rounded-lg border-2 transition-all",
                                isSelected && "ring-2 ring-videira-blue ring-offset-2",
                                isUsed && "opacity-50 cursor-not-allowed",
                                !isUsed && "hover:scale-110 cursor-pointer"
                              )}
                              style={{ backgroundColor: suggestedColor.color }}
                              title={`${suggestedColor.name} ${isUsed ? '(Em uso)' : ''}`}
                            >
                              {isUsed && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-6 w-6 rounded-full bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-xs">✕</span>
                                  </div>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Seletor de Cor Personalizada */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Ou escolha uma cor personalizada:</p>
                      <div className="flex gap-3">
                        <FormControl>
                          <Input type="color" {...field} className="h-12 w-20 cursor-pointer" />
                        </FormControl>
                        <Input 
                          value={field.value} 
                          onChange={field.onChange}
                          placeholder="#RRGGBB"
                          className="flex-1 font-mono"
                        />
                        <div
                          className="h-12 w-12 rounded-lg border-2 border-muted shadow-sm"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </div>

                    {/* Aviso de Cor Duplicada */}
                    {usedColors.includes(field.value.toLowerCase()) && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <p className="text-sm text-amber-700">
                          Esta cor já está sendo usada por outra região
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Escolha uma cor que identifique esta região nos gráficos e relatórios
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting || !!nameError}
                className="bg-videira-blue hover:bg-videira-blue/90 text-white"
              >
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Região'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function RegioesPage() {
  const [regions, setRegions] = React.useState<Region[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  const fetchRegions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/regioes')
      if (!response.ok) {
        throw new Error('Falha ao buscar as regiões')
      }
      const data = await response.json()
      setRegions(data.regions)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao buscar regiões',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchRegions()
  }, [fetchRegions])

  const handleDelete = async (id: string, regionName: string) => {
    try {
      const response = await fetch(`/api/v1/regioes/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao excluir a região')
      }
      
      toast({
        title: 'Sucesso!',
        description: 'Região excluída com sucesso.',
        variant: 'success',
      })
      fetchRegions()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro ao excluir região',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <Map className="h-8 w-8" />
                Regiões
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Gerencie as regiões e suas respectivas cores para organização
              </p>
              <p className="text-sm text-white/70 mt-1">
                {regions.length} {regions.length === 1 ? 'região cadastrada' : 'regiões cadastradas'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="icon"
                onClick={fetchRegions}
                className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <RegionFormModal existingRegions={regions} onSave={fetchRegions}>
                <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold gap-2">
                  <PlusCircle className="h-5 w-5" />
                  <span>Nova Região</span>
                </Button>
              </RegionFormModal>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total de Regiões
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
              <Map className="h-5 w-5 text-videira-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-cyan">{regions.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Ativas no sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-blue hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Cores Únicas
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <Palette className="h-5 w-5 text-videira-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-blue">
              {new Set(regions.map(r => r.color)).size}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Paleta de cores</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Última Atualização
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <RefreshCw className="h-5 w-5 text-videira-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-videira-purple">
              {regions.length > 0 ? 'Recente' : '-'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Sistema atualizado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Regiões */}
      <Card className="shadow-lg border-l-4 border-l-videira-blue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <Map className="h-5 w-5 text-videira-blue" />
                </div>
                Lista de Regiões
              </CardTitle>
              <CardDescription className="mt-1">
                Gerencie as regiões para organizar igrejas e supervisores
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                  <TableHead className="w-[80px] font-semibold">Cor</TableHead>
                  <TableHead className="font-semibold">Nome da Região</TableHead>
                  <TableHead className="text-right font-semibold">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-10 w-10 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : regions.length > 0 ? (
                      regions.map((region) => (
                        <TableRow key={region.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-10 w-10 rounded-full border-2 border-white shadow-md ring-2 ring-offset-2 ring-offset-background"
                                style={{ 
                                  backgroundColor: region.color,
                                  boxShadow: `0 0 20px ${region.color}40`
                                }}
                              />
                              <code className="text-xs font-mono text-muted-foreground">
                                {region.color}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-lg">{region.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <RegionFormModal region={region} existingRegions={regions} onSave={fetchRegions}>
                                <Button 
                                  size="sm"
                                  className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                              </RegionFormModal>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm"
                                    className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Essa ação não pode ser desfeita. Isso excluirá permanentemente a região <strong>{region.name}</strong>.
                                      {/* Verificar se há supervisores vinculados será feito pela API */}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => region.id && handleDelete(region.id, region.name)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Sim, excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-32">
                          <div className="flex flex-col items-center gap-3 py-8">
                            <Map className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <p className="text-lg font-medium text-muted-foreground">
                                Nenhuma região cadastrada
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Clique em "Nova Região" para começar
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paleta de Cores Sugeridas */}
      {regions.length > 0 && (
        <Card className="shadow-lg border-l-4 border-l-videira-purple bg-gradient-to-br from-videira-purple/5 to-background">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
                <Palette className="h-5 w-5 text-videira-purple" />
              </div>
              Paleta de Cores das Regiões
            </CardTitle>
            <CardDescription>Todas as cores atualmente em uso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {regions.map((region) => (
                <div key={region.id} className="flex flex-col items-center gap-2">
                  <div
                    className="h-16 w-16 rounded-xl border-2 border-white shadow-lg ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110"
                    style={{ 
                      backgroundColor: region.color,
                      boxShadow: `0 0 30px ${region.color}60`
                    }}
                  />
                  <div className="text-center">
                    <p className="text-sm font-semibold">{region.name}</p>
                    <code className="text-xs text-muted-foreground font-mono">{region.color}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
