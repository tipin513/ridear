"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, MapPin, User, Wallet, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/garage" 
          className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/garage' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium">Mi Moto</span>
        </Link>
        
        <Link 
          href="/mantenimientos" 
          id="tour-nav-bitacora"
          className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/mantenimientos' ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wrench size={24} />
          <span className="text-[10px] mt-1 font-medium">Bitácora</span>
        </Link>

        <Link 
          href="/directorio" 
          className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/directorio') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <MapPin size={24} />
          <span className="text-[10px] mt-1 font-medium">Directorio</span>
        </Link>
        
        <Link 
          href="/documentos" 
          id="tour-nav-documentos"
          className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/documentos') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wallet size={24} />
          <span className="text-[10px] mt-1 font-medium">Documentos</span>
        </Link>

        <Link 
          href="/sobre-la-app" 
          className={`flex flex-col items-center justify-center w-full h-full ${pathname.startsWith('/sobre-la-app') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Info size={24} />
          <span className="text-[10px] mt-1 font-medium">App</span>
        </Link>
      </div>
    </nav>
  );
}
