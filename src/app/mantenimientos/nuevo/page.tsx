"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { addMaintenanceRecord, getUserProfile, getBike, updateBike, MaintenanceCategory, subscribeToMaintenanceRecords, MaintenanceRecord } from "@/lib/services";
import { ChevronLeft, Loader2, ChevronDown, Check } from "lucide-react";
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

const BATTERY_BRANDS = ["Yuasa", "Motobatt", "Bosch", "Moura", "Kronwell", "Wstandard", "Pionero", "Skyrich", "Otro"];
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

const TRANSMISSION_BRANDS = ["Repuesto Original (Fabricante)", "DID (Japón)", "RK Takasago (Japón)", "JT Sprockets", "Riffel", "Choho", "KMC", "Wstandard", "Catalano", "Otro"];

const TRANSMISSION_PITCHES = [
  "Paso 428 (Motos chicas de 110cc a 150cc)", "Paso 520 (media cilindrada: 200cc a 400cc)",
  "Paso 525 (Motos Touring y de alta cilindrada)", "Paso 530 (Alta cilindrada / Pista / potencia)", "Otro"
];

const TRANSMISSION_RINGS = ["Con O-Rings / X-Rings (Con retenes, dura más, ideal para viajar)", "Sin Retenes (Común / Reforzada tradicional)"];

const REFRIGERANT_OPTIONS = ["Motul Motocool", "Ipone Radiator Liquid", "Castrol Radicool", "YPF Elaion Coolant", "Otro"];
const BRAKE_BRANDS = ["Frasle Sinterizadas", "Frasle Orgánicas", "EBC Brakes Sinterizadas", "Brembo Carbon Ceramic", "Repuesto Original", "Cobreq", "Otro"];

const GENERAL_CHECKLIST_OPTIONS = [
  { id: "oil", label: "Cambio de Aceite y Filtro", dbCat: "Aceite" },
  { id: "airFilter", label: "Revisión / Cambio de filtro de aire", dbCat: "General" },
  { id: "brakes", label: "Revisión / Cambio de Frenos", dbCat: "Desgaste" },
  { id: "sparkPlugs", label: "Revisión / Cambio de Bujías", dbCat: "Bujías" },
  { id: "valves", label: "Regulación de Válvulas", dbCat: "General" },
  { id: "chain", label: "Ajuste y Lubricación de Cadena (Transmisión)", dbCat: "Transmisión" },
  { id: "transmissionKit", label: "Cambio de Kit de Transmisión", dbCat: "Transmisión" },
  { id: "bolts", label: "Ajuste de Bulones / Tornillería general", dbCat: "General" },
  { id: "refrigerant", label: "Revisión / Cambio de Refrigerante", dbCat: "Fluidos" },
  { id: "battery", label: "Revisión / Cambio de Batería", dbCat: "Batería" },
  { id: "clutch", label: "Discos de Embrague (Clutch)", dbCat: "Clutch" }
];

function NewMaintenanceForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  
  // Basic Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState<MaintenanceCategory>("Aceite");
  const [type, setType] = useState(""); // General type/title
  const [notes, setNotes] = useState("");
  const [userNotes, setUserNotes] = useState("");

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
  const [isFullTransmissionKit, setIsFullTransmissionKit] = useState(true);

  const [batteryType, setBatteryType] = useState(BATTERY_TYPES[0]);
  const [batteryModel, setBatteryModel] = useState("");
  const [customBatteryModel, setCustomBatteryModel] = useState("");
  
  const [clutchChanged, setClutchChanged] = useState(false);

  const [generalChecklist, setGeneralChecklist] = useState({
    oil: false,
    airFilter: false,
    brakes: false,
    sparkPlugs: false,
    valves: false,
    chain: false,
    bolts: false,
    refrigerant: false,
    battery: false,
    transmissionKit: false,
    clutch: false
  });

  const [pastRecords, setPastRecords] = useState<MaintenanceRecord[]>([]);

  const [generalSubData, setGeneralSubData] = useState({
    oil: { usePrevious: true, selected: "", custom: "" },
    airFilter: { revision: false, cambio: false },
    brakes: { revision: false, cambio: false },
    sparkPlugs: { revision: false, cambio: false, usePrevious: true, selected: "", custom: "" },
    refrigerant: { revision: false, cambio: false, usePrevious: true, selected: "", custom: "" },
    battery: { revision: false, cambio: false, usePrevious: true, brand: "", customBrand: "", type: "", model: "", customModel: "" },
    transmissionKit: { usePrevious: true, brand: "", customBrand: "", pitch: "", ringType: "" },
    clutch: { cambio: false }
  });

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMaintenanceRecords(user.uid, (data) => {
      setPastRecords(data);
    });
    return () => unsub();
  }, [user]);

  // Set initial category from query parameters
  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      if (catParam === "bujias") {
        setCategory("Bujías");
      } else if (catParam === "cubiertas") {
        setCategory("Cubiertas");
      } else if (catParam === "frenos") {
        setCategory("Desgaste");
        setType("Frenos");
      } else if (catParam === "liquidofrenos") {
        setCategory("Fluidos");
        setType("Líquido de Frenos");
      } else if (catParam === "refrigerante") {
        setCategory("Fluidos");
        setType("Líquido Refrigerante");
      } else if (catParam === "transmision") {
        setCategory("Transmisión");
      } else if (catParam === "general") {
        setCategory("General");
      } else if (catParam === "aceite") {
        setCategory("Aceite");
      } else if (catParam === "bateria") {
        setCategory("Batería");
      } else if (catParam === "clutch") {
        setCategory("Clutch");
      }
    }
  }, [searchParams]);

  // Helper to generate dynamic notes based on category and selections
  const getAutoNotes = () => {
    let parts: string[] = [];
    if (category === "Aceite") {
      if (selectedBrandOrType) {
        const brand = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
        parts.push(`Aceite: ${brand}`);
      }
    } else if (category === "Bujías") {
      if (selectedBrandOrType) {
        const brand = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
        const code = sparkPlugCode ? ` - Código: ${sparkPlugCode}` : "";
        parts.push(`Bujía: ${brand}${code}`);
      }
    } else if (category === "Cubiertas") {
      if (selectedBrandOrType) {
        const brand = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
        const fSize = frontTire ? (frontTire === "Otro" ? customFrontTire : frontTire) : "Sin cambio";
        const rSize = rearTire ? (rearTire === "Otro" ? customRearTire : rearTire) : "Sin cambio";
        parts.push(`Cubiertas - Marca: ${brand} | Delantera: ${fSize} | Trasera: ${rSize}`);
      }
    } else if (category === "Transmisión") {
      if (isFullTransmissionKit) {
        if (selectedBrandOrType) {
          const brand = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
          parts.push(`Transmisión - Kit Completo: ${brand} | Paso: ${transmissionPitch || "No especificado"} | Cadena: ${transmissionRingType}`);
        }
      } else {
        parts.push(`Transmisión - Ajuste y Lubricación de Cadena`);
      }
    } else if (category === "Batería") {
      if (selectedBrandOrType) {
        const brand = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
        const model = batteryModel === "Otro" ? customBatteryModel : batteryModel;
        parts.push(`Batería - Marca: ${brand} | Tipo: ${batteryType} | Modelo: ${model || "No especificado"}`);
      }
    } else if (category === "Clutch") {
      parts.push(`Embrague - Discos de Embrague: ${clutchChanged ? "Cambiados" : "Revisión / Ajuste"}`);
    } else if (category === "General") {
      const checkedOpts = GENERAL_CHECKLIST_OPTIONS.filter(opt => generalChecklist[opt.id as keyof typeof generalChecklist]);
      if (checkedOpts.length > 0) {
        parts.push("Service General:");
        checkedOpts.forEach(opt => {
          if (opt.id === "oil") {
            const pastOil = pastRecords.find(r => r.category === "Aceite");
            let oilVal = "";
            if (generalSubData.oil.usePrevious && pastOil) {
              oilVal = `${pastOil.type} (Anterior)`;
            } else if (generalSubData.oil.selected) {
              oilVal = generalSubData.oil.selected === "Otro" ? generalSubData.oil.custom : generalSubData.oil.selected;
            }
            parts.push(`  - Aceite y Filtro: ${oilVal || "Sí"}`);
          } else if (opt.id === "airFilter") {
            const subParts = [];
            if (generalSubData.airFilter.revision) subParts.push("Revisión");
            if (generalSubData.airFilter.cambio) subParts.push("Cambio");
            parts.push(`  - Filtro de Aire: ${subParts.join(" y ") || "Sí"}`);
          } else if (opt.id === "brakes") {
            const subParts = [];
            if (generalSubData.brakes.revision) subParts.push("Revisión");
            if (generalSubData.brakes.cambio) subParts.push("Cambio");
            parts.push(`  - Frenos: ${subParts.join(" y ") || "Sí"}`);
          } else if (opt.id === "sparkPlugs") {
            const subParts = [];
            if (generalSubData.sparkPlugs.revision) subParts.push("Revisión");
            if (generalSubData.sparkPlugs.cambio) {
              const pastSpark = pastRecords.find(r => r.category === "Bujías");
              let plugVal = "";
              if (generalSubData.sparkPlugs.usePrevious && pastSpark) {
                plugVal = `${pastSpark.type} (Anterior)`;
              } else if (generalSubData.sparkPlugs.selected) {
                plugVal = generalSubData.sparkPlugs.selected === "Otro" ? generalSubData.sparkPlugs.custom : generalSubData.sparkPlugs.selected;
              }
              subParts.push(`Cambio: ${plugVal || "Sí"}`);
            }
            parts.push(`  - Bujías: ${subParts.join(" y ") || "Sí"}`);
          } else if (opt.id === "valves") {
            parts.push(`  - Regulación de Válvulas`);
          } else if (opt.id === "chain") {
            parts.push(`  - Ajuste y Lubricación de Cadena`);
          } else if (opt.id === "bolts") {
            parts.push(`  - Ajuste de Bulones / Tornillería`);
          } else if (opt.id === "refrigerant") {
            const subParts = [];
            if (generalSubData.refrigerant.revision) subParts.push("Revisión");
            if (generalSubData.refrigerant.cambio) {
              const pastRef = pastRecords.find(r => r.category === "Fluidos" && (r.type || "").toLowerCase().includes("refrigerante"));
              let refVal = "";
              if (generalSubData.refrigerant.usePrevious && pastRef) {
                refVal = `${pastRef.type} (Anterior)`;
              } else if (generalSubData.refrigerant.selected) {
                refVal = generalSubData.refrigerant.selected === "Otro" ? generalSubData.refrigerant.custom : generalSubData.refrigerant.selected;
              }
              subParts.push(`Cambio: ${refVal || "Sí"}`);
            }
            parts.push(`  - Refrigerante: ${subParts.join(" y ") || "Sí"}`);
          } else if (opt.id === "battery") {
            const subParts = [];
            if (generalSubData.battery.revision) subParts.push("Revisión");
            if (generalSubData.battery.cambio) {
              const pastBat = pastRecords.find(r => r.category === "Batería");
              let batVal = "";
              if (generalSubData.battery.usePrevious && pastBat) {
                batVal = `${pastBat.batteryBrand || ""} ${pastBat.batteryModel || ""} (Anterior)`;
              } else if (generalSubData.battery.type || generalSubData.battery.model) {
                const model = generalSubData.battery.model === "Otro" ? generalSubData.battery.customModel : generalSubData.battery.model;
                batVal = `${generalSubData.battery.type} ${model}`;
              }
              subParts.push(`Cambio: ${batVal.trim() || "Sí"}`);
            }
            parts.push(`  - Batería: ${subParts.join(" y ") || "Sí"}`);
          } else if (opt.id === "transmissionKit") {
            parts.push(`  - Transmisión: Cambio de Kit Completo`);
          } else if (opt.id === "clutch") {
            const clutchVal = generalSubData.clutch.cambio ? "Cambio de discos" : "Revisión";
            parts.push(`  - Embrague: ${clutchVal}`);
          }
        });
      }
    }
    return parts.join("\n");
  };

  const autoNotes = getAutoNotes();

  // Sync state between selections, manual user input, and main notes field
  useEffect(() => {
    const full = autoNotes ? (autoNotes + (userNotes ? "\n\n" + userNotes : "")) : userNotes;
    setNotes(full);
  }, [autoNotes, userNotes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (autoNotes && val.startsWith(autoNotes)) {
      // Strip autoNotes prefix to get the user's manual notes
      setUserNotes(val.substring(autoNotes.length).replace(/^\n+/, ""));
    } else {
      setUserNotes(val);
    }
  };

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
      } else if (category === "Batería") {
        finalType = "Cambio de Batería: " + (selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType);
      } else if (category === "Clutch") {
        finalType = clutchChanged ? "Cambio de Discos de Embrague" : "Revisión de Embrague";
      } else if (category === "General") {
        const checkedLabels = GENERAL_CHECKLIST_OPTIONS
          .filter(opt => generalChecklist[opt.id as keyof typeof generalChecklist])
          .map(opt => {
            if (opt.id === "airFilter") {
              const parts = [];
              if (generalSubData.airFilter.revision) parts.push("Revisión");
              if (generalSubData.airFilter.cambio) parts.push("Cambio");
              return parts.length > 0 ? `${parts.join(" y ")} de Filtro de Aire` : opt.label;
            }
            if (opt.id === "refrigerant") {
              const parts = [];
              if (generalSubData.refrigerant.revision) parts.push("Revisión");
              if (generalSubData.refrigerant.cambio) parts.push("Cambio");
              return parts.length > 0 ? `${parts.join(" y ")} de Refrigerante` : opt.label;
            }
            if (opt.id === "battery") {
              const parts = [];
              if (generalSubData.battery.revision) parts.push("Revisión");
              if (generalSubData.battery.cambio) parts.push("Cambio");
              return parts.length > 0 ? `${parts.join(" y ")} de Batería` : opt.label;
            }
            if (opt.id === "transmissionKit") {
              return "Cambio de Kit de Transmisión";
            }
            if (opt.id === "clutch") {
              return generalSubData.clutch.cambio ? "Cambio de Discos de Embrague" : "Revisión de Embrague";
            }
            return opt.label;
          });
        
        finalType = checkedLabels.length > 0
          ? "Service General: " + checkedLabels.join(", ")
          : "Service General Completo";
      }

      const payload: any = {
        bikeId: profile.currentBikeId,
        date,
        mileage: recordMileage,
        cost: parseInt(cost) || 0,
        category,
        type: finalType,
        notes,
      };

      if (selectedBrandOrType === "Otro" && customBrand) payload.customBrand = customBrand;
      if (category === "Bujías" && sparkPlugCode) payload.sparkPlugCode = sparkPlugCode;
      
      if (category === "Cubiertas") {
        const fTire = frontTire === "Otro" ? customFrontTire : frontTire;
        const rTire = rearTire === "Otro" ? customRearTire : rearTire;
        if (fTire) payload.frontTire = fTire;
        if (rTire) payload.rearTire = rTire;
      }

      if (category === "Transmisión" && isFullTransmissionKit) {
        if (transmissionPitch) payload.transmissionPitch = transmissionPitch;
        if (transmissionRingType) payload.transmissionRingType = transmissionRingType;
      }

      if (category === "Batería") {
        if (selectedBrandOrType) payload.batteryBrand = selectedBrandOrType === "Otro" ? customBrand : selectedBrandOrType;
        if (batteryType) payload.batteryType = batteryType;
        if (batteryModel) payload.batteryModel = batteryModel === "Otro" ? customBatteryModel : batteryModel;
      }

      const parentRecordId = await addMaintenanceRecord(user.uid, payload);

      // Lógica de Actualización Cruzada para Service General
      if (category === "General") {
        const pastOil = pastRecords.find(r => r.category === "Aceite");
        const pastBrakes = pastRecords.find(r => r.category === "Desgaste" && (r.type || "").toLowerCase().includes("freno"));
        const pastSparkPlug = pastRecords.find(r => r.category === "Bujías");
        const pastRefrigerant = pastRecords.find(r => r.category === "Fluidos" && (r.type || "").toLowerCase().includes("refrigerante"));
        const pastBattery = pastRecords.find(r => r.category === "Batería");
        const pastTransmissionKit = pastRecords.find(r => r.category === "Transmisión" && (r.type || "").toLowerCase().includes("cambio de kit"));

        // 1. Cambio de Aceite
        if (generalChecklist.oil) {
          let oilType = "";
          if (generalSubData.oil.usePrevious && pastOil) {
            oilType = pastOil.type;
          } else {
            oilType = generalSubData.oil.selected === "Otro" ? generalSubData.oil.custom : generalSubData.oil.selected;
          }

          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Aceite",
            type: oilType || "Cambio de Aceite",
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }

        // 2. Revisión / Cambio de Frenos
        if (generalChecklist.brakes) {
          const parts = [];
          if (generalSubData.brakes.revision) parts.push("Revisión de Frenos");
          if (generalSubData.brakes.cambio) parts.push("Cambio de Pastillas/Discos de Freno");
          const brakesType = parts.length > 0 ? parts.join(" y ") : "Revisión / Cambio de Frenos";

          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Desgaste",
            type: brakesType,
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }

        // 3. Revisión / Cambio de Bujías
        if (generalChecklist.sparkPlugs) {
          const parts = [];
          
          if (generalSubData.sparkPlugs.revision) {
            parts.push("Revisión de Bujías");
          }
          
          if (generalSubData.sparkPlugs.cambio) {
            let specVal = "";
            if (generalSubData.sparkPlugs.usePrevious && pastSparkPlug) {
              specVal = pastSparkPlug.type;
            } else {
              specVal = generalSubData.sparkPlugs.selected === "Otro" ? generalSubData.sparkPlugs.custom : generalSubData.sparkPlugs.selected;
            }
            parts.push("Cambio de Bujías (" + (specVal || "Especificación no detallada") + ")");
          }
          
          const plugType = parts.length > 0 ? parts.join(" y ") : "Revisión / Cambio de Bujías";

          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Bujías",
            type: plugType,
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }

        // 4. Ajuste y Lubricación de Cadena (Transmisión)
        if (generalChecklist.chain) {
          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Transmisión",
            type: "Lubricación de Cadena",
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }

        // 4.5. Cambio de Kit de Transmisión
        if (generalChecklist.transmissionKit) {
          let transBrand = "";
          let transPitch = "";
          let transRing = "";

          if (generalSubData.transmissionKit.usePrevious && pastTransmissionKit) {
            transBrand = (pastTransmissionKit.type || "").replace("Cambio de Kit Completo: ", "");
            transPitch = pastTransmissionKit.transmissionPitch || "";
            transRing = pastTransmissionKit.transmissionRingType || "";
          } else {
            transBrand = generalSubData.transmissionKit.brand === "Otro" ? generalSubData.transmissionKit.customBrand : generalSubData.transmissionKit.brand;
            transPitch = generalSubData.transmissionKit.pitch;
            transRing = generalSubData.transmissionKit.ringType;
          }

          if (transBrand) {
            await addMaintenanceRecord(user.uid, {
              bikeId: profile.currentBikeId,
              date,
              mileage: recordMileage,
              cost: 0,
              category: "Transmisión",
              type: `Cambio de Kit Completo: ${transBrand}`,
              transmissionPitch: transPitch,
              transmissionRingType: transRing,
              parentRecordId: parentRecordId,
              notes: "Registrado automáticamente vía Service General."
            });
          }
        }

        // 5. Cambio de Refrigerante
        if (generalChecklist.refrigerant) {
          const parts = [];
          let refType = "";

          if (generalSubData.refrigerant.revision) {
            parts.push("Revisión");
            if (pastRefrigerant) {
              refType = pastRefrigerant.type;
            }
          }

          if (generalSubData.refrigerant.cambio) {
            parts.push("Cambio");
            let specVal = "";
            if (generalSubData.refrigerant.usePrevious && pastRefrigerant) {
              specVal = pastRefrigerant.type;
            } else {
              specVal = generalSubData.refrigerant.selected === "Otro" ? generalSubData.refrigerant.custom : generalSubData.refrigerant.selected;
            }
            parts.push("Cambio de Refrigerante (" + (specVal || "Especificación no detallada") + ")");
          }

          const refrigerantFinalTitle = parts.length > 0 ? parts.join(" y ") : "Revisión / Cambio de Refrigerante";

          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Fluidos",
            type: refType || refrigerantFinalTitle,
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }

        // 6. Revisión / Cambio de Batería
        if (generalChecklist.battery) {
          const parts = [];
          let batBrand = "Revisión Batería";
          let batType = "";
          let batModel = "";

          if (generalSubData.battery.revision) {
            parts.push("Revisión");
            if (pastBattery) {
              batBrand = pastBattery.batteryBrand || "Revisión Batería";
              batType = pastBattery.batteryType || "";
              batModel = pastBattery.batteryModel || "";
            }
          }

          if (generalSubData.battery.cambio) {
            parts.push("Cambio");
            if (generalSubData.battery.usePrevious && pastBattery) {
              batBrand = pastBattery.batteryBrand || "Cambio Batería";
              batType = pastBattery.batteryType || "";
              batModel = pastBattery.batteryModel || "";
            } else {
              batBrand = generalSubData.battery.brand === "Otro" ? generalSubData.battery.customBrand : generalSubData.battery.brand;
              if (!batBrand) batBrand = "Cambio Batería"; // Legacy fallback if left completely empty somehow
              batType = generalSubData.battery.type;
              batModel = generalSubData.battery.model === "Otro" ? generalSubData.battery.customModel : generalSubData.battery.model;
            }
          }

          const batteryFinalTitle = parts.length > 0 ? `${parts.join(" y ")} de Batería` : "Revisión / Cambio de Batería";

          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Batería",
            type: `${batteryFinalTitle}: ${batBrand} ${batModel}`,
            batteryBrand: batBrand,
            batteryType: batType,
            batteryModel: batModel,
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }

        // 7. Embrague / Clutch
        if (generalChecklist.clutch) {
          const clutchType = generalSubData.clutch.cambio ? "Cambio de Discos de Embrague" : "Revisión de Embrague";

          await addMaintenanceRecord(user.uid, {
            bikeId: profile.currentBikeId,
            date,
            mileage: recordMileage,
            cost: 0,
            category: "Clutch",
            type: clutchType,
            parentRecordId: parentRecordId,
            notes: "Registrado automáticamente vía Service General."
          });
        }
      }

      const currentBike = await getBike(user.uid, profile.currentBikeId);
      if (currentBike) {
        const updates: any = {};
        
        if (recordMileage > (currentBike.mileage || 0)) {
          updates.mileage = recordMileage;
        }

        if (category === "Transmisión" || (category === "General" && generalChecklist.chain)) {
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
    <div className="min-h-screen bg-background pb-10 text-white">
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
                  setType("");
                }}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3.5 text-base font-semibold text-white focus:border-primary focus:outline-none appearance-none shadow-sm"
                required
              >
                <option value="Aceite">Aceite de Motor</option>
                <option value="Bujías">Bujías</option>
                <option value="Cubiertas">Cubiertas (Neumáticos)</option>
                <option value="Transmisión">Kit de Transmisión / Cadena</option>
                <option value="Batería">Batería</option>
                <option value="Clutch">Embrague (Clutch)</option>
                <option value="Desgaste">Frenos / Desgaste</option>
                <option value="Fluidos">Líquidos / Fluidos</option>
                <option value="General">Mantenimiento General / Otros</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
            {/* --- CAMPOS ESPECIFICOS POR CATEGORIA --- */}
            {(category === "Desgaste" || category === "Fluidos") && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Tipo de Trabajo</label>
                <input 
                  type="text" 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary focus:outline-none" 
                  placeholder={
                    category === "Desgaste" 
                      ? "Ej. Cambio de Pastillas de Freno, Discos..." 
                      : "Ej. Purga de Líquido de Frenos, Cambio de Refrigerante..."
                  }
                  required
                />
              </div>
            )}

            {category === "General" && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Checklist de Trabajos Realizados</label>
                <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  {GENERAL_CHECKLIST_OPTIONS.map(opt => {
                    const isChecked = generalChecklist[opt.id as keyof typeof generalChecklist];
                    const pastOil = pastRecords.find(r => r.category === "Aceite");
                    const pastBrakes = pastRecords.find(r => r.category === "Desgaste" && (r.type || "").toLowerCase().includes("freno"));
                    const pastSparkPlug = pastRecords.find(r => r.category === "Bujías");
                    const pastRefrigerant = pastRecords.find(r => r.category === "Fluidos" && (r.type || "").toLowerCase().includes("refrigerante"));
                    const pastBattery = pastRecords.find(r => r.category === "Batería");
                    const pastTransmissionKit = pastRecords.find(r => r.category === "Transmisión" && (r.type || "").toLowerCase().includes("cambio de kit"));

                    return (
                      <div key={opt.id} className="p-2.5 rounded-xl border border-white/5 bg-zinc-950/40 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => setGeneralChecklist(prev => ({
                              ...prev,
                              [opt.id]: e.target.checked
                            }))}
                            className="mt-1 h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-primary focus:ring-primary accent-primary"
                          />
                          <div>
                            <span className="text-sm font-semibold text-zinc-200">{opt.label}</span>
                          </div>
                        </label>

                        {/* SUB PANEL EXPANSION CONDICIONAL */}
                        {isChecked && (
                          <div className="pl-7 pt-2 border-t border-white/5 mt-2 space-y-3">
                            
                            {/* 1. Aceite y Filtro */}
                            {opt.id === "oil" && (
                              <div className="space-y-3">
                                {pastOil && (
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.oil.usePrevious}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, oil: { ...prev.oil, usePrevious: e.target.checked } }))}
                                      className="h-3.5 w-3.5 accent-primary"
                                    />
                                    <span>Usar último aceite cargado: <span className="underline italic">{pastOil.type}</span></span>
                                  </label>
                                )}
                                {(!generalSubData.oil.usePrevious || !pastOil) && (
                                  <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-zinc-400">Seleccionar Aceite</label>
                                    <div className="relative">
                                      <select 
                                        value={generalSubData.oil.selected} 
                                        onChange={e => setGeneralSubData(prev => ({ ...prev, oil: { ...prev.oil, selected: e.target.value } }))}
                                        className="w-full rounded-lg border border-border bg-black/40 px-3 py-2.5 text-xs text-foreground focus:border-primary appearance-none"
                                      >
                                        <option value="">Selecciona un aceite...</option>
                                        {OIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                    </div>
                                    {generalSubData.oil.selected === "Otro" && (
                                      <input 
                                        type="text" 
                                        value={generalSubData.oil.custom} 
                                        onChange={e => setGeneralSubData(prev => ({ ...prev, oil: { ...prev.oil, custom: e.target.value } }))}
                                        className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-xs focus:border-primary"
                                        placeholder="Especifique el aceite"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 1.5 Filtro de Aire */}
                            {opt.id === "airFilter" && (
                              <div className="flex gap-6 py-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                  <input 
                                    type="checkbox"
                                    checked={generalSubData.airFilter.revision}
                                    onChange={e => setGeneralSubData(prev => ({ ...prev, airFilter: { ...prev.airFilter, revision: e.target.checked } }))}
                                    className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                  />
                                  <span>Revisión</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                  <input 
                                    type="checkbox"
                                    checked={generalSubData.airFilter.cambio}
                                    onChange={e => setGeneralSubData(prev => ({ ...prev, airFilter: { ...prev.airFilter, cambio: e.target.checked } }))}
                                    className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                  />
                                  <span>Cambio</span>
                                </label>
                              </div>
                            )}

                            {/* 2. Frenos */}
                            {opt.id === "brakes" && (
                              <div className="flex gap-6 py-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                  <input 
                                    type="checkbox"
                                    checked={generalSubData.brakes.revision}
                                    onChange={e => setGeneralSubData(prev => ({ ...prev, brakes: { ...prev.brakes, revision: e.target.checked } }))}
                                    className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                  />
                                  <span>Revisión</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                  <input 
                                    type="checkbox"
                                    checked={generalSubData.brakes.cambio}
                                    onChange={e => setGeneralSubData(prev => ({ ...prev, brakes: { ...prev.brakes, cambio: e.target.checked } }))}
                                    className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                  />
                                  <span>Cambio</span>
                                </label>
                              </div>
                            )}

                            {/* 3. Bujías */}
                            {opt.id === "sparkPlugs" && (
                              <div className="space-y-3">
                                <div className="flex gap-6 py-1">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.sparkPlugs.revision}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, sparkPlugs: { ...prev.sparkPlugs, revision: e.target.checked } }))}
                                      className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                    />
                                    <span>Revisión</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.sparkPlugs.cambio}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, sparkPlugs: { ...prev.sparkPlugs, cambio: e.target.checked } }))}
                                      className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                    />
                                    <span>Cambio</span>
                                  </label>
                                </div>

                                {generalSubData.sparkPlugs.cambio && (
                                  <div className="pt-2 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                                    {pastSparkPlug && (
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary">
                                        <input 
                                          type="checkbox"
                                          checked={generalSubData.sparkPlugs.usePrevious}
                                          onChange={e => setGeneralSubData(prev => ({ ...prev, sparkPlugs: { ...prev.sparkPlugs, usePrevious: e.target.checked } }))}
                                          className="h-3.5 w-3.5 accent-primary"
                                        />
                                        <span>Usar última bujía cargada: <span className="underline italic">{pastSparkPlug.type}</span></span>
                                      </label>
                                    )}
                                    {(!generalSubData.sparkPlugs.usePrevious || !pastSparkPlug) && (
                                      <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-400">Seleccionar Bujía</label>
                                        <div className="relative">
                                          <select 
                                            value={generalSubData.sparkPlugs.selected} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, sparkPlugs: { ...prev.sparkPlugs, selected: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2.5 text-xs text-foreground focus:border-primary appearance-none"
                                          >
                                            <option value="">Selecciona una bujía...</option>
                                            {SPARK_PLUG_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                          </select>
                                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                        </div>
                                        {generalSubData.sparkPlugs.selected === "Otro" && (
                                          <input 
                                            type="text" 
                                            value={generalSubData.sparkPlugs.custom} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, sparkPlugs: { ...prev.sparkPlugs, custom: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-xs focus:border-primary"
                                            placeholder="Especifique código/marca de bujía"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 4. Refrigerante */}
                            {opt.id === "refrigerant" && (
                              <div className="space-y-3">
                                <div className="flex gap-6 py-1">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.refrigerant.revision}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, refrigerant: { ...prev.refrigerant, revision: e.target.checked } }))}
                                      className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                    />
                                    <span>Revisión</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.refrigerant.cambio}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, refrigerant: { ...prev.refrigerant, cambio: e.target.checked } }))}
                                      className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                    />
                                    <span>Cambio</span>
                                  </label>
                                </div>

                                {generalSubData.refrigerant.cambio && (
                                  <div className="pt-2 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                                    {pastRefrigerant && (
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary">
                                        <input 
                                          type="checkbox"
                                          checked={generalSubData.refrigerant.usePrevious}
                                          onChange={e => setGeneralSubData(prev => ({ ...prev, refrigerant: { ...prev.refrigerant, usePrevious: e.target.checked } }))}
                                          className="h-3.5 w-3.5 accent-primary"
                                        />
                                        <span>Usar mismo refrigerante anterior: <span className="underline italic">{pastRefrigerant.type}</span></span>
                                      </label>
                                    )}
                                    {(!generalSubData.refrigerant.usePrevious || !pastRefrigerant) && (
                                      <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-zinc-400">Seleccionar Refrigerante</label>
                                        <div className="relative">
                                          <select 
                                            value={generalSubData.refrigerant.selected} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, refrigerant: { ...prev.refrigerant, selected: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2.5 text-xs text-foreground focus:border-primary appearance-none"
                                          >
                                            <option value="">Selecciona...</option>
                                            {REFRIGERANT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                          </select>
                                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                        </div>
                                        {generalSubData.refrigerant.selected === "Otro" && (
                                          <input 
                                            type="text" 
                                            value={generalSubData.refrigerant.custom} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, refrigerant: { ...prev.refrigerant, custom: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-xs focus:border-primary"
                                            placeholder="Especifique el refrigerante"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 5. Batería */}
                            {opt.id === "battery" && (
                              <div className="space-y-3">
                                <div className="flex gap-6 py-1">
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.battery.revision}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, revision: e.target.checked } }))}
                                      className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                    />
                                    <span>Revisión</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.battery.cambio}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, cambio: e.target.checked } }))}
                                      className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                    />
                                    <span>Cambio</span>
                                  </label>
                                </div>

                                {generalSubData.battery.cambio && (
                                  <div className="pt-2 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                                    {pastBattery && (
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary">
                                        <input 
                                          type="checkbox"
                                          checked={generalSubData.battery.usePrevious}
                                          onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, usePrevious: e.target.checked } }))}
                                          className="h-3.5 w-3.5 accent-primary"
                                        />
                                        <span>Usar misma batería anterior: <span className="underline italic">{pastBattery.batteryBrand} {pastBattery.batteryModel}</span></span>
                                      </label>
                                    )}
                                    {(!generalSubData.battery.usePrevious || !pastBattery) && (
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <label className="text-[11px] font-bold text-zinc-400">Marca</label>
                                          <div className="relative">
                                            <select 
                                              value={generalSubData.battery.brand} 
                                              onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, brand: e.target.value } }))}
                                              className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-[11px] text-foreground focus:border-primary appearance-none"
                                            >
                                              <option value="">Selecciona...</option>
                                              {BATTERY_BRANDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                          </div>
                                        </div>
                                        {generalSubData.battery.brand === "Otro" && (
                                          <input 
                                            type="text" 
                                            value={generalSubData.battery.customBrand} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, customBrand: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-xs focus:border-primary"
                                            placeholder="Especifique marca"
                                          />
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-zinc-400">Tecnología</label>
                                            <div className="relative">
                                              <select 
                                                value={generalSubData.battery.type} 
                                                onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, type: e.target.value } }))}
                                                className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-[11px] text-foreground focus:border-primary appearance-none"
                                              >
                                                <option value="">Selecciona...</option>
                                                {BATTERY_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                              </select>
                                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[11px] font-bold text-zinc-400">Modelo</label>
                                            <div className="relative">
                                              <select 
                                                value={generalSubData.battery.model} 
                                                onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, model: e.target.value } }))}
                                                className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-[11px] text-foreground focus:border-primary appearance-none"
                                              >
                                                <option value="">Selecciona...</option>
                                                {BATTERY_MODELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                              </select>
                                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                            </div>
                                          </div>
                                        </div>
                                        {generalSubData.battery.model === "Otro" && (
                                          <input 
                                            type="text" 
                                            value={generalSubData.battery.customModel} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, battery: { ...prev.battery, customModel: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-xs focus:border-primary"
                                            placeholder="Ej. YTX5L-BS"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 7. Cambio de Kit de Transmisión */}
                            {opt.id === "transmissionKit" && (
                              <div className="pt-2 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                                {pastTransmissionKit && (
                                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-primary">
                                    <input 
                                      type="checkbox"
                                      checked={generalSubData.transmissionKit.usePrevious}
                                      onChange={e => setGeneralSubData(prev => ({ ...prev, transmissionKit: { ...prev.transmissionKit, usePrevious: e.target.checked } }))}
                                      className="h-3.5 w-3.5 accent-primary"
                                    />
                                    <span>Usar mismo kit anterior: <span className="underline italic">{(pastTransmissionKit.type || "").replace("Cambio de Kit Completo: ", "")}</span></span>
                                  </label>
                                )}
                                {(!generalSubData.transmissionKit.usePrevious || !pastTransmissionKit) && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-zinc-400">Marca del Kit</label>
                                      <div className="relative">
                                        <select 
                                          value={generalSubData.transmissionKit.brand} 
                                          onChange={e => setGeneralSubData(prev => ({ ...prev, transmissionKit: { ...prev.transmissionKit, brand: e.target.value } }))}
                                          className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-[11px] text-foreground focus:border-primary appearance-none"
                                        >
                                          <option value="">Selecciona...</option>
                                          {TRANSMISSION_BRANDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                      </div>
                                    </div>
                                    {generalSubData.transmissionKit.brand === "Otro" && (
                                      <input 
                                        type="text" 
                                        value={generalSubData.transmissionKit.customBrand} 
                                        onChange={e => setGeneralSubData(prev => ({ ...prev, transmissionKit: { ...prev.transmissionKit, customBrand: e.target.value } }))}
                                        className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-xs focus:border-primary"
                                        placeholder="Especifique marca del kit"
                                      />
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-zinc-400">Paso</label>
                                        <div className="relative">
                                          <select 
                                            value={generalSubData.transmissionKit.pitch} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, transmissionKit: { ...prev.transmissionKit, pitch: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-[11px] text-foreground focus:border-primary appearance-none"
                                          >
                                            <option value="">Selecciona...</option>
                                            {TRANSMISSION_PITCHES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                          </select>
                                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-zinc-400">Cadena</label>
                                        <div className="relative">
                                          <select 
                                            value={generalSubData.transmissionKit.ringType} 
                                            onChange={e => setGeneralSubData(prev => ({ ...prev, transmissionKit: { ...prev.transmissionKit, ringType: e.target.value } }))}
                                            className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-[11px] text-foreground focus:border-primary appearance-none"
                                          >
                                            <option value="">Selecciona...</option>
                                            {TRANSMISSION_RINGS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                          </select>
                                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* 8. Discos de Embrague (Clutch) */}
                            {opt.id === "clutch" && (
                              <div className="flex gap-6 py-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
                                  <input 
                                    type="checkbox"
                                    checked={generalSubData.clutch.cambio}
                                    onChange={e => setGeneralSubData(prev => ({ ...prev, clutch: { ...prev.clutch, cambio: e.target.checked } }))}
                                    className="h-4 w-4 accent-primary rounded bg-zinc-900 border-zinc-800"
                                  />
                                  <span>¿Se cambió? (Discos de Embrague)</span>
                                </label>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

            {category === "Batería" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Marca de Batería</label>
                  <div className="relative">
                    <select value={selectedBrandOrType} onChange={e => setSelectedBrandOrType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="" disabled>Selecciona marca...</option>
                      {BATTERY_BRANDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                </div>
                {selectedBrandOrType === "Otro" && (
                  <input type="text" value={customBrand} onChange={e => setCustomBrand(e.target.value)} className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Especifique marca" required />
                )}

                <div className="space-y-1 pt-2">
                  <label className="text-xs text-zinc-400">Tipo / Tecnología</label>
                  <div className="relative">
                    <select value={batteryType} onChange={e => setBatteryType(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      {BATTERY_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs text-zinc-400">Modelo (Código)</label>
                  <div className="relative">
                    <select value={batteryModel} onChange={e => setBatteryModel(e.target.value)} required className="w-full rounded-lg border border-border bg-black/40 px-3 py-3 text-sm text-foreground focus:border-primary appearance-none">
                      <option value="" disabled>Selecciona modelo...</option>
                      {BATTERY_MODELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  </div>
                  {batteryModel === "Otro" && <input type="text" value={customBatteryModel} onChange={e => setCustomBatteryModel(e.target.value)} className="w-full mt-2 rounded-lg border border-border bg-black/40 px-3 py-3 text-sm focus:border-primary" placeholder="Ej. YTX5L-BS" required />}
                </div>
              </div>
            )}

            {category === "Clutch" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <input 
                    type="checkbox" 
                    id="clutchChanged" 
                    checked={clutchChanged} 
                    onChange={e => setClutchChanged(e.target.checked)} 
                    className="w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-background" 
                  />
                  <label htmlFor="clutchChanged" className="text-sm font-medium text-white cursor-pointer">
                    ¿Se cambiaron los discos de embrague?
                  </label>
                </div>
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
              onChange={handleNotesChange}
              rows={4}
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

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-zinc-400">Cargando formulario...</div>}>
      <NewMaintenanceForm />
    </Suspense>
  );
}
