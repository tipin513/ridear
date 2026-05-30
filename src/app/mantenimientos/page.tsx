"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeToMaintenanceRecords, deleteMaintenanceRecord, MaintenanceRecord, subscribeToUserProfile, UserProfile } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Plus, Wrench, Droplet, Cog, Trash2 } from "lucide-react";
import Link from "next/link";

export default function MaintenancesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Fluidos": return <Droplet size={20} className="text-blue-500" />;
      case "Desgaste": return <Cog size={20} className="text-orange-500" />;
      default: return <Wrench size={20} className="text-zinc-500" />;
    }
  };

  if (authLoading || loading || !user) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  const currentRecords = records.filter(r => r.bikeId === profile?.currentBikeId);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bitácora</h1>
          <p className="text-xs text-zinc-400">Historial de mantenimientos de tu moto actual</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        {currentRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
            <Wrench size={48} className="mb-4 opacity-20" />
            <p>Aún no tenés mantenimientos registrados para esta moto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentRecords.map((record) => (
              <div key={record.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 group hover:border-zinc-700 transition-colors">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  {getCategoryIcon(record.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">{record.type}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span>{new Date(record.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-medium text-primary">{record.mileage} km</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right flex items-center gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">${record.cost}</p>
                  </div>
                  {record.id && (
                    <button
                      onClick={() => handleDelete(record.id!)}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link 
        href="/mantenimientos/nuevo"
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-90"
      >
        <Plus size={28} />
      </Link>

      <BottomNav />
    </div>
  );
}
