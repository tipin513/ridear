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
import { Plus, MapPin, Phone, Trash2, Globe, Lock, Search, Wrench, Truck, Store as StoreIcon, Tag, Shirt, BookOpen, FileText } from "lucide-react";
import Link from "next/link";

type ResourceType = "talleres" | "gruas" | "tiendas" | "indumentaria" | "manuales";
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
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  const MOTORCYCLE_BRANDS = [
    "Honda", "Motomel", "Corven", "Zanella", "Gilera", "Bajaj", "Yamaha", 
    "Mondial", "Keller", "Guerrero", "Benelli", "KTM", "Royal Enfield", 
    "Suzuki", "Kawasaki", "TVS", "CFMoto", "Voge", "Husqvarna", "BMW", 
    "Ducati", "Triumph", "Harley-Davidson"
  ].sort();

  const MOCK_SHARED_MANUALS = [
    { id: '1', brand: 'Honda', model: 'CB300F Twister', year: '2023', url: '#', sharedBy: 'Juan Perez' },
    { id: '2', brand: 'Yamaha', model: 'MT-03', year: '2021', url: '#', sharedBy: 'Carlos M.' },
    { id: '3', brand: 'Honda', model: 'Tornado 250', year: '2019', url: '#', sharedBy: 'Matias R.' },
    { id: '4', brand: 'Benelli', model: 'TRK 502', year: '2022', url: '#', sharedBy: 'Diego A.' },
    { id: '5', brand: 'Royal Enfield', model: 'Interceptor 650', year: '2023', url: '#', sharedBy: 'Luis G.' },
  ];

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
          <button 
            onClick={() => { setResourceType("manuales"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-semibold border ${resourceType === "manuales" ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-zinc-400"}`}
          >
            <BookOpen size={16} /> Manuales
          </button>
        </div>

        {/* Segmented Control */}
        {resourceType !== "manuales" && (
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
        )}
      </header>

      <div className="px-4 mt-4 flex-1">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder={`Buscar en ${resourceType === "talleres" ? "talleres" : resourceType === "gruas" ? "asistencias" : resourceType === "tiendas" ? "tiendas" : resourceType === "indumentaria" ? "indumentaria" : "manuales"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {resourceType === "manuales" ? (
          <div className="space-y-3 mt-4 pb-10">
            {MOTORCYCLE_BRANDS.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase())).map(brand => {
              const brandManuals = MOCK_SHARED_MANUALS.filter(m => m.brand === brand);
              const count = brandManuals.length;
              const isExpanded = expandedBrand === brand;

              return (
                <div key={brand} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setExpandedBrand(isExpanded ? null : brand)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${count > 0 ? 'bg-primary/20 text-primary' : 'bg-zinc-800/80 text-zinc-600'}`}>
                        <BookOpen size={18} />
                      </div>
                      <span className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{brand}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${count > 0 ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50'}`}>
                      {count} {count === 1 ? 'manual' : 'manuales'}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 border-t border-zinc-800/50 bg-black/20 space-y-3">
                      {count === 0 ? (
                        <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800/50">
                          <BookOpen className="w-10 h-10 mx-auto mb-3 text-zinc-700 opacity-50" />
                          <p className="text-zinc-400 font-medium">Aún no hay manuales para {brand}</p>
                          <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] mx-auto">Sé el primero en aportar a la comunidad compartiéndolo desde tu Garage.</p>
                        </div>
                      ) : (
                        brandManuals.map(manual => (
                          <div key={manual.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-primary/30 transition-all hover:shadow-[0_4px_20px_rgba(255,255,255,0.03)] group/item cursor-pointer">
                            <div>
                              <p className="font-bold text-zinc-200 group-hover/item:text-primary transition-colors">{manual.model}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">AÑO {manual.year}</span>
                                <span className="text-[9px] text-zinc-500">Por: <span className="text-zinc-400">{manual.sharedBy}</span></span>
                              </div>
                            </div>
                            <a href={manual.url} target="_blank" className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-black border border-primary/20 hover:border-primary transition-all shadow-sm">
                              <FileText size={16} />
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : filteredList.length === 0 ? (
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
            {filteredList.map((item) => {
              // Custom category badges/styles based on the active resource type
              const getCategoryBadge = () => {
                switch (resourceType) {
                  case "talleres":
                    return { icon: <Wrench size={14} />, label: "Taller", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
                  case "gruas":
                    return { icon: <Truck size={14} />, label: "Asistencia", color: "text-red-400 bg-red-500/10 border-red-500/20" };
                  case "tiendas":
                    return { icon: <StoreIcon size={14} />, label: "Repuestos", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
                  case "indumentaria":
                    return { icon: <Shirt size={14} />, label: "Indumentaria", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
                }
              };
              const badge = getCategoryBadge();

              return (
                <div 
                  key={item.id} 
                  className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 flex flex-col gap-4 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-primary/5 group"
                >
                  {/* Glowing subtle background highlight */}
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-300" />
                  
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </span>
                        {item.area && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                            📍 {item.area}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors duration-200 mt-1">
                        {item.name}
                      </h3>
                      {item.specialty && (
                        <p className="text-xs font-semibold text-primary/95 tracking-wide mt-0.5">
                          ✨ {item.specialty}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {item.isPublic ? (
                        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Comunidad
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-850 px-2.5 py-1 rounded-full">
                          <Lock size={10} /> Privado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Contact & Location Capsules */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {/* Interactive Phone Capsule */}
                    {item.phone && (
                      <a 
                        href={`tel:${item.phone}`} 
                        className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 hover:bg-emerald-500/10 border border-zinc-800/60 hover:border-emerald-500/30 transition-all duration-200 group/phone cursor-pointer"
                        title="Tocar para llamar"
                      >
                        <div className="p-2 rounded-lg bg-zinc-900 group-hover/phone:bg-emerald-500/20 text-zinc-500 group-hover/phone:text-emerald-400 border border-zinc-800/80 group-hover/phone:border-emerald-500/20 transition-all">
                          <Phone size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Teléfono</p>
                          <p className="text-sm text-zinc-200 group-hover/phone:text-emerald-400 font-bold truncate transition-colors">
                            {item.phone}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-1 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 group-hover/phone:bg-emerald-500 group-hover/phone:text-black group-hover/phone:border-emerald-400 transition-all whitespace-nowrap">
                          LLAMAR ↗
                        </span>
                      </a>
                    )}

                    {/* Interactive Google Maps Capsule */}
                    {item.address && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 hover:bg-primary/10 border border-zinc-800/60 hover:border-primary/30 transition-all duration-200 group/address cursor-pointer"
                        title="Tocar para abrir en Google Maps"
                      >
                        <div className="p-2 rounded-lg bg-zinc-900 group-hover/address:bg-primary/20 text-zinc-500 group-hover/address:text-primary border border-zinc-800/80 group-hover/address:border-primary/20 transition-all">
                          <MapPin size={15} className="group-hover/address:animate-bounce" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Dirección</p>
                          <p className="text-sm text-zinc-200 group-hover/address:text-primary font-bold truncate transition-colors">
                            {item.address}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-1 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 group-hover/address:bg-primary group-hover/address:text-black group-hover/address:border-primary transition-all whitespace-nowrap">
                          VER MAPA 🗺️
                        </span>
                      </a>
                    )}
                  </div>

                  {/* Badges / Tags */}
                  {(item.categories && item.categories.length > 0) || (item.brands && item.brands.length > 0) ? (
                    <div className="flex flex-col gap-2 pt-1 border-t border-zinc-900/50">
                      {item.categories && item.categories.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag size={12} className="text-zinc-500 flex-shrink-0" />
                          {item.categories.map((cat: string) => (
                            <span key={cat} className="text-[10px] font-semibold bg-zinc-900 border border-zinc-850 text-zinc-300 px-2.5 py-0.5 rounded-full">{cat}</span>
                          ))}
                        </div>
                      )}
                      {item.brands && item.brands.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-zinc-600 flex-shrink-0">MARCAS:</span>
                          {item.brands.map((brand: string) => (
                            <span key={brand} className="text-[10px] font-medium border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded-full">{brand}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Notes */}
                  {item.notes && (
                    <div className="text-sm text-zinc-400 bg-zinc-950 border border-zinc-900/80 p-3.5 rounded-xl italic leading-relaxed relative">
                      <span className="absolute -top-2 left-3 bg-zinc-950 px-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest border border-zinc-900 rounded-full">Observaciones</span>
                      "{item.notes}"
                    </div>
                  )}

                  {/* Actions (Only in Saved items tab) */}
                  {activeTab === "mis-guardados" && (
                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-zinc-900/80">
                      <button 
                        onClick={() => handleToggleVisibility(item)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-all border flex items-center gap-1.5 active:scale-95 ${item.isPublic ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800" : "bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 hover:border-primary/45"}`}
                      >
                        {item.isPublic ? <Lock size={12} /> : <Globe size={12} />}
                        {item.isPublic ? "Hacer Privado" : "Hacer Público"}
                      </button>
                      {item.id && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all active:scale-90"
                          title="Eliminar"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab === "mis-guardados" && resourceType !== "manuales" && (
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
