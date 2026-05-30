"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-selector',
    title: 'Selector de Garage 🏍️',
    description: 'Acá podés cambiar entre tus motos en un instante o añadir una nueva a tu colección con facilidad.',
    position: 'bottom'
  },
  {
    targetId: 'tour-avatar',
    title: 'Tu Perfil y Portada 📸',
    description: 'Tocá el botón de la cámara para personalizar tu foto de piloto, o subí la foto de tu moto y ajustá su encuadre vertical.',
    position: 'bottom'
  },
  {
    targetId: 'tour-ficha',
    title: 'Ficha Técnica y Alertas ⚙️',
    description: 'Llevá el control de los kilómetros de tu moto y recibí alertas predictivas automáticas para los cambios de aceite.',
    position: 'bottom'
  },
  {
    targetId: 'tour-nav-bitacora',
    title: 'Bitácora Mecánica 🔧',
    description: 'Registrá tus servicios, mantenimientos y cambios de fluidos en la bitácora para tener tu historial clínico motero de por vida.',
    position: 'top'
  },
  {
    targetId: 'tour-nav-documentos',
    title: 'Documentos 📂',
    description: 'Escaneá tu Licencia, Cédula Verde y Seguro para tenerlos siempre a mano y recibir alertas antes de que venzan.',
    position: 'top'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const activeStep = TOUR_STEPS[currentStep];

  useEffect(() => {
    // Retrasar un poco el inicio para que se cargue la página
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updateCoordinates = () => {
      const element = document.getElementById(activeStep.targetId);
      if (element) {
        // Asegurarse de que el elemento sea visible al hacer scroll
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Esperar un instante a que termine el scroll para medir
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setCoords({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 100);
      } else {
        // Si el elemento no existe (ej. garage vacío), saltar al siguiente paso o terminar
        handleNext();
      }
    };

    updateCoordinates();

    window.addEventListener('resize', updateCoordinates);
    window.addEventListener('scroll', updateCoordinates);

    return () => {
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates);
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  if (!isVisible || !coords) return null;

  // Estilo para el spotlight (caja que resalta el elemento)
  const spotlightStyle: React.CSSProperties = {
    position: 'absolute',
    top: coords.top - 6,
    left: coords.left - 6,
    width: coords.width + 12,
    height: coords.height + 12,
    borderRadius: '16px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '2px dashed #f97316',
  };

  // Posicionamiento inteligente del tooltip
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.max(16, Math.min(window.innerWidth - 320, coords.left + coords.width / 2 - 150)),
    zIndex: 9999,
    width: '300px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  if (activeStep.position === 'bottom') {
    tooltipStyle.top = coords.top + coords.height + 16;
  } else {
    tooltipStyle.top = coords.top - 170 - 16; // Aproximadamente el alto del tooltip
  }

  return (
    <div className="fixed inset-0 z-[9997] overflow-y-auto overflow-x-hidden select-none">
      
      {/* Spotlight highlight */}
      <div style={spotlightStyle} />

      {/* Floating Tooltip Bubble */}
      <div 
        ref={tooltipRef}
        style={tooltipStyle}
        className="rounded-2xl border border-primary/20 bg-zinc-950 p-4 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Header indicator */}
        <div className="flex justify-between items-center mb-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary tracking-wider uppercase">
            <Sparkles size={10} className="animate-pulse" />
            Recorrido Ridear ({currentStep + 1}/{TOUR_STEPS.length})
          </span>
          <button 
            onClick={handleComplete} 
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-white mb-1.5">{activeStep.title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">{activeStep.description}</p>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center border-t border-white/5 pt-3">
          <button 
            onClick={handleComplete}
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Omitir
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="flex h-7 items-center justify-center rounded-lg bg-zinc-900 border border-white/10 px-2.5 text-xs text-white hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex h-7 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Entendido" : "Siguiente"}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
