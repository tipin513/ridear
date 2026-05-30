"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  subscribeToWorkshops, subscribeToPublicWorkshops, deleteWorkshop, updateWorkshop, Workshop,
  subscribeToTowing, subscribeToPublicTowing, deleteTowing, updateTowing, Towing,
  subscribeToStores, subscribeToPublicStores, deleteStore, updateStore, Store,
  subscribeToGears, subscribeToPublicGears, deleteGear, updateGear, Gear
} from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Plus, MapPin, Phone, Trash2, Globe, Lock, Search, Wrench, Truck, Store as StoreIcon, Tag, Shirt } from "lucide-react";
import Link from "next/link";

type ResourceType = "talleres" | "gruas" | "tiendas" | "indumentaria";
type TabType = "mis-guardados" | "comunidad";

export default function DirectorioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [resourceType, setResourceType] = useState<ResourceType>("talleres");
  const [activeTab, setActiveTab] = useState<TabType>("mis-guardados");
  
  const [myWorkshops, setMyWorkshops] = useState<Workshop[]>([]);
  const [publicWorkshops, setPublicWorkshops] = useState<Workshop[]>([]);
  
  const [myTowings, setMyTowings] = useState<Towing[]>([]);
  const [publicTowings, setPublicTowings] = useState<Towing[]>([]);
  
  const [myStores, setMyStores] = useState<Store[]>([]);
  const [publicStores, setPublicStores] = useState<Store[]>([]);
  
  const [myGears, setMyGears] = useState<Gear[]>([]);
  const [publicGears, setPublicGears] = useState<Gear[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    let unsubscribers: (() => void)[] = [];

    if (user) {
      unsubscribers.push(subscribeToWorkshops(user.uid, (data) => setMyWorkshops(data)));
      unsubscribers.push(subscribeToPublicWorkshops((data) => setPublicWorkshops(data)));
      
      unsubscribers.push(subscribeToTowing(user.uid, (data) => setMyTowings(data)));
      unsubscribers.push(subscribeToPublicTowing((data) => setPublicTowings(data)));
      
      unsubscribers.push(subscribeToStores(user.uid, (data) => setMyStores(data)));
      unsubscribers.push(subscribeToPublicStores((data) => setPublicStores(data)));
      
      unsubscribers.push(subscribeToGears(user.uid, (data) => setMyGears(data)));
      unsubscribers.push(subscribeToPublicGears((data) => setPublicGears(data)));
      
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, authLoading, router]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("¿Estás seguro de que querés eliminar este registro?");
    if (!confirmDelete) return;

    try {
      if (resourceType === "talleres") await deleteWorkshop(user.uid, id);
      else if (resourceType === "gruas") await deleteTowing(user.uid, id);
      else if (resourceType === "tiendas") await deleteStore(user.uid, id);
      else if (resourceType === "indumentaria") await deleteGear(user.uid, id);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudo eliminar. Intentalo de nuevo.");
    }
  };

  const handleToggleVisibility = async (item: any) => {
    if (!user || !item.id) return;
    try {
      if (resourceType === "talleres") await updateWorkshop(user.uid, item.id, { isPublic: !item.isPublic });
      else if (resourceType === "gruas") await updateTowing(user.uid, item.id, { isPublic: !item.isPublic });
      else if (resourceType === "tiendas") await updateStore(user.uid, item.id, { isPublic: !item.isPublic });
      else if (resourceType === "indumentaria") await updateGear(user.uid, item.id, { isPublic: !item.isPublic });
    } catch (error) {
      console.error("Error al actualizar visibilidad:", error);
      alert("No se pudo actualizar.");
    }
  };

  if (authLoading || (!user)) {
    return <div className="flex h-screen items-center justify-center text-zinc-400">Cargando directorio...</div>;
  }

  // Determine current list
  let currentList: any[] = [];
  if (resourceType === "talleres") currentList = activeTab === "mis-guardados" ? myWorkshops : publicWorkshops;
  else if (resourceType === "gruas") currentList = activeTab === "mis-guardados" ? myTowings : publicTowings;
  else if (resourceType === "tiendas") currentList = activeTab === "mis-guardados" ? myStores : publicStores;
  else if (resourceType === "indumentaria") currentList = activeTab === "mis-guardados" ? myGears : publicGears;

  const filteredList = currentList.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const matchName = item.name?.toLowerCase().includes(searchLower);
    const matchAddress = item.address?.toLowerCase().includes(searchLower);
    const matchArea = item.area?.toLowerCase().includes(searchLower);
    const matchSpecialty = item.specialty?.toLowerCase().includes(searchLower);
    const matchCategories = item.categories?.some((c: string) => c.toLowerCase().includes(searchLower));
    return matchName || matchAddress || matchArea || matchSpecialty || matchCategories;
  });

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <header className="sticky top-0 z-10 flex flex-col bg-background/95 px-4 pt-4 pb-2 backdrop-blur-md border-b border-border">
        <h1 className="text-xl font-bold text-foreground mb-4">Directorio Motero</h1>
        
        {/* Resource Type Selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            onClick={() => { setResourceType("talleres"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${resourceType === "talleres" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-zinc-400"}`}
          >
            <Wrench size={16} /> Talleres
          </button>
          <button 
            onClick={() => { setResourceType("gruas"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${resourceType === "gruas" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-zinc-400"}`}
          >
            <Truck size={16} /> Asistencias
          </button>
          <button 
            onClick={() => { setResourceType("tiendas"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${resourceType === "tiendas" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-zinc-400"}`}
          >
            <StoreIcon size={16} /> Repuestos
          </button>
          <button 
            onClick={() => { setResourceType("indumentaria"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${resourceType === "indumentaria" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-zinc-400"}`}
          >
            <Shirt size={16} /> Indumentaria
          </button>
        </div>

        {/* Segmented Control */}
        <div className="flex p-1 bg-zinc-900/80 rounded-lg">
          <button 
            onClick={() => { setActiveTab("mis-guardados"); setSearchQuery(""); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "mis-guardados" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Mis Guardados
          </button>
          <button 
            onClick={() => { setActiveTab("comunidad"); setSearchQuery(""); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === "comunidad" ? "bg-primary text-primary-foreground shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
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
            placeholder={`Buscar en ${resourceType === "talleres" ? "talleres" : resourceType === "gruas" ? "asistencias" : resourceType === "tiendas" ? "tiendas" : "indumentaria"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 p-8 text-center mt-6">
            <div className="rounded-full bg-zinc-800 p-4 mb-4 text-zinc-400">
              {resourceType === "talleres" ? <Wrench size={32} /> : resourceType === "gruas" ? <Truck size={32} /> : resourceType === "tiendas" ? <StoreIcon size={32} /> : <Shirt size={32} />}
            </div>
            <h3 className="text-lg font-semibold text-foreground">No hay resultados</h3>
            <p className="text-sm text-zinc-500 mt-2">
              {activeTab === "mis-guardados" ? "Aún no guardaste nada en esta sección." : "Nadie ha compartido información aquí todavía."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 group">
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h3 className="text-lg font-bold text-foreground leading-tight">{item.name}</h3>
                    {item.specialty && <p className="text-sm font-medium text-primary mt-1">{item.specialty}</p>}
                    {item.area && <p className="text-sm font-medium text-amber-500 mt-1">{item.area}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {item.isPublic ? (
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

                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <Phone size={16} className="text-zinc-500 flex-shrink-0" />
                    <a href={`tel:${item.phone}`} className="hover:text-primary transition-colors">{item.phone}</a>
                  </div>
                  {item.address && (
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <MapPin size={16} className="text-zinc-500 flex-shrink-0" />
                      <span>{item.address}</span>
                    </div>
                  )}
                </div>

                {item.categories && item.categories.length > 0 && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Tag size={14} className="text-zinc-500" />
                    {item.categories.map((cat: string) => (
                      <span key={cat} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{cat}</span>
                    ))}
                  </div>
                )}
                {item.brands && item.brands.length > 0 && (
                  <div className="flex gap-2 mt-1 flex-wrap pl-5">
                    {item.brands.map((brand: string) => (
                      <span key={brand} className="text-[10px] border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">{brand}</span>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <div className="mt-2 text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-lg italic border border-zinc-800/50">
                    "{item.notes}"
                  </div>
                )}

                {/* Acciones */}
                {activeTab === "mis-guardados" && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
                    <button 
                      onClick={() => handleToggleVisibility(item)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${item.isPublic ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                    >
                      {item.isPublic ? "Hacer Privado" : "Hacer Público"}
                    </button>
                    {item.id && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Eliminar"
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
      {activeTab === "mis-guardados" && (
        <Link 
          href={`/directorio/${resourceType}/nuevo`}
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-90 z-20"
        >
          <Plus size={28} />
        </Link>
      )}

      <BottomNav />
    </div>
  );
}
