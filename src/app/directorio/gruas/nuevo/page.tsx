"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addTowing } from "@/lib/services";
import { ChevronLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

export default function NuevaGruaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await addTowing(user.uid, {
        name,
        phone,
        area,
        notes,
        isPublic,
        ownerUid: user.uid,
      });
      router.push("/directorio");
    } catch (error) {
      console.error("Error adding towing:", error);
      alert("Hubo un error al guardar la asistencia.");
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
        <h1 className="text-xl font-bold text-foreground">Agendar Grúa / Asistencia</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 mt-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Nombre de la Empresa o Servicio</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Grúas El Rápido"
              required
            />
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
            <label className="text-xs text-zinc-400">Zona de Cobertura</label>
            <input 
              type="text" 
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Zona Norte GBA y CABA"
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
              placeholder="Ej. Trabajan las 24hs, aceptan transferencia."
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
                Si activas esto, este servicio será visible en el buscador público para ayudar a otros motociclistas varados.
              </p>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none active:scale-95 transition-all disabled:opacity-50 mt-8"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : "Agendar Asistencia"}
        </button>
      </form>
    </div>
  );
}
