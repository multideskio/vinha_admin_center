import { Grape, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-muted/20">
        {children}
      </div>

      {/* Right side - Hero com gradiente Videira */}
      <div className="hidden lg:block relative overflow-hidden">
        {/* Gradiente Videira de fundo */}
        <div className="absolute inset-0 videira-gradient opacity-95" />
        
        {/* Padrão de bolinhas decorativas */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-white/50 blur-2xl" />
        </div>

        {/* Conteúdo */}
        <div className="relative h-full flex flex-col justify-center p-12 z-10">
          <div className="max-w-lg">
            {/* Logo e título */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-white/30 shadow-xl">
                  <Grape className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                    Vinha Admin
                  </h1>
                  <p className="text-white/90 text-sm font-medium">
                    Sistema de Gestão Ministerial
                  </p>
                </div>
              </div>
            </div>

            {/* Versículo Bíblico */}
            <div className="mt-8 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="space-y-3">
                <p className="text-lg text-white/95 leading-relaxed italic">
                  &ldquo;Trazei todos os dízimos à casa do tesouro, para que haja mantimento na minha casa, 
                  e depois fazei prova de mim, diz o Senhor dos Exércitos, se eu não vos abrir as janelas 
                  do céu e não derramar sobre vós uma bênção tal, que dela vos advenha a maior abastança.&rdquo;
                </p>
                <p className="text-white/70 text-sm font-medium text-right">
                  Malaquias 3:10
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Desenvolvido com dedicação para sua comunidade</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
