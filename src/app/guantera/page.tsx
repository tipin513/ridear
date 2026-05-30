"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeToDigitalDocuments, DigitalDocument, uploadDigitalDocument, deleteDigitalDocument, subscribeToUserProfile, UserProfile } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import { Camera, Image as ImageIcon, Plus, Trash2, X, FileWarning, CheckCircle2, ShieldAlert, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

export default function GuanteraPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<DigitalDocument[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType, setSelectedType] = useState<DigitalDocument['type']>('licencia');
  const [customType, setCustomType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  
  // Image Viewer state
  const [selectedImage, setSelectedImage] = useState<DigitalDocument | null>(null);

  // File Inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const unsubProfile = subscribeToUserProfile(user.uid, (data) => {
        setProfile(data);
      });

      const unsubDocs = subscribeToDigitalDocuments(user.uid, (docs) => {
        setDocuments(docs);
        setLoading(false);
      });
      
      return () => {
        unsubProfile();
        unsubDocs();
      };
    }
  }, [user, authLoading, router]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      await uploadDigitalDocument(user.uid, selectedType, file, expiryDate, customType, profile?.currentBikeId);
      setShowUploadModal(false);
      
      // Reset form
      setSelectedType('licencia');
      setCustomType("");
      setExpiryDate("");
    } catch (error) {
      console.error("Error subiendo documento:", error);
      alert("Hubo un error al subir el documento.");
    } finally {
      setIsUploading(false);
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleDelete = async (doc: DigitalDocument) => {
    if (!user) return;
    if (confirm("¿Estás seguro que querés eliminar este documento? Esta acción no se puede deshacer.")) {
      try {
        await deleteDigitalDocument(user.uid, doc.id, doc.storagePath);
        setSelectedImage(null); // Close viewer if open
      } catch (error) {
        console.error("Error al eliminar documento:", error);
        alert("Error al eliminar el documento.");
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  // Define document categories for rendering
  const docTypes = [
    { id: 'licencia', name: 'Licencia de Conducir' },
    { id: 'cedula', name: 'Cédula Verde / Azul' },
    { id: 'seguro', name: 'Póliza de Seguro' },
    { id: 'vtv', name: 'VTV / RTO' },
    { id: 'otro', name: 'Otro Documento' }
  ];

  const getDocStatus = (expiry?: string) => {
    if (!expiry) return { status: 'ok', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2, text: 'Vigente' };
    
    const expDate = new Date(expiry).getTime();
    const now = new Date().getTime();
    const daysLeft = (expDate - now) / (1000 * 60 * 60 * 24);

    if (daysLeft < 0) return { status: 'expired', color: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert, text: 'Vencido' };
    if (daysLeft <= 30) return { status: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: FileWarning, text: `Vence en ${Math.ceil(daysLeft)} días` };
    
    return { status: 'ok', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2, text: 'Vigente' };
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Mis Documentos</h1>
          <p className="text-xs text-zinc-400">Tus papeles seguros e impermeables</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black shadow-lg shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 border border-white/5 mb-4">
              <Camera size={32} className="text-zinc-600" />
            </div>
            <h2 className="text-lg font-medium text-white mb-2">No hay documentos</h2>
            <p className="text-sm text-zinc-400 max-w-[250px]">
              Agregá la licencia, cédula o seguro de tu moto para tenerlos siempre a mano y recibir alertas antes de que venzan.
            </p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black"
            >
              Agregar Primer Documento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {documents
              .filter(doc => doc.type === 'licencia' || doc.bikeId === profile?.currentBikeId)
              .map(doc => {
              const status = getDocStatus(doc.expiryDate);
              const docName = doc.type === 'otro' ? (doc.customTypeName || 'Documento') : docTypes.find(t => t.id === doc.type)?.name;
              
              return (
                <div 
                  key={doc.id} 
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-card transition-all active:scale-[0.98]"
                >
                  <div 
                    className="h-32 w-full bg-zinc-900 relative cursor-pointer"
                    onClick={() => setSelectedImage(doc)}
                  >
                    <img src={doc.imageUrl} alt={docName} className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                      <div>
                        <h3 className="font-semibold text-white drop-shadow-md">{docName}</h3>
                        {doc.expiryDate && (
                          <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md w-fit ${status.bg} ${status.color}`}>
                            <status.icon size={10} />
                            {status.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nuevo Documento</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-zinc-500 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Tipo de Documento</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
                >
                  {docTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {selectedType === 'otro' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre del Documento</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Permiso de circulación"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Fecha de Vencimiento <span className="text-xs opacity-50">(Opcional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="date" 
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 pl-10 pr-4 py-3 text-white focus:border-primary focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3">
                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={cameraInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={galleryInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />

                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading || (selectedType === 'otro' && !customType)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 p-4 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Camera className="text-primary" size={28} />
                  <span className="text-xs font-medium">Usar Cámara</span>
                </button>
                
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploading || (selectedType === 'otro' && !customType)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 p-4 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ImageIcon className="text-primary" size={28} />
                  <span className="text-xs font-medium">Desde Galería</span>
                </button>
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-primary text-sm mt-4">
                  <Loader2 className="animate-spin" size={16} />
                  Subiendo documento de forma segura...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 z-10">
            <button 
              onClick={() => handleDelete(selectedImage)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20"
            >
              <Trash2 size={16} /> Eliminar
            </button>
            <button onClick={() => setSelectedImage(null)} className="p-2 bg-white/10 rounded-full text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
            <img 
              src={selectedImage.imageUrl} 
              alt="Documento ampliado" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          
          <div className="p-6 bg-gradient-to-t from-black to-transparent">
            <h2 className="text-xl font-bold text-white">
              {selectedImage.type === 'otro' ? selectedImage.customTypeName : docTypes.find(t => t.id === selectedImage.type)?.name}
            </h2>
            {selectedImage.expiryDate && (
              <p className="text-zinc-400 text-sm mt-1">
                Vence el: {new Date(selectedImage.expiryDate + 'T00:00:00').toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
