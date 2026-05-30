"use client";

import BottomNav from "@/components/BottomNav";
import { Coffee, Info, Heart, Users } from "lucide-react";

const InstagramIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function SobreLaAppPage() {
  return (
    <div className="relative min-h-screen bg-black pb-24 flex flex-col text-white">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: "url('/splash-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black"></div>
      </div>

      <div className="relative z-10 px-6 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="mb-10 text-center">
          <div className="mx-auto bg-primary/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Info size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Sobre RideAR</h1>
          <p className="text-zinc-400 text-sm">Tu copiloto digital, hecho con pasión.</p>
        </header>

        <div className="space-y-6 max-w-md mx-auto">
          
          <section className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-primary" size={24} />
              <h2 className="text-xl font-bold">¿Para quiénes?</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              RideAR fue creada para todos los motociclistas que buscan tener el control total de sus máquinas. Desde quienes hacen sus propios mantenimientos hasta los que disfrutan de las rutas largas y necesitan agendar cada detalle, repuesto o asistencia en un solo lugar seguro y siempre a mano.
            </p>
          </section>

          <section className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="text-red-500" size={24} />
              <h2 className="text-xl font-bold">¿Por quiénes?</h2>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Desarrollada íntegramente por moteros, para moteros. Entendemos de primera mano la necesidad de tener una bitácora impecable y la importancia de conectar con una comunidad activa que comparte y recomienda los mejores talleres y recursos de toda Argentina.
            </p>
          </section>
          <section className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-pink-500/30 rounded-2xl p-6 shadow-xl mt-6 text-center">
            <div className="mx-auto bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <InstagramIcon size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Comunidad RideAR</h2>
            <p className="text-zinc-300 text-sm leading-relaxed mb-6">
              ¡Sumate a nuestro Instagram! Enterate de las últimas novedades, compartí fotos de tu moto, hacé consultas o dejanos tus sugerencias para seguir mejorando la app juntos.
            </p>
            <a 
              href="https://www.instagram.com/ridearbitacora" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-white text-black font-extrabold rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
            >
              <InstagramIcon size={22} className="text-pink-600" />
              Seguinos en Instagram
            </a>
          </section>
          <section className="bg-gradient-to-br from-zinc-900/90 to-black/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-6 text-center shadow-2xl mt-10">
            <div className="mx-auto bg-yellow-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Coffee size={32} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitame un Cafecito</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              RideAR es una aplicación gratuita y sin publicidad. Si te resulta útil para el cuidado de tu moto y querés apoyar el proyecto para mantener los servidores funcionando y poder seguir sumando nuevas funciones, ¡tu aporte vale oro!
            </p>
            <a 
              href="https://cafecito.app/ridear" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-extrabold rounded-xl shadow-[0_0_25px_rgba(234,179,8,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Coffee size={22} className="text-black" />
              Colaborar en Cafecito
            </a>
          </section>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
