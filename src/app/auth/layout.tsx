
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">{children}</div>
      <div className="hidden bg-zinc-900 lg:block">
        <div className="relative h-full w-full">
            <Image
            src="https://placehold.co/1920x1080.png"
            alt="Image"
            layout="fill"
            objectFit="cover"
            className="opacity-20"
            data-ai-hint="church interior"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-zinc-950 to-transparent p-12">
                <div className="text-center text-white max-w-lg">
                    <h1 className="text-4xl font-bold mb-4">Bem-vindo à Vinha Ministérios</h1>
                    <p className="text-lg">
                        Gerencie sua comunidade com facilidade e eficiência. Nossa plataforma oferece as ferramentas certas para você se conectar e crescer.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
