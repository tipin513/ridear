"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addWorkshop } from "@/lib/services";
import { ChevronLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

export default function NuevoTallerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("Mecánica General");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await addWorkshop(user.uid, {
        name,
        specialty,
        phone,
        address,
        notes,
        isPublic,
        ownerUid: user.uid,
      });
      router.push("/directorio");
    } catch (error) {
      console.error("Error adding workshop:", error);
      alert("Hubo un error al guardar el taller.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 flex items-center bg-background/90 px-4 py-4 backdrop-blur-md border-b border-border">
        <Link href="/directorio" className="mr-4 text-zinc-400 hover:text-white">
          <ChevronLeft size={28} />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Agendar Mecánico</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 mt-6 space-y-6">
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Nombre del Taller / Mecánico</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Taller Los Amigos"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Especialidad</label>
            <select 
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none appearance-none"
              required
            >
              <option value="Mecánica General">Mecánica General</option>
              <option value="Lubricentro">Lubricentro</option>
              <option value="Gomería">Gomería</option>
              <option value="Electricidad">Electricidad</option>
              <option value="Suspensión">Suspensión / Ciclística</option>
              <option value="Inyección / Escáner">Inyección / Escáner</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Teléfono (WhatsApp)</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. 1123456789"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Dirección</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Av. Siempreviva 742, CABA"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Notas / Referencias</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" 
              placeholder="Ej. Preguntar por Carlos, atiende de 9 a 18hs."
            />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4 flex gap-3 items-start">
            <div className="flex-1">
              <label className="flex items-center gap-2 font-medium text-foreground text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-background"
                />
                Compartir con la comunidad
              </label>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                <Info size={14} className="inline mr-1 text-primary" />
                Si activas esto, el taller será visible en el buscador público de la app para ayudar a otros motociclistas.
              </p>
            </div>
          </div>

        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none active:scale-95 transition-all disabled:opacity-50 mt-8"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : "Agendar Mecánico"}
        </button>
      </form>
    </div>
  );
}
