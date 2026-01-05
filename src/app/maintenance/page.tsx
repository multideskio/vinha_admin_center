import { getCompanySettings } from '@/lib/company'
import { Settings } from 'lucide-react'
import Image from 'next/image'

export default async function MaintenancePage() {
  const company = await getCompanySettings()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {company?.logoUrl ? (
          <Image src={company.logoUrl} alt="Logo" width={80} height={80} className="h-20 mx-auto mb-8" />
        ) : (
          <Settings className="h-20 w-20 mx-auto text-muted-foreground mb-8" />
        )}
        <h1 className="text-4xl font-bold">Sistema em Manutenção</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Estamos realizando melhorias no sistema. Voltaremos em breve!
        </p>
        {company?.supportEmail && (
          <p className="text-sm text-muted-foreground">
            Dúvidas? Entre em contato:{' '}
            <a href={`mailto:${company.supportEmail}`} className="underline">
              {company.supportEmail}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
