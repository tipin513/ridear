"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addMaintenanceRecord, getUserProfile, updateUserProfile } from "@/lib/services";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewMaintenancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState<"Fluidos" | "Desgaste" | "General">("Fluidos");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const recordMileage = parseInt(mileage) || 0;
      
      // 1. Guardar el registro de mantenimiento
      await addMaintenanceRecord(user.uid, {
        date,
        mileage: recordMileage,
        cost: parseInt(cost) || 0,
        category,
        type,
        notes
      });

      // 2. Verificar y actualizar automáticamente el kilometraje de la moto en el perfil
      const profile = await getUserProfile(user.uid);
      if (profile && profile.bikeInfo) {
        const currentMileage = profile.bikeInfo.mileage || 0;
        if (recordMileage > currentMileage) {
          await updateUserProfile(user.uid, {
            bikeInfo: {
              ...profile.bikeInfo,
              mileage: recordMileage
            }
          });
        }
      }
      
      router.push("/mantenimientos");
    } catch (error) {
      console.error("Error adding record:", error);
      alert("Hubo un error al guardar el registro.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center bg-background/90 px-4 py-4 backdrop-blur-md border-b border-border">
        <Link href="/mantenimientos" className="mr-4 text-zinc-400 hover:text-white">
          <ChevronLeft size={28} />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nuevo Registro</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 mt-6 space-y-6">
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Tipo de Trabajo</label>
            <input 
              type="text" 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Cambio de Aceite Motul 5100"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Categoría</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none appearance-none"
              required
            >
              <option value="Fluidos">Fluidos (Aceite, Líquidos)</option>
              <option value="Desgaste">Desgaste (Frenos, Transmisión, Cubiertas)</option>
              <option value="General">Mantenimiento General / Válvulas</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Costo (ARS)</label>
              <input 
                type="number" 
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
                placeholder="Ej. 15000"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Kilometraje de la moto en ese momento</label>
            <input 
              type="number" 
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. 16500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Notas / Observaciones</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" 
              placeholder="Detalles adicionales (Ej. El filtro costó más caro porque no había del común, recordar revisar pastillas la próxima vez...)"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none active:scale-95 transition-all disabled:opacity-50 mt-8"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : "Guardar Registro"}
        </button>
      </form>
    </div>
  );
}
