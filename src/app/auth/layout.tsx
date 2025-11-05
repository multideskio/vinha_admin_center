import Image from 'next/image';
import { Grape, Users, TrendingUp, Heart, Shield, Sparkles } from 'lucide-react';

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

            {/* Descrição */}
            <p className="text-xl text-white/95 mb-12 leading-relaxed drop-shadow">
              Gerencie sua comunidade com facilidade e eficiência. 
              Nossa plataforma oferece as ferramentas certas para você se conectar e crescer.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Gestão de Membros</h3>
                  <p className="text-white/80 text-sm">
                    Organize pastores, supervisores e igrejas em uma plataforma integrada
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Relatórios Inteligentes</h3>
                  <p className="text-white/80 text-sm">
                    Análises e insights em tempo real sobre contribuições e crescimento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Conexão Ministerial</h3>
                  <p className="text-white/80 text-sm">
                    Notificações automáticas via e-mail e WhatsApp para toda comunidade
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Seguro & Confiável</h3>
                  <p className="text-white/80 text-sm">
                    Seus dados protegidos com criptografia de ponta a ponta
                  </p>
                </div>
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
