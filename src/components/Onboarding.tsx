"use client";

import { useState } from "react";
import { ChevronRight, Flag, Wrench, Map } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const SCREENS = [
  {
    title: "¡Buenas rutas, motoquero!",
    description: "Bienvenido a RideAR. La aplicación definitiva para organizar y tener el control total de tu pasión por las motos.",
    icon: <Flag size={72} className="text-primary mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
  },
  {
    title: "El control total de tu máquina",
    description: "Bitácora de aceite, cubiertas, transmisión, frenos y mantenimientos generales con alertas inteligentes.",
    icon: <Wrench size={72} className="text-primary mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
  },
  {
    title: "Conectá con la comunidad",
    description: "Mapa interactivo y directorio motero de talleres, repuestos, asistencias e indumentaria en toda Argentina.",
    icon: <Map size={72} className="text-primary mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px) to trigger slide change
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextScreen();
    } else if (isRightSwipe) {
      prevScreen();
    }
  };

  const nextScreen = () => {
    if (currentIndex < SCREENS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevScreen = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("ridear_onboarding_completed", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden text-white">
      {/* Background elements */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: "url('/splash-bg.jpg')" }}
      >
        {/* Dark overlay to make text readable over the image */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black"></div>
      </div>
      
      {/* Slider Container */}
      <div 
        className="relative z-10 flex-1 flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {SCREENS.map((screen, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 flex flex-col items-center justify-center p-8 text-center">
            <div className={`transition-all duration-700 ease-out flex flex-col items-center ${index === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}>
              {screen.icon}
              <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white leading-tight">
                {screen.title}
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xs mx-auto">
                {screen.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation & Controls */}
      <div className="relative z-10 p-8 pb-12 flex flex-col items-center bg-gradient-to-t from-black via-black to-transparent">
        {/* Pagination Dots */}
        <div className="flex gap-3 mb-8">
          {SCREENS.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 rounded-full transition-all duration-500 ${index === currentIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-2 bg-zinc-700'}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={nextScreen}
          className="group relative flex w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
        >
          {currentIndex === SCREENS.length - 1 ? (
            <span className="animate-in fade-in duration-300">Entrar al Garage</span>
          ) : (
            <span className="flex items-center gap-2 animate-in fade-in duration-300">
              Siguiente <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
