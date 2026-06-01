"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeToMaintenanceRecords, deleteMaintenanceRecord, MaintenanceRecord, subscribeToUserProfile, UserProfile, updateMaintenanceRecord, updateBike } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Plus, Trash2, X, Sparkles, Edit, Calendar, DollarSign, Wrench, Shield, Check } from "lucide-react";
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
  { id: 'bateria', name: 'Batería', dbCat: 'Batería', icon: '/bateria.png', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { id: 'clutch', name: 'Clutch', dbCat: 'Clutch', icon: '/clutch.png', color: 'border-red-500/30 bg-red-500/5' },
];

const BATTERY_TYPES = ["AGM / VRLA", "Gel", "Ácido-Plomo Convencional", "Litio / LiFePO4"];
const BATTERY_MODELS = [
  "YTX4L-BS / YTZ5S (Motos 110cc/Scooters)",
  "YTX7L-BS (Motos 150CC a 250cc)",
  "YTX9-BS (Motos 300cc a 400cc)",
  "YT12A-BS / YTZ10S (Motos Deportivas, Touring)",
  "YTX14-BS (Alta cilindrada, Adventure grandes)",
  "12N5-3B (Motos antiguas)",
  "Otro"
];

export default function MaintenancesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Detail & Edit Modal states
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<MaintenanceRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [editDate, setEditDate] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editType, setEditType] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSparkPlugCode, setEditSparkPlugCode] = useState("");
  const [editFrontTire, setEditFrontTire] = useState("");
  const [editRearTire, setEditRearTire] = useState("");
  const [editTransmissionPitch, setEditTransmissionPitch] = useState("");
  const [editBatteryType, setEditBatteryType] = useState("");
  const [editBatteryModel, setEditBatteryModel] = useState("");
  const [editCustomBatteryModel, setEditCustomBatteryModel] = useState("");

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
 
  // Retroactively auto-populate notes for existing records in background
  useEffect(() => {
    if (!user || records.length === 0) return;

    const runRetroactiveUpdate = async () => {
      for (const record of records) {
        if (!record.id) continue;

        // Skip if notes already has customized manual content
        // We only upgrade if empty or if it has the generic sub-record text
        const isGenericOrEmpty = !record.notes || 
          record.notes === "Registrado automáticamente vía Service General." ||
          (record.category === "Batería" && (record.notes.includes("Marca: Cambio Batería") || record.notes.includes("Marca: Revisión Batería")));
        if (!isGenericOrEmpty) continue;

        const updates: Partial<MaintenanceRecord> = {};

        // 0. Clean legacy title for battery if polluted with "Cambio Batería"
        if (record.category === "Batería" && record.type) {
          let cleanType = record.type;
          if (cleanType.includes("Cambio Batería")) cleanType = cleanType.replace("Cambio Batería", "").replace("  ", " ").trim();
          if (cleanType.includes("Revisión Batería")) cleanType = cleanType.replace("Revisión Batería", "").replace("  ", " ").trim();
          if (cleanType !== record.type) {
             updates.type = cleanType;
          }
        }

        // 1. Assign parentRecordId if it's an old sub-record without one
        if (!record.parentRecordId && record.notes === "Registrado automáticamente vía Service General.") {
          const parent = records.find(r => r.category === "General" && r.date === record.date && r.mileage === record.mileage);
          if (parent && parent.id) {
            updates.parentRecordId = parent.id;
          }
        }

        // 2. Generate and assign autoNotes
        const autoNotes = getRetroactiveNotesForRecord(record, records);
        if (autoNotes && autoNotes !== record.notes) {
          updates.notes = autoNotes;
        }

        if (Object.keys(updates).length > 0) {
          try {
            await updateMaintenanceRecord(user.uid, record.id, updates);
          } catch (err) {
            console.error("Error updating retroactive notes:", err);
          }
        }
      }
    };

    runRetroactiveUpdate();
  }, [records, user]);

  const getRetroactiveNotesForRecord = (record: MaintenanceRecord, allRecords: MaintenanceRecord[]) => {
    let parts: string[] = [];
    const cat = record.category;
    
    if (cat === "Aceite") {
      if (record.type) {
        parts.push(`Aceite: ${record.type}`);
      }
    } else if (cat === "Bujías") {
      if (record.type) {
        const code = record.sparkPlugCode ? ` - Código: ${record.sparkPlugCode}` : "";
        parts.push(`Bujía: ${record.type}${code}`);
      }
    } else if (cat === "Cubiertas") {
      if (record.type) {
        const fSize = record.frontTire || "Sin cambio";
        const rSize = record.rearTire || "Sin cambio";
        parts.push(`Cubiertas - Marca: ${record.type} | Delantera: ${fSize} | Trasera: ${rSize}`);
      }
    } else if (cat === "Transmisión") {
      if (record.type && record.type.startsWith("Cambio de Kit Completo")) {
        const brand = record.type.replace("Cambio de Kit Completo: ", "");
        parts.push(`Transmisión - Kit Completo: ${brand} | Paso: ${record.transmissionPitch || "No especificado"} | Cadena: ${record.transmissionRingType || "No especificada"}`);
      } else if (record.type === "Lubricación de Cadena" || record.type === "Lubricación y Ajuste de Cadena") {
        parts.push(`Transmisión - Ajuste y Lubricación de Cadena`);
      }
    } else if (cat === "Batería") {
      let brand = record.batteryBrand || "";
      if (brand === "Cambio Batería" || brand === "Revisión Batería") brand = "";
      const type = record.batteryType || "";
      const model = record.batteryModel || "";
      if (brand || type || model) {
        parts.push(`Batería - Marca: ${brand || "No especificada"} | Tipo: ${type} | Modelo: ${model || "No especificado"}`);
      }
    } else if (cat === "Clutch") {
      if (record.type) {
        parts.push(`Embrague: ${record.type}`);
      }
    } else if (cat === "General") {
      const subRecords = allRecords.filter(r => 
        r.parentRecordId === record.id || 
        (r.notes === "Registrado automáticamente vía Service General." && 
         r.mileage === record.mileage && 
         r.date === record.date)
      );
      if (subRecords.length > 0) {
        parts.push("Service General:");
        subRecords.forEach(sub => {
          parts.push(`  - ${sub.type}`);
        });
      }
    }
    
    return parts.join("\n");
  };

  const syncBikeMileageAndLube = async (updatedRecords: MaintenanceRecord[]) => {
    if (!user || !profile?.currentBikeId) return;
    try {
      const bikeRecords = updatedRecords.filter(r => r.bikeId === profile.currentBikeId);
      
      // 1. Get max mileage across all records for this bike
      const maxMileage = bikeRecords.reduce((max, r) => r.mileage > max ? r.mileage : max, 0);
      
      // 2. Get latest transmission lube mileage for this bike
      const transmissionRecords = bikeRecords.filter(r => r.category === "Transmisión");
      const latestTransLubeMileage = transmissionRecords.reduce((max, r) => r.mileage > max ? r.mileage : max, 0);
      
      const updates: any = {};
      if (maxMileage > 0) {
        updates.mileage = maxMileage;
      }
      if (latestTransLubeMileage > 0) {
        updates.lastChainLubeMileage = latestTransLubeMileage;
      } else if (transmissionRecords.length === 0) {
        // If all transmission records were deleted, reset it to 0
        updates.lastChainLubeMileage = 0;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateBike(user.uid, profile.currentBikeId, updates);
      }
    } catch (err) {
      console.error("Error syncing bike mileage/lube:", err);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("¿Estás seguro de que querés eliminar este registro de mantenimiento?");
    if (!confirmDelete) return;

    try {
      await deleteMaintenanceRecord(user.uid, recordId);
      // Si es un Service General, eliminar tambien todos sus sub-registros vinculados
      const nestedSubRecords = records.filter(r => 
        r.parentRecordId === recordId ||
        (r.notes === "Registrado automáticamente vía Service General." && 
         r.mileage === selectedRecordForDetails?.mileage && 
         r.date === selectedRecordForDetails?.date)
      );
      for (const sub of nestedSubRecords) {
        if (sub.id) {
          await deleteMaintenanceRecord(user.uid, sub.id);
        }
      }

      if (selectedRecordForDetails?.id === recordId) {
        setSelectedRecordForDetails(null);
      }
      
      // Recalculate bike stats with the remaining records
      const remainingRecords = records.filter(r => 
        r.id !== recordId && 
        r.parentRecordId !== recordId && 
        !(r.notes === "Registrado automáticamente vía Service General." && r.mileage === selectedRecordForDetails?.mileage && r.date === selectedRecordForDetails?.date)
      );
      await syncBikeMileageAndLube(remainingRecords);
    } catch (error) {
      console.error("Error al eliminar mantenimiento:", error);
      alert("No se pudo eliminar el registro. Intentalo de nuevo.");
    }
  };

  const startEditing = (record: MaintenanceRecord) => {
    setEditDate(record.date);
    setEditMileage(record.mileage.toString());
    setEditCost(record.cost.toString());
    setEditType(record.type || "");
    setEditNotes(record.notes || "");
    setEditSparkPlugCode(record.sparkPlugCode || "");
    setEditFrontTire(record.frontTire || "");
    setEditRearTire(record.rearTire || "");
    setEditTransmissionPitch(record.transmissionPitch || "");
    setEditBatteryType(record.batteryType || "");
    
    const modelVal = record.batteryModel || "";
    if (modelVal === "") {
      setEditBatteryModel("");
      setEditCustomBatteryModel("");
    } else if (BATTERY_MODELS.slice(0, -1).includes(modelVal)) {
      setEditBatteryModel(modelVal);
      setEditCustomBatteryModel("");
    } else {
      setEditBatteryModel("Otro");
      setEditCustomBatteryModel(modelVal);
    }
    
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!user || !selectedRecordForDetails || !selectedRecordForDetails.id) return;
    
    try {
      const updates: Partial<MaintenanceRecord> = {
        date: editDate,
        mileage: parseInt(editMileage) || 0,
        cost: parseInt(editCost) || 0,
        type: editType,
        notes: editNotes,
      };
      
      if (selectedRecordForDetails.category === "Bujías") {
        updates.sparkPlugCode = editSparkPlugCode;
      }
      if (selectedRecordForDetails.category === "Cubiertas") {
        updates.frontTire = editFrontTire;
        updates.rearTire = editRearTire;
      }
      if (selectedRecordForDetails.category === "Transmisión") {
        updates.transmissionPitch = editTransmissionPitch;
      }
      if (selectedRecordForDetails.category === "Batería") {
        updates.batteryType = editBatteryType;
        updates.batteryModel = editBatteryModel === "Otro" ? editCustomBatteryModel : editBatteryModel;
      }
      
      await updateMaintenanceRecord(user.uid, selectedRecordForDetails.id, updates);
      
      // Update local view inside the modal
      setSelectedRecordForDetails(prev => prev ? { ...prev, ...updates } : null);
      setIsEditing(false);

      // Recalculate bike stats with edited records list
      const updatedList = records.map(r => r.id === selectedRecordForDetails.id ? { ...r, ...updates } : r);
      await syncBikeMileageAndLube(updatedList);
    } catch (err) {
      console.error("Error updating record:", err);
      alert("Hubo un error al guardar los cambios.");
    }
  };

  const getRecordIcon = (record: MaintenanceRecord) => {
    const cat = record.category;
    const typeLower = (record.type || "").toLowerCase();
    
    if (cat === "General") return "/general.png";
    if (cat === "Aceite") return "/aceite.png";
    if (cat === "Bujías") return "/bujias.png";
    if (cat === "Cubiertas") return "/cubiertas.png";
    if (cat === "Transmisión") return "/transmision.png";
    if (cat === "Batería") return "/bateria.png";
    if (cat === "Clutch") return "/clutch.png";
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-primary text-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-95 transition-all w-28 justify-center text-center"
          >
            <Plus size={14} /> Registrar
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
                onClick={() => setSelectedRecordForDetails(record)}
                className="rounded-2xl border border-white/5 bg-zinc-900/20 p-4 flex gap-4 hover:border-white/10 transition-colors cursor-pointer active:scale-[0.99]"
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
                        <p className="text-xs text-zinc-400 italic line-clamp-1">"{record.notes}"</p>
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
                      onClick={(e) => {
                        e.stopPropagation(); // Evita abrir detalles
                        handleDelete(record.id!);
                      }}
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

      {/* Detail / Edit Drawer Modal Overlay */}
      {selectedRecordForDetails && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto pb-8 relative text-white">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center p-2 shadow-inner flex-shrink-0">
                  <img 
                    src={getRecordIcon(selectedRecordForDetails)} 
                    alt="Category Icon" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">{selectedRecordForDetails.category}</h3>
                  <h2 className="text-xl font-extrabold text-white truncate max-w-[220px]">
                    {isEditing ? "Editar Registro" : selectedRecordForDetails.type}
                  </h2>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setSelectedRecordForDetails(null);
                  setIsEditing(false);
                }} 
                className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Título / Tipo de Trabajo</label>
                  <input 
                    type="text" 
                    value={editType} 
                    onChange={(e) => setEditType(e.target.value)} 
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Fecha</label>
                    <input 
                      type="date" 
                      value={editDate} 
                      onChange={(e) => setEditDate(e.target.value)} 
                      className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none [color-scheme:dark]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Kilometraje (km)</label>
                    <input 
                      type="number" 
                      value={editMileage} 
                      onChange={(e) => setEditMileage(e.target.value)} 
                      className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Costo (ARS)</label>
                  <input 
                    type="number" 
                    value={editCost} 
                    onChange={(e) => setEditCost(e.target.value)} 
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                  />
                </div>

                {/* Specific field edits */}
                {selectedRecordForDetails.category === "Bujías" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Código de Bujía</label>
                    <input 
                      type="text" 
                      value={editSparkPlugCode} 
                      onChange={(e) => setEditSparkPlugCode(e.target.value)} 
                      className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                    />
                  </div>
                )}
                {selectedRecordForDetails.category === "Cubiertas" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400">Medida Delantera</label>
                      <input 
                        type="text" 
                        value={editFrontTire} 
                        onChange={(e) => setEditFrontTire(e.target.value)} 
                        className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400">Medida Trasera</label>
                      <input 
                        type="text" 
                        value={editRearTire} 
                        onChange={(e) => setEditRearTire(e.target.value)} 
                        className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                      />
                    </div>
                  </div>
                )}
                {selectedRecordForDetails.category === "Transmisión" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400">Paso de Cadena</label>
                    <input 
                      type="text" 
                      value={editTransmissionPitch} 
                      onChange={(e) => setEditTransmissionPitch(e.target.value)} 
                      className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                    />
                  </div>
                )}
                {selectedRecordForDetails.category === "Batería" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400">Tipo / Tecnología</label>
                        <select 
                          value={editBatteryType} 
                          onChange={(e) => setEditBatteryType(e.target.value)} 
                          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none appearance-none"
                        >
                          <option value="">Seleccionar...</option>
                          {BATTERY_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400">Modelo (Código)</label>
                        <select 
                          value={editBatteryModel} 
                          onChange={(e) => setEditBatteryModel(e.target.value)} 
                          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none appearance-none"
                        >
                          <option value="">Seleccionar...</option>
                          {BATTERY_MODELS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {editBatteryModel === "Otro" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400">Especifique Modelo</label>
                        <input 
                          type="text" 
                          value={editCustomBatteryModel} 
                          onChange={(e) => setEditCustomBatteryModel(e.target.value)} 
                          className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none" 
                          placeholder="Ej. YTX5L-BS"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400">Notas / Observaciones</label>
                  <textarea 
                    value={editNotes} 
                    onChange={(e) => setEditNotes(e.target.value)} 
                    rows={3}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none resize-none" 
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="flex-1 py-3.5 bg-zinc-800 text-white font-bold rounded-xl active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveEdit} 
                    className="flex-1 py-3.5 bg-primary text-black font-extrabold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check size={18} /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Visual Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Calendar size={18} className="text-zinc-500 mb-1" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Fecha</span>
                    <span className="text-xs font-bold text-white mt-0.5">{new Date(selectedRecordForDetails.date + 'T00:00:00').toLocaleDateString()}</span>
                  </div>
                  <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Wrench size={18} className="text-primary mb-1" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Kilómetros</span>
                    <span className="text-xs font-bold text-white mt-0.5">{selectedRecordForDetails.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
                    <DollarSign size={18} className="text-emerald-500 mb-1" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Costo</span>
                    <span className="text-xs font-black text-white mt-0.5">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(selectedRecordForDetails.cost)}
                    </span>
                  </div>
                </div>

                {/* Subdetails Panel */}
                {(selectedRecordForDetails.sparkPlugCode || selectedRecordForDetails.frontTire || selectedRecordForDetails.rearTire || selectedRecordForDetails.transmissionPitch || selectedRecordForDetails.batteryType || selectedRecordForDetails.batteryModel) && (
                  <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ficha Técnica</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {selectedRecordForDetails.sparkPlugCode && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Bujía código:</span>
                          <span className="text-white font-bold font-mono">{selectedRecordForDetails.sparkPlugCode}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.frontTire && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Medida Delantera:</span>
                          <span className="text-white font-bold">{selectedRecordForDetails.frontTire}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.rearTire && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Medida Trasera:</span>
                          <span className="text-white font-bold">{selectedRecordForDetails.rearTire}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.transmissionPitch && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Paso Transmisión:</span>
                          <span className="text-white font-bold">{selectedRecordForDetails.transmissionPitch}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.transmissionRingType && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Retenes Cadena:</span>
                          <span className="text-white font-bold text-xs truncate max-w-[180px]">{selectedRecordForDetails.transmissionRingType}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.batteryBrand && selectedRecordForDetails.batteryBrand !== "Cambio Batería" && selectedRecordForDetails.batteryBrand !== "Revisión Batería" && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Marca:</span>
                          <span className="text-white font-bold text-xs truncate max-w-[180px]">{selectedRecordForDetails.batteryBrand}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.batteryType && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Tecnología:</span>
                          <span className="text-white font-bold text-xs truncate max-w-[180px]">{selectedRecordForDetails.batteryType}</span>
                        </div>
                      )}
                      {selectedRecordForDetails.batteryModel && (
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-zinc-500 font-medium">Modelo:</span>
                          <span className="text-white font-bold text-xs truncate max-w-[180px]">{selectedRecordForDetails.batteryModel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                 {/* Notes Block */}
                 <div className="space-y-2">
                   <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Notas / Observaciones</h4>
                   <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-2xl text-sm leading-relaxed text-zinc-300 italic min-h-[80px]">
                     {selectedRecordForDetails.notes ? `"${selectedRecordForDetails.notes}"` : "Sin anotaciones en este registro."}
                   </div>
                 </div>

                {/* Footer Controls */}
                <div className="flex gap-3 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => handleDelete(selectedRecordForDetails.id!)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-500 font-bold rounded-xl active:scale-95 transition-all text-sm"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                  
                  <button 
                    onClick={() => startEditing(selectedRecordForDetails)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3.5 bg-primary text-black font-extrabold rounded-xl active:scale-95 transition-all text-sm"
                  >
                    <Edit size={16} /> Editar Información
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
