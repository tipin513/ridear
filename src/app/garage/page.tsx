"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { initializeUserProfile, UserProfile, subscribeToUserProfile, subscribeToMaintenanceRecords, MaintenanceRecord, subscribeToDigitalDocuments, DigitalDocument, uploadUserImage, updateUserProfile, migrateUserToMultiBike, subscribeToBikes, Bike } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import OnboardingTour from "@/components/OnboardingTour";
import { Camera, Settings, ShieldAlert, ShieldCheck, AlertTriangle, Bike as BikeIcon, LogOut, FileWarning, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";

export default function GaragePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [allRecords, setAllRecords] = useState<MaintenanceRecord[]>([]);
  const [documents, setDocuments] = useState<DigitalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOnboardingComplete = async () => {
    if (user) {
      await updateUserProfile(user.uid, { hasCompletedOnboarding: true });
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploadingPhoto(true);
      const photoURL = await uploadUserImage(user.uid, file, 'avatar');
      await updateUserProfile(user.uid, { photoURL });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("Hubo un problema al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    let unsubProfile: () => void;
    let unsubRecords: () => void;

    const setupSubscriptions = async () => {
      try {
        if (user) {
          // Fase 7: Run Migration if needed
          try {
            await migrateUserToMultiBike(user.uid);
          } catch (migErr) {
            console.warn("Migration error (can be ignored if cached):", migErr);
          }
          
          await initializeUserProfile(user);
          
          unsubProfile = subscribeToUserProfile(user.uid, (data) => {
            setProfile(data);
          });

          subscribeToBikes(user.uid, (data) => {
            setBikes(data);
          });
          
          unsubRecords = subscribeToMaintenanceRecords(user.uid, (records) => {
            setAllRecords(records);
          });
          
          subscribeToDigitalDocuments(user.uid, (docs) => {
            setDocuments(docs);
          });
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      setupSubscriptions();
    }

    return () => {
      if (unsubProfile) unsubProfile();
      if (unsubRecords) unsubRecords();
    };
  }, [user, authLoading, router]);

  if (authLoading || loading || !user || !profile) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  // Phase 7: Derived state for currently selected bike
  const currentBike = bikes.find(b => b.id === profile.currentBikeId) || bikes[0];
  const currentBikeRecords = allRecords.filter(r => r.bikeId === currentBike?.id);
  const latestOilService = currentBikeRecords.find(r => r.category === "Fluidos" || r.category === "Aceite");

  // Smart Alerts Logic (per bike) - Oil
  let alertStatus = "unknown";
  let remainingKm = 0;
  
  if (latestOilService && currentBike && currentBike.serviceIntervals) {
    const nextServiceAt = latestOilService.mileage + currentBike.serviceIntervals.oil;
    remainingKm = nextServiceAt - currentBike.mileage;
    
    if (remainingKm <= 500) alertStatus = "danger";
    else if (remainingKm <= 1500) alertStatus = "warning";
    else alertStatus = "success";
  }

  // Smart Alerts Logic (per bike) - Chain Lube
  let chainAlertStatus = "unknown";
  let chainRemainingKm = 0;
  const CHAIN_LUBE_INTERVAL = currentBike?.chainLubeInterval || 500;

  if (currentBike?.lastChainLubeMileage && currentBike) {
    const nextLubeAt = currentBike.lastChainLubeMileage + CHAIN_LUBE_INTERVAL;
    chainRemainingKm = nextLubeAt - currentBike.mileage;
    
    if (chainRemainingKm <= 50) chainAlertStatus = "danger";
    else if (chainRemainingKm <= 200) chainAlertStatus = "warning";
    else chainAlertStatus = "success";
  }

  const AlertIcon = alertStatus === "danger" ? ShieldAlert : alertStatus === "warning" ? AlertTriangle : ShieldCheck;
  const ChainAlertIcon = chainAlertStatus === "danger" ? ShieldAlert : chainAlertStatus === "warning" ? AlertTriangle : ShieldCheck;
  
  const alertColors = {
    danger: "text-red-500 border-red-500/20 bg-red-500/5",
    warning: "text-yellow-500 border-yellow-500/20 bg-yellow-500/5",
    success: "text-green-500 border-green-500/20 bg-green-500/5",
    unknown: "text-zinc-400 border-zinc-800 bg-zinc-900"
  };

  // Documents Alert Logic (per bike + user globals)
  const expiringDocs = documents.filter(doc => {
    // Check if document belongs to this bike OR is a global user doc (like licencia)
    if (doc.type !== 'licencia' && doc.bikeId !== currentBike?.id) return false;
    if (!doc.expiryDate) return false;

    const expiry = new Date(doc.expiryDate).getTime();
    const now = new Date().getTime();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30; // 30 days or already expired
  });

  const handleBikeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBikeId = e.target.value;
    if (newBikeId === "add_new") {
      router.push("/garage/add-bike");
    } else if (profile && user) {
      await updateUserProfile(user.uid, { currentBikeId: newBikeId });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner / Cover de la moto */}
      <div className="relative h-48 w-full bg-zinc-800" id="tour-avatar">
        {currentBike?.bannerURL ? (
          <img 
            src={currentBike.bannerURL} 
            alt="Banner Moto" 
            className="h-full w-full object-cover" 
            style={{ objectPosition: `50% ${currentBike.bannerPositionY !== undefined ? currentBike.bannerPositionY : 50}%` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BikeIcon className="h-12 w-12 text-zinc-600 opacity-50" />
          </div>
        )}
        
        {/* Avatar superpuesto */}
        <div className="absolute -bottom-10 left-4">
          <div className="relative w-fit">
            <div className="h-20 w-20 rounded-full border-4 border-background bg-zinc-700 overflow-hidden relative group">
              {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className={`h-full w-full object-cover ${isUploadingPhoto ? 'opacity-50' : ''}`} />
            ) : (
              <div className="flex h-full items-center justify-center text-xl font-bold">
                {profile.displayName?.charAt(0) || "U"}
              </div>
            )}
            {/* Loading Overlay */}
            {isUploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          
          {/* Edit Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="absolute bottom-0 right-0 rounded-full bg-zinc-800 p-1.5 border border-background shadow-lg text-white hover:text-primary transition-colors disabled:opacity-50"
          >
            <Camera size={14} />
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleProfileImageChange} 
            className="hidden" 
          />
          </div>
        </div>
      </div>

      <div className="px-4 pt-14">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.displayName || "Rider"}</h1>
            <p className="text-sm text-zinc-400">{profile.email}</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {bikes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-16 w-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                <BikeIcon size={32} className="text-zinc-600" />
              </div>
              <h2 className="text-lg font-medium text-white mb-2">Tu Garage está vacío</h2>
              <p className="text-sm text-zinc-400 max-w-[250px] mb-6">
                Agrega tu primera moto para empezar a llevar su bitácora, documentos y alertas de mantenimiento.
              </p>
              <Link href="/garage/add-bike" className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                + Añadir mi Moto
              </Link>
            </div>
          ) : (
            <>
              {/* Bike Selector */}
              <div className="relative mb-4" id="tour-selector">
                <select 
                  value={currentBike?.id || ""} 
                  onChange={handleBikeChange}
                  className="w-full appearance-none rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white font-semibold focus:border-primary focus:outline-none"
                >
                  {bikes.map(bike => (
                    <option key={bike.id} value={bike.id}>
                      {bike.brand} {bike.model} ({bike.year})
                    </option>
                  ))}
                  <option value="add_new">+ Añadir nueva moto...</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
              </div>

              <div className="rounded-xl border border-border bg-card p-4" id="tour-ficha">
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-primary">Ficha Técnica</h2>
                  <Link href="/garage/edit" className="text-zinc-400 hover:text-white transition-colors">
                    <Settings size={20} />
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">Marca</p>
                    <p className="font-medium text-foreground">{currentBike?.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Modelo</p>
                    <p className="font-medium text-foreground">{currentBike?.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Año</p>
                    <p className="font-medium text-foreground">{currentBike?.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Kilometraje Actual</p>
                    <div className="flex items-end gap-1">
                      <p className="text-xl font-bold text-primary">{currentBike?.mileage}</p>
                      <p className="text-xs text-zinc-400 mb-1">km</p>
                    </div>
                  </div>
                  {(currentBike?.frontTirePressure || currentBike?.rearTirePressure) && (
                    <div className="col-span-2 pt-2 border-t border-white/5 mt-2 flex gap-6">
                      {currentBike?.frontTirePressure && (
                        <div>
                          <p className="text-xs text-zinc-500">Presión Delantera</p>
                          <p className="font-medium text-foreground">{currentBike.frontTirePressure} PSI</p>
                        </div>
                      )}
                      {currentBike?.rearTirePressure && (
                        <div>
                          <p className="text-xs text-zinc-500">Presión Trasera</p>
                          <p className="font-medium text-foreground">{currentBike.rearTirePressure} PSI</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`rounded-xl border p-4 flex gap-3 ${alertColors[alertStatus as keyof typeof alertColors]}`}>
                <AlertIcon className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium">Próximo Service (Aceite)</h3>
                  {alertStatus === "unknown" ? (
                    <p className="text-xs mt-1 opacity-80">Registrá un cambio de Aceite en la bitácora para activar alertas.</p>
                  ) : alertStatus === "danger" && remainingKm < 0 ? (
                    <p className="text-xs mt-1 opacity-80">¡Te pasaste del service por {Math.abs(remainingKm)} km! Cambialo urgente.</p>
                  ) : (
                    <p className="text-xs mt-1 opacity-80">Te quedan aproximadamente <strong>{remainingKm} km</strong> para el próximo cambio.</p>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border p-4 flex gap-3 ${alertColors[chainAlertStatus as keyof typeof alertColors]} mt-4`}>
                <ChainAlertIcon className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium">Lubricación de Cadena</h3>
                  {chainAlertStatus === "unknown" ? (
                    <p className="text-xs mt-1 opacity-80">Registrá una limpieza de cadena o cambio de kit para iniciar el contador de 500 km.</p>
                  ) : chainAlertStatus === "danger" && chainRemainingKm < 0 ? (
                    <p className="text-xs mt-1 opacity-80">¡Cadena reseca! Te pasaste por {Math.abs(chainRemainingKm)} km. Lubricala para evitar desgaste.</p>
                  ) : (
                    <p className="text-xs mt-1 opacity-80">Próxima limpieza y lubricación en <strong>{chainRemainingKm} km</strong>.</p>
                  )}
                </div>
              </div>
              
              {/* Documents Alert (only show if there are expiring docs) */}
              {expiringDocs.length > 0 && (
                <Link href="/documentos">
                  <div className="rounded-xl border p-4 flex gap-3 text-red-500 border-red-500/20 bg-red-500/5 mt-4 transition-all hover:bg-red-500/10">
                    <FileWarning className="h-6 w-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium">Documentos por vencer</h3>
                      <p className="text-xs mt-1 opacity-80">
                        Tenés {expiringDocs.length} documento{expiringDocs.length > 1 ? 's' : ''} vencido o próximo a vencer. Toca aquí para revisar tus Documentos.
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />

      {profile && bikes.length > 0 && !profile.hasCompletedOnboarding && (
        <OnboardingTour onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}
