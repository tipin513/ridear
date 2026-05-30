"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addBike, updateUserProfile, uploadUserImage } from "@/lib/services";
import { ChevronLeft, Loader2, Bike, Camera } from "lucide-react";
import Link from "next/link";

export default function AddBikePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Forms
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [oilInterval, setOilInterval] = useState("5000");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerPositionY, setBannerPositionY] = useState(50);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setBannerPositionY(50); // Reset to center
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      let finalBannerURL = "";
      if (bannerFile) {
        finalBannerURL = await uploadUserImage(user.uid, bannerFile, 'banner');
      }

      // 1. Agregar la moto a la colección
      const newBikeId = await addBike(user.uid, {
        brand,
        model,
        year,
        mileage: parseInt(mileage) || 0,
        serviceIntervals: {
          oil: parseInt(oilInterval) || 5000
        },
        bannerURL: finalBannerURL,
        bannerPositionY
      });

      // 2. Establecer esta moto como la principal/actual seleccionada
      await updateUserProfile(user.uid, { currentBikeId: newBikeId });

      router.push("/garage");
    } catch (error) {
      console.error("Error adding bike:", error);
      alert("Hubo un error al agregar la moto. Intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center bg-background/90 px-4 py-4 backdrop-blur-md">
        <Link href="/garage" className="mr-4 text-zinc-400 hover:text-white">
          <ChevronLeft size={28} />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Añadir Nueva Moto</h1>
      </header>

      <div className="px-4 mt-6">
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Banner Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Foto de Portada (La Moto)</label>
            <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-card">
              {bannerPreview ? (
                <div className="relative h-full w-full">
                  <img 
                    src={bannerPreview} 
                    alt="Banner" 
                    className="h-full w-full object-cover transition-all" 
                    style={{ objectPosition: `50% ${bannerPositionY}%` }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <div className="relative">
                      <button 
                        type="button" 
                        className="flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black/85 transition-colors shadow-lg"
                      >
                        <Camera size={14} />
                        Cambiar Foto
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleBannerChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-zinc-500">
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm">Toca para subir foto de tu moto</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleBannerChange}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              )}
            </div>
            {bannerPreview && (
              <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3 mt-2 space-y-1.5 animate-in fade-in duration-250">
                <div className="flex justify-between text-xs text-zinc-400 font-medium">
                  <span>Encuadre Vertical</span>
                  <span>{bannerPositionY}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={bannerPositionY}
                  onChange={(e) => setBannerPositionY(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-[10px] text-zinc-500">Desliza para centrar o ajustar la parte visible de la moto.</p>
              </div>
            )}
          </div>
          {/* Bike Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">Datos de la Moto</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Marca</label>
                <input 
                  type="text" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" 
                  placeholder="Ej. Honda"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Modelo</label>
                <input 
                  type="text" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" 
                  placeholder="Ej. CB500X"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Año</label>
                <input 
                  type="number" 
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" 
                  placeholder="Ej. 2023"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Kilometraje Total (KM)</label>
                <input 
                  type="number" 
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" 
                  placeholder="Ej. 15000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Configurations */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">Configuración de Alertas</h2>
            
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Intervalo de Cambio de Aceite (KM)</label>
              <p className="text-[10px] text-zinc-500 mb-2">Según el manual de tu moto, cada cuántos KM debés cambiar el aceite.</p>
              <input 
                type="number" 
                value={oilInterval}
                onChange={(e) => setOilInterval(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" 
                placeholder="Ej. 3000 o 5000"
                required
              />
            </div>
          </div>

          <div className="pt-4 pb-8">
            <button 
              type="submit" 
              disabled={saving}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : "Añadir Moto a mi Garage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
