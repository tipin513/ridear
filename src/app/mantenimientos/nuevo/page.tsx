"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addMaintenanceRecord, getUserProfile, getBike, updateBike, MaintenanceCategory } from "@/lib/services";
import { ChevronLeft, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

const OIL_OPTIONS = [
  "Motul 3000 (Mineral) - 20W50", "Motul 5100 (Semi-sintético) - 15W50", "Motul 5100 (Semi-sintético) - 10W40",
  "Motul 7100 (100% Sintético) - 10W40", "Motul 7100 (100% Sintético) - 15W50", "Castrol Actevo (Semi-sintético) - 20W50",
  "Castrol Actevo (Semi-sintético) - 10W40", "Castrol Power 1 (100% Sintético) - 10W40", "Castrol Power 1 (100% Sintético) - 15W50",
  "Yamalube 4T (Mineral) - 20W50", "Yamalube 4T (Semi-sintético) - 10W40", "Ipone R4000 (Semi-sintético) - 10W40",
  "Ipone R4000 (Semi-sintético) - 15W50", "Ipone Katana (100% Sintético) - 10W40", "Ipone Katana (100% Sintético) - 15W50",
  "Ipone Katana (100% Sintético) - 10W50", "YPF Elaion Moto (Mineral) - 20W50", "YPF Elaion Moto (Semi-sintético) - 10W40", "Otro"
];

const SPARK_PLUG_OPTIONS = [
  "NGK Estándar (Cobre) - Resistencia Tradicional", "NGK Iridium (IX) - Alta Performance / Larga Duración",
  "NGK Laser Platinum - Premium / Máxima Durabilidad", "Bosch Estándar (Níquel) - Línea Tradicional",
  "Bosch Iridium - Mayor Estabilidad de Chispa", "Denso Estándar - Calidad Japonesa",
  "Denso Iridium Power - Alto Rendimiento / Competición", "Otro"
];

const TIRE_BRANDS = ["Pirelli", "Metzeler", "Michelin", "Bridgestone", "Dunlop", "Continental", "Maxxis", "Rinaldi", "Mitas", "Cordial", "MRF", "Timsun", "Otro"];

const FRONT_TIRE_SIZES = [
  "2.50 - 17 (CUB 110cc)", "2.75 - 18 (Calle 125cc / 150cc)", "80/100 - 21 (On-Off / Enduro)",
  "90/90 - 19 (Adventure / Trail)", "100/80 - 17 (Calle / Naked 200cc)", "110/70 - 17 (Naked / Sport 250cc a 400cc)",
  "120/70 - 17 (Alta Cilindrada / Pista)", "Otro"
];

const REAR_TIRE_SIZES = [
  "80/100 - 14 (CUB 110cc rueda trasera chica)", "3.00 - 18 (Calle 125cc / 150cc tradicional)",
  "90/90 - 18 (Calle 150cc moderna)", "110/90 - 17 (On-Off / Enduro)", "120/80 - 17 (Calle / Multipropósito)",
  "130/70 - 17 (Naked 200cc / 250cc)", "140/70 - 17 (Segmento 300cc - 400cc)",
  "150/60 - 17 (Segmento Deportivo / Touring 400cc)", "160/60 - 17 (Media-Alta cilindrada)",
  "180/55 - 17 (Alta Cilindrada / Pista)", "Otro"
];

const TRANSMISSION_BRANDS = ["Repuesto Original (Fabricante)", "DID (Japón)", "RK Takasago (Japón)", "JT Sprockets", "Riffel", "Choho", "KMC", "Wstandard", "Catalano", "Otro"];

const TRANSMISSION_PITCHES = [
  "Paso 428 (Motos chicas de 110cc a 150cc)", "Paso 520 (media cilindrada: 200cc a 400cc)",
  "Paso 525 (Motos Touring y de alta cilindrada)", "Paso 530 (Alta cilindrada / Pista / potencia)", "Otro"
];

const TRANSMISSION_RINGS = ["Con O-Rings / X-Rings (Con retenes, dura más, ideal para viajar)", "Sin Retenes (Común / Reforzada tradicional)"];

export default function NewMaintenancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Basic Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("Aceite");
  const [type, setType] = useState(""); // General type/title
  const [notes, setNotes] = useState("");

  // Specific Form states
  const [selectedBrandOrType, setSelectedBrandOrType] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  
  const [sparkPlugCode, setSparkPlugCode] = useState("");
  
  const [frontTire, setFrontTire] = useState("");
  const [rearTire, setRearTire] = useState("");
  const [customFrontTire, setCustomFrontTire] = useState("");
  const [customRearTire, setCustomRearTire] = useState("");

  const [transmissionPitch, setTransmissionPitch] = useState("");
  const [transmissionRingType, setTransmissionRingType] = useState(TRANSMISSION_RINGS[0]);
  const [isFullTransmissionKit, setIsFullTransmissionKit] = useState(true); // Si es cambio de kit o solo lubricación

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const recordMileage = parseInt(mileage) || 0;
      const profile = await getUserProfile(user.uid);
      if (!profile?.currentBikeId) throw new Error("No hay una moto seleccionada");

      // Build the type string based on category
      let finalType = type;
      if (category === "Aceite") {
        finalType = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
      } else if (category === "Bujías") {
        finalType = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
      } else if (category === "Cubiertas") {
        finalType = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
      } else if (category === "Transmisión") {
        if (isFullTransmissionKit) {
          finalType = "Cambio de Kit Completo: " + (selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType);
        } else {
          finalType = "Lubricación y Ajuste de Cadena";
        }
      }

      await addMaintenanceRecord(user.uid, {
        bikeId: profile.currentBikeId,
        date,
        mileage: recordMileage,
        cost: parseInt(cost) || 0,
        category,
        type: finalType,
        notes,
        customBrand: selectedBrandOrType === "Otro" ? customBrand : undefined,
        sparkPlugCode: category === "Bujías" ? sparkPlugCode : undefined,
        frontTire: category === "Cubiertas" ? (frontTire === "Otro" ? customFrontTire : frontTire) : undefined,
        rearTire: category === "Cubiertas" ? (rearTire === "Otro" ? customRearTire : rearTire) : undefined,
        transmissionPitch: category === "Transmisión" && isFullTransmissionKit ? transmissionPitch : undefined,
        transmissionRingType: category === "Transmisión" && isFullTransmissionKit ? transmissionRingType : undefined,
      });

      const currentBike = await getBike(user.uid, profile.currentBikeId);
      if (currentBike) {
        const updates: any = {};
        
        if (recordMileage > (currentBike.mileage || 0)) {
          updates.mileage = recordMileage;
        }

        // Smart chain lube logic
        if (category === "Transmisión") {
          // Si cambian el kit completo O si solo es lubricación, actualizamos el contador
          if (!currentBike.lastChainLubeMileage || recordMileage > currentBike.lastChainLubeMileage) {
            updates.lastChainLubeMileage = recordMileage;
          }
        }

        if (Object.keys(updates).length > 0) {
          await updateBike(user.uid, currentBike.id, updates);
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
        <div className="space-y-6">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider">Categoría Principal</label>
            <div className="relative">
              <select 
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as MaintenanceCategory);
                  setSelectedBrandOrType("");
                  setFrontTire("");
                  setRearTire("");
                  setTransmissionPitch("");
                }}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3.5 text-base font-semibold text-white focus:border-primary focus:outline-none appearance-none shadow-sm"
                required
              >
                <option value="Aceite">Aceite de Motor</option>
                <option value="Bujías">Bujías</option>
                <option value="Cubiertas">Cubiertas (Neumáticos)</option>
                <option value="Transmisión">Kit de Transmisión / Cadena</option>
                <option value="General">Mantenimiento General / Otros</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
            {/* --- CAMPOS ESPECIFICOS POR CATEGORIA --- */}
            {category === "General" && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Tipo de Trabajo</label>
                <input 
                  type="text" 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
                  placeholder="Ej. Regulación de Válvulas, Cambio de Frenos..."
                  required
                />
              </div>
            )}

            {category === "Aceite" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Marca y Tipo de Aceite</label>
                  <div className="relative">
                    <select value={selectedBrandOrType} onChange={e => setSelectedBrandOrType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="" disabled>Selecciona un aceite...</option>
                      {OIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                </div>
                {selectedBrandOrType === "Otro" && (
                  <input type="text" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especifique el aceite" required />
                )}
              </div>
            )}

            {category === "Bujías" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Tipo de Bujía</label>
                  <div className="relative">
                    <select value={selectedBrandOrType} onChange={e => setSelectedBrandOrType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="" disabled>Selecciona una bujía...</option>
                      {SPARK_PLUG_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                </div>
                {selectedBrandOrType === "Otro" && (
                  <input type="text" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especifique tipo de bujía" required />
                )}
                <div className="space-y-1 pt-2">
                  <label className="text-xs text-zinc-400">Código de bujía (Opcional)</label>
                  <input type="text" value={sparkPlugCode} onChange={e => setSparkPlugCode(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Ej. CPR8EA-9" />
                </div>
              </div>
            )}

            {category === "Cubiertas" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Marca de las Cubiertas</label>
                  <div className="relative">
                    <select value={selectedBrandOrType} onChange={e => setSelectedBrandOrType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="" disabled>Selecciona marca...</option>
                      {TIRE_BRANDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                </div>
                {selectedBrandOrType === "Otro" && (
                  <input type="text" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especifique marca" required />
                )}
                
                <div className="space-y-1 pt-2">
                  <label className="text-xs text-zinc-400">Medida Delantera</label>
                  <div className="relative">
                    <select value={frontTire} onChange={e => setFrontTire(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="">(No cambié la delantera)</option>
                      {FRONT_TIRE_SIZES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                  {frontTire === "Otro" && <input type="text" value={customFrontTire} onChange={e => setCustomFrontTire(e.target.value)} className="w-full mt-2 rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especificar medida delantera" required />}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs text-zinc-400">Medida Trasera</label>
                  <div className="relative">
                    <select value={rearTire} onChange={e => setRearTire(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="">(No cambié la trasera)</option>
                      {REAR_TIRE_SIZES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                  {rearTire === "Otro" && <input type="text" value={customRearTire} onChange={e => setCustomRearTire(e.target.value)} className="w-full mt-2 rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especificar medida trasera" required />}
                </div>
              </div>
            )}

            {category === "Transmisión" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <input type="checkbox" id="fullKit" checked={isFullTransmissionKit} onChange={e => setIsFullTransmissionKit(e.target.checked)} className="w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-background" />
                  <label htmlFor="fullKit" className="text-sm font-medium text-white cursor-pointer">
                    Cambio de Kit Completo
                  </label>
                </div>
                
                {!isFullTransmissionKit && (
                  <p className="text-xs text-zinc-400 px-1">Se registrará como una limpieza y lubricación de cadena rutinaria.</p>
                )}

                {isFullTransmissionKit && (
                  <>
                    <div className="space-y-1 pt-2">
                      <label className="text-xs text-zinc-400">Marca del Kit</label>
                      <div className="relative">
                        <select value={selectedBrandOrType} onChange={e => setSelectedBrandOrType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                          <option value="" disabled>Selecciona marca...</option>
                          {TRANSMISSION_BRANDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      </div>
                    </div>
                    {selectedBrandOrType === "Otro" && <input type="text" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especifique marca" required />}
                    
                    <div className="space-y-1 pt-2">
                      <label className="text-xs text-zinc-400">Paso de Cadena</label>
                      <div className="relative">
                        <select value={transmissionPitch} onChange={e => setTransmissionPitch(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                          <option value="" disabled>Selecciona el paso...</option>
                          {TRANSMISSION_PITCHES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-xs text-zinc-400">Tipo de Cadena (Retenes)</label>
                      <div className="relative">
                        <select value={transmissionRingType} onChange={e => setTransmissionRingType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                          {TRANSMISSION_RINGS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* --- CAMPOS GLOBALES --- */}
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
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none" 
              placeholder="Detalles adicionales (Ej. El filtro costó más caro porque no había del común...)"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none active:scale-95 transition-all disabled:opacity-50 mt-8 shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : "Guardar Registro"}
        </button>
      </form>
    </div>
  );
}
