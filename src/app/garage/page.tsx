"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { initializeUserProfile, UserProfile, subscribeToUserProfile, subscribeToMaintenanceRecords, MaintenanceRecord } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Camera, Settings, ShieldAlert, ShieldCheck, AlertTriangle, Bike } from "lucide-react";
import Link from "next/link";

export default function GaragePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestOilService, setLatestOilService] = useState<MaintenanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Asegurar que el perfil exista primero
          await initializeUserProfile(user);
          
          unsubProfile = subscribeToUserProfile(user.uid, (data) => {
            setProfile(data);
          });
          
          unsubRecords = subscribeToMaintenanceRecords(user.uid, (records) => {
            const oilService = records.find(r => r.category === "Fluidos");
            setLatestOilService(oilService || null);
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

  // Smart Alerts Logic
  let alertStatus = "unknown";
  let remainingKm = 0;
  
  if (latestOilService && profile.bikeInfo && profile.serviceIntervals) {
    const nextServiceAt = latestOilService.mileage + profile.serviceIntervals.oil;
    remainingKm = nextServiceAt - profile.bikeInfo.mileage;
    
    if (remainingKm <= 500) alertStatus = "danger";
    else if (remainingKm <= 1500) alertStatus = "warning";
    else alertStatus = "success";
  }

  const AlertIcon = alertStatus === "danger" ? ShieldAlert : alertStatus === "warning" ? AlertTriangle : ShieldCheck;
  const alertColors = {
    danger: "text-red-500 border-red-500/20 bg-red-500/5",
    warning: "text-yellow-500 border-yellow-500/20 bg-yellow-500/5",
    success: "text-green-500 border-green-500/20 bg-green-500/5",
    unknown: "text-zinc-400 border-zinc-800 bg-zinc-900"
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner / Cover de la moto */}
      <div className="relative h-48 w-full bg-zinc-800">
        {profile.bannerURL ? (
          <img src={profile.bannerURL} alt="Banner Moto" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Bike className="h-12 w-12 text-zinc-600 opacity-50" />
          </div>
        )}
        
        {/* Avatar superpuesto */}
        <div className="absolute -bottom-10 left-4">
          <div className="h-20 w-20 rounded-full border-4 border-background bg-zinc-700 overflow-hidden">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xl font-bold">
                {profile.displayName?.charAt(0) || "U"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-14">
        <h1 className="text-2xl font-bold text-foreground">{profile.displayName || "Rider"}</h1>
        <p className="text-sm text-zinc-400">{profile.email}</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
              <h2 className="text-lg font-semibold text-primary">Ficha Técnica</h2>
              <Link href="/garage/edit" className="text-zinc-400 hover:text-white transition-colors">
                <Settings size={20} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Marca</p>
                <p className="font-medium text-foreground">{profile.bikeInfo?.brand}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Modelo</p>
                <p className="font-medium text-foreground">{profile.bikeInfo?.model}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Año</p>
                <p className="font-medium text-foreground">{profile.bikeInfo?.year}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Kilometraje Actual</p>
                <div className="flex items-end gap-1">
                  <p className="text-xl font-bold text-primary">{profile.bikeInfo?.mileage}</p>
                  <p className="text-xs text-zinc-400 mb-1">km</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-xl border p-4 flex gap-3 ${alertColors[alertStatus as keyof typeof alertColors]}`}>
            <AlertIcon className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium">Próximo Service (Aceite)</h3>
              {alertStatus === "unknown" ? (
                <p className="text-xs mt-1 opacity-80">Registrá un cambio de Fluidos en la bitácora para activar las alertas predictivas.</p>
              ) : alertStatus === "danger" && remainingKm < 0 ? (
                <p className="text-xs mt-1 opacity-80">¡Te pasaste del service por {Math.abs(remainingKm)} km! Cambialo urgente.</p>
              ) : (
                <p className="text-xs mt-1 opacity-80">Te quedan aproximadamente <strong>{remainingKm} km</strong> para el próximo cambio.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
