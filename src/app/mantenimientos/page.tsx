"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeToMaintenanceRecords, deleteMaintenanceRecord, MaintenanceRecord, subscribeToUserProfile, UserProfile } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Plus, Trash2, ChevronRight, X, Sparkles } from "lucide-react";
import Link from "next/link";

const categoriesList = [
  { id: 'bujias', name: 'Bujías', dbCat: 'Bujías', icon: '/bujias.png', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'cubiertas', name: 'Cubiertas', dbCat: 'Cubiertas', icon: '/cubiertas.png', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { id: 'frenos', name: 'Frenos', dbCat: 'Desgaste', icon: '/frenos.png', color: 'border-sky-500/30 bg-sky-500/5', prefillType: 'Frenos' },
  { id: 'general', name: 'General', dbCat: 'General', icon: '/general.png', color: 'border-green-500/30 bg-green-500/5' },
  { id: 'liquidofrenos', name: 'Líq. Frenos', dbCat: 'Fluidos', icon: '/liquidofrenos.png', color: 'border-cyan-500/30 bg-cyan-500/5', prefillType: 'Líquido de Frenos' },
  { id: 'refrigerante', name: 'Refrigerante', dbCat: 'Fluidos', icon: '/refrigerante.png', color: 'border-emerald-500/30 bg-emerald-500/5', prefillType: 'Líquido Refrigerante' },
  { id: 'transmision', name: 'Transmisión', dbCat: 'Transmisión', icon: '/transmision.png', color: 'border-orange-500/30 bg-orange-500/5' },
  { id: 'aceite', name: 'Aceite', dbCat: 'Aceite', icon: '/aceite.png', color: 'border-indigo-500/30 bg-indigo-500/5' },
];

export default function MaintenancesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    let unsubRecords: (() => void) | undefined;
    let unsubProfile: (() => void) | undefined;

    if (user) {
      unsubProfile = subscribeToUserProfile(user.uid, (data) => {
        setProfile(data);
      });

      unsubRecords = subscribeToMaintenanceRecords(user.uid, (data) => {
        setRecords(data);
        setLoading(false);
      });
    }

    return () => {
      if (unsubRecords) unsubRecords();
      if (unsubProfile) unsubProfile();
    };
  }, [user, authLoading, router]);

  const handleDelete = async (recordId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("¿Estás seguro de que querés eliminar este registro de mantenimiento?");
    if (!confirmDelete) return;

    try {
      await deleteMaintenanceRecord(user.uid, recordId);
    } catch (error) {
      console.error("Error al eliminar mantenimiento:", error);
      alert("No se pudo eliminar el registro. Intentalo de nuevo.");
    }
  };

  const getRecordIcon = (record: MaintenanceRecord) => {
    const cat = record.category;
    const typeLower = (record.type || "").toLowerCase();
    
    if (cat === "Aceite") return "/aceite.png";
    if (cat === "Bujías") return "/bujias.png";
    if (cat === "Cubiertas") return "/cubiertas.png";
    if (cat === "Transmisión") return "/transmision.png";
    if (cat === "Desgaste" || typeLower.includes("freno") || typeLower.includes("pastilla")) return "/frenos.png";
    if (cat === "Fluidos") {
      if (typeLower.includes("refrigerante")) return "/refrigerante.png";
      return "/liquidofrenos.png";
    }
    return "/general.png";
  };

  if (authLoading || loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-zinc-400">
        Cargando bitácora...
      </div>
    );
  }

  const currentRecords = records.filter(r => r.bikeId === profile?.currentBikeId);

  const filteredRecords = selectedCategoryFilter 
    ? currentRecords.filter(r => {
        const catObj = categoriesList.find(c => c.id === selectedCategoryFilter);
        if (!catObj) return true;
        
        if (r.category !== catObj.dbCat) return false;
        
        if (catObj.id === 'liquidofrenos') {
          return !(r.type || "").toLowerCase().includes("refrigerante");
        }
        if (catObj.id === 'refrigerante') {
          return (r.type || "").toLowerCase().includes("refrigerante");
        }
        
        return true;
      })
    : currentRecords;

  const activeCategoryObj = categoriesList.find(c => c.id === selectedCategoryFilter);

  return (
    <div className="min-h-screen bg-background pb-28 text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bitácora</h1>
          <p className="text-xs text-zinc-400">Historial de mantenimientos de tu moto</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Categories Squircle Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Categorías</h2>
            {selectedCategoryFilter && (
              <button 
                onClick={() => setSelectedCategoryFilter(null)}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
              >
                <X size={12} /> Ver todas
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary/10 scale-95 shadow-md shadow-primary/10' 
                      : 'border-white/5 bg-zinc-900/40 hover:border-white/10 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1">
                    <img 
                      src={cat.icon} 
                      alt={cat.name} 
                      className={`w-full h-full object-contain transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                      onError={(e) => {
                        // Fallback in case user hasn't uploaded images to public folder yet
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tracking-tight text-center text-zinc-300 truncate w-full">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between border-t border-white/5 pt-6 px-1">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {activeCategoryObj ? `Historial: ${activeCategoryObj.name}` : "Todo el historial"}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {filteredRecords.length}
              </span>
            </h3>
          </div>
          
          <Link
            href={`/mantenimientos/nuevo${selectedCategoryFilter ? `?category=${selectedCategoryFilter}` : ""}`}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary text-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all"
          >
            <Plus size={14} /> Registrar {activeCategoryObj?.name || ""}
          </Link>
        </div>

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-white/5 bg-zinc-900/10">
            <Sparkles size={36} className="mb-3 text-zinc-600 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-400 mb-1">No hay registros</p>
            <p className="text-xs text-zinc-500 max-w-[240px] mb-4">
              {selectedCategoryFilter 
                ? `Aún no tenés mantenimientos registrados en la categoría ${activeCategoryObj?.name}.`
                : "Aún no tenés mantenimientos registrados para esta moto."}
            </p>
            <Link
              href={`/mantenimientos/nuevo${selectedCategoryFilter ? `?category=${selectedCategoryFilter}` : ""}`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
            >
              Agregar Primer Registro
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className="rounded-2xl border border-white/5 bg-zinc-900/20 p-4 flex gap-4 hover:border-white/10 transition-colors"
              >
                {/* 3D App Icon Badge */}
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
                  <img 
                    src={getRecordIcon(record)} 
                    alt="Category Icon" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">{record.type}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-semibold text-primary">{record.mileage.toLocaleString('es-AR')} km</span>
                  </div>
                  
                  {/* Dynamic sub-details */}
                  <div className="mt-3 space-y-1.5">
                    {record.sparkPlugCode && (
                      <div className="text-xs bg-zinc-900/60 border border-white/5 px-2.5 py-1 rounded-lg w-fit">
                        <span className="text-zinc-500 font-medium">Código:</span> <span className="text-zinc-300 font-semibold">{record.sparkPlugCode}</span>
                      </div>
                    )}
                    {(record.frontTire || record.rearTire) && (
                      <div className="text-xs bg-zinc-900/60 border border-white/5 px-2.5 py-1 rounded-lg flex flex-col gap-0.5 w-fit">
                        {record.frontTire && <p><span className="text-zinc-500 font-medium">Del:</span> <span className="text-zinc-300 font-semibold">{record.frontTire}</span></p>}
                        {record.rearTire && <p><span className="text-zinc-500 font-medium font-medium">Tras:</span> <span className="text-zinc-300 font-semibold">{record.rearTire}</span></p>}
                      </div>
                    )}
                    {record.transmissionPitch && (
                      <div className="text-xs bg-zinc-900/60 border border-white/5 px-2.5 py-1 rounded-lg flex flex-col gap-0.5 w-fit">
                        <p><span className="text-zinc-500 font-medium">Paso:</span> <span className="text-zinc-300 font-semibold">{record.transmissionPitch}</span></p>
                        {record.transmissionRingType && <p><span className="text-zinc-500 font-medium">Tipo:</span> <span className="text-zinc-300 font-semibold">{record.transmissionRingType}</span></p>}
                      </div>
                    )}
                    {record.notes && (
                      <div className="mt-2.5 pt-2.5 border-t border-white/5">
                        <p className="text-xs text-zinc-400 italic">"{record.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right flex flex-col justify-between items-end">
                  <span className="text-sm font-black text-white bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-lg">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(record.cost)}
                  </span>
                  {record.id && (
                    <button
                      onClick={() => handleDelete(record.id!)}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer mt-2"
                      title="Eliminar registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
