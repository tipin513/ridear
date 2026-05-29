"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeToWorkshops, subscribeToPublicWorkshops, deleteWorkshop, updateWorkshop, Workshop } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Plus, MapPin, Phone, Trash2, Globe, Lock, Search } from "lucide-react";
import Link from "next/link";

export default function TalleresPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"mis-mecanicos" | "comunidad">("mis-mecanicos");
  const [myWorkshops, setMyWorkshops] = useState<Workshop[]>([]);
  const [publicWorkshops, setPublicWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    let unsubPrivate: (() => void) | undefined;
    let unsubPublic: (() => void) | undefined;

    if (user) {
      unsubPrivate = subscribeToWorkshops(user.uid, (data) => {
        setMyWorkshops(data);
        if (activeTab === "mis-mecanicos") setLoading(false);
      });

      unsubPublic = subscribeToPublicWorkshops((data) => {
        setPublicWorkshops(data);
        if (activeTab === "comunidad") setLoading(false);
      });
    }

    return () => {
      if (unsubPrivate) unsubPrivate();
      if (unsubPublic) unsubPublic();
    };
  }, [user, authLoading, router, activeTab]);

  const handleDelete = async (workshopId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("¿Estás seguro de que querés eliminar este taller?");
    if (!confirmDelete) return;

    try {
      await deleteWorkshop(user.uid, workshopId);
    } catch (error) {
      console.error("Error al eliminar taller:", error);
      alert("No se pudo eliminar el taller. Intentalo de nuevo.");
    }
  };

  const handleToggleVisibility = async (workshop: Workshop) => {
    if (!user || !workshop.id) return;
    try {
      await updateWorkshop(user.uid, workshop.id, { isPublic: !workshop.isPublic });
    } catch (error) {
      console.error("Error al actualizar visibilidad:", error);
      alert("No se pudo actualizar el taller.");
    }
  };

  if (authLoading || (!user)) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  // Filter logic
  const currentList = activeTab === "mis-mecanicos" ? myWorkshops : publicWorkshops;
  const filteredList = currentList.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <header className="sticky top-0 z-10 flex flex-col bg-background/90 px-4 pt-4 pb-2 backdrop-blur-md border-b border-border">
        <h1 className="text-xl font-bold text-foreground mb-4">Directorio de Talleres</h1>
        
        {/* Segmented Control */}
        <div className="flex p-1 bg-zinc-900 rounded-lg">
          <button 
            onClick={() => { setActiveTab("mis-mecanicos"); setSearchQuery(""); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "mis-mecanicos" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Mis Mecánicos
          </button>
          <button 
            onClick={() => { setActiveTab("comunidad"); setSearchQuery(""); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "comunidad" ? "bg-primary text-primary-foreground shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Comunidad
          </button>
        </div>
      </header>

      <div className="px-4 mt-4 flex-1">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === "mis-mecanicos" ? "Buscar en tus talleres..." : "Buscar talleres compartidos..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center mt-6">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {searchQuery ? "No se encontraron resultados" : (activeTab === "mis-mecanicos" ? "Sin mecánicos agendados" : "Sin talleres comunitarios")}
            </h3>
            <p className="text-sm text-zinc-400 mt-2 mb-6">
              {searchQuery ? "Intentá con otras palabras clave." : (activeTab === "mis-mecanicos" ? "Guardá acá los talleres de confianza para tenerlos siempre a mano." : "Nadie ha compartido talleres todavía. ¡Sé el primero en aportar!")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((workshop) => (
              <div key={workshop.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 group hover:border-zinc-700 transition-colors">
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{workshop.name}</h3>
                    <p className="text-sm font-medium text-primary mt-0.5">{workshop.specialty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workshop.isPublic ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-green-500/20 text-green-400 px-2 py-1 rounded-md">
                        <Globe size={12} /> Público
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">
                        <Lock size={12} /> Privado
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Phone size={16} className="text-zinc-500 flex-shrink-0" />
                    <a href={`tel:${workshop.phone}`} className="hover:text-primary transition-colors">{workshop.phone}</a>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <MapPin size={16} className="text-zinc-500 flex-shrink-0" />
                    <span>{workshop.address}</span>
                  </div>
                </div>

                {workshop.notes && (
                  <div className="mt-2 text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-lg italic border border-zinc-800/50">
                    "{workshop.notes}"
                  </div>
                )}

                {/* Acciones: Solo mostrar si soy el dueño (mis-mecanicos) */}
                {activeTab === "mis-mecanicos" && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                    <button 
                      onClick={() => handleToggleVisibility(workshop)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${workshop.isPublic ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                    >
                      {workshop.isPublic ? "Hacer Privado" : "Hacer Público"}
                    </button>
                    {workshop.id && (
                      <button
                        onClick={() => handleDelete(workshop.id!)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar taller"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab === "mis-mecanicos" && (
        <Link 
          href="/talleres/nuevo"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-90"
        >
          <Plus size={28} />
        </Link>
      )}

      <BottomNav />
    </div>
  );
}
