"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addStore } from "@/lib/services";
import { ChevronLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

const CATEGORIES_OPTIONS = [
  "Cascos y Equipamiento",
  "Repuestos Originales",
  "Lubricantes y Fluidos",
  "Neumáticos",
  "Accesorios",
  "Herramientas"
];

const BRANDS_OPTIONS = [
  "Honda", "Yamaha", "Suzuki", "Kawasaki", 
  "Bajaj", "Royal Enfield", "KTM", "Motomel", "Zanella", "Corven"
];

export default function NuevaTiendaPage() {
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
  const [brands, setBrands] = useState<string[]>([]);

  const handleToggleCategory = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleToggleBrand = (brand: string) => {
    setBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      await addStore(user.uid, {
        name,
        phone,
        address,
        categories,
        brands,
        notes,
        isPublic,
        ownerUid: user.uid,
      });
      router.push("/directorio");
    } catch (error) {
      console.error("Error adding store:", error);
      alert("Hubo un error al guardar la tienda.");
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
        <h1 className="text-xl font-bold text-foreground">Agendar Tienda de Repuestos</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 mt-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Nombre del Local / Casa de Repuestos</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. MotoParts Centro"
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
            <label className="text-xs text-zinc-400">Dirección</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
              placeholder="Ej. Av. Pueyrredón 1234, CABA"
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

          {/* Brands Multiple Selection */}
          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400">Marcas principales que trabajan</label>
            <div className="flex flex-wrap gap-2">
              {BRANDS_OPTIONS.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleToggleBrand(brand)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    brands.includes(brand) 
                      ? "bg-primary/20 border-primary text-primary font-medium" 
                      : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {brand}
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
              placeholder="Ej. Tienen buenos precios en baterías Yuasa."
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
