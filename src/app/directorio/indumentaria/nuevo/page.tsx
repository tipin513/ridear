"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addGear } from "@/lib/services";
import { ChevronLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

const CATEGORIES_OPTIONS = [
  "Cascos",
  "Camperas",
  "Intercoms",
  "Calzado",
  "Guantes",
  "Baúles y Top Cases",
  "Mochilas",
  "Soportes para Celular",
  "Pantallas Inteligentes y GPS",
  "Defensas y Sliders",
  "Cubrepuños",
  "Parabrisas y Deflectores",
  "Fundas y Cobertores",
  "Seguridad / Antirrobos"
];

export default function NuevaIndumentariaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  
  // Multiple selection arrays
  const [categories, setCategories] = useState<string[]>([]);

  const handleToggleCategory = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await addGear(user.uid, {
        name,
        phone,
        address,
        categories,
        notes,
        isPublic,
        ownerUid: user.uid,
      });
      router.push("/directorio");
    } catch (error) {
      console.error("Error adding gear:", error);
      alert("Hubo un error al guardar la tienda de indumentaria.");
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
        <h1 className="text-xl font-bold text-foreground">Agendar Tienda de Indumentaria</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 mt-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Nombre de la Tienda</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Biker Store"
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
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Dirección</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Av. de Mayo 1234, CABA"
              required
            />
          </div>

          {/* Categories Multiple Selection */}
          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400">¿Qué venden? (Seleccioná varias)</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES_OPTIONS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleToggleCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    categories.includes(cat) 
                      ? "bg-primary/20 border-primary text-primary font-medium" 
                      : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs text-zinc-400">Notas / Referencias</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" 
              placeholder="Ej. Tienen buenos precios en cascos."
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
                Recomendá esta tienda al resto de la comunidad en el directorio público.
              </p>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none active:scale-95 transition-all disabled:opacity-50 mt-8"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : "Agendar Tienda"}
        </button>
      </form>
    </div>
  );
}
