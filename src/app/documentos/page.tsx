"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { subscribeToDigitalDocuments, DigitalDocument, uploadDigitalDocument, deleteDigitalDocument, subscribeToUserProfile, UserProfile } from "@/lib/services";
import BottomNav from "@/components/BottomNav";
import DocumentCamera from "@/components/DocumentCamera";
import { Camera, Image as ImageIcon, Plus, Trash2, X, FileWarning, CheckCircle2, ShieldAlert, Loader2, Calendar, FileText, FlipHorizontal, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function DocumentosPage() {
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
  
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [showCameraFor, setShowCameraFor] = useState<'front' | 'back' | 'single' | null>(null);

  // Image Viewer state
  const [selectedDoc, setSelectedDoc] = useState<DigitalDocument | null>(null);
  const [showingBack, setShowingBack] = useState(false);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (scale === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    const maxPan = 500 * scale;
    const boundedX = Math.max(-maxPan, Math.min(maxPan, newX));
    const boundedY = Math.max(-maxPan, Math.min(maxPan, newY));
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      setPosition({ x: 0, y: 0 });
    }
  };

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

  useEffect(() => {
    // Reset files when changing type
    setFrontFile(null);
    setBackFile(null);
  }, [selectedType]);

  const openGallery = (side: 'front' | 'back' | 'single', acceptPdf: boolean) => {
    if (galleryInputRef.current) {
      galleryInputRef.current.accept = acceptPdf ? "image/*,application/pdf" : "image/*";
      galleryInputRef.current.dataset.side = side;
      galleryInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const side = e.target.dataset.side;
    if (side === 'front' || side === 'single') setFrontFile(file);
    else if (side === 'back') setBackFile(file);
    
    if (e.target) e.target.value = ''; // reset
  };

  const handleCameraCapture = (file: File) => {
    if (showCameraFor === 'front' || showCameraFor === 'single') setFrontFile(file);
    else if (showCameraFor === 'back') setBackFile(file);
    setShowCameraFor(null);
  };

  const executeUpload = async () => {
    if (!user || !frontFile) return;

    try {
      setIsUploading(true);
      const finalExpiryDate = selectedType === 'cedula' ? "" : expiryDate;
      await uploadDigitalDocument(user.uid, selectedType, frontFile, backFile, finalExpiryDate, customType, profile?.currentBikeId);
      
      setShowUploadModal(false);
      setSelectedType('licencia');
      setCustomType("");
      setExpiryDate("");
      setFrontFile(null);
      setBackFile(null);
    } catch (error) {
      console.error("Error subiendo documento:", error);
      alert("Hubo un error al subir el documento.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: DigitalDocument) => {
    if (!user) return;
    if (confirm("¿Estás seguro que querés eliminar este documento? Esta acción no se puede deshacer.")) {
      try {
        await deleteDigitalDocument(user.uid, doc.id, doc.storagePath, doc.backStoragePath);
        setSelectedDoc(null);
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

  const docTypes = [
    { id: 'licencia', name: 'Licencia de Conducir' },
    { id: 'cedula', name: 'Cédula Verde' },
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

  const requiresFrontBack = selectedType === 'licencia' || selectedType === 'cedula';

  const renderFilePreview = (file: File | null, side: 'front'|'back'|'single', label: string, acceptPdf: boolean) => {
    if (file) {
      const isPdf = file.type === 'application/pdf';
      return (
        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center group">
          {isPdf ? (
             <div className="flex flex-col items-center justify-center text-zinc-400">
               <FileText size={32} className="mb-2 text-primary" />
               <span className="text-xs">{file.name}</span>
             </div>
          ) : (
            <img src={URL.createObjectURL(file)} alt={label} className="w-full h-full object-cover opacity-70" />
          )}
          <button 
            onClick={() => side === 'front' || side === 'single' ? setFrontFile(null) : setBackFile(null)}
            className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-red-500/80 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase text-white">{label}</div>
        </div>
      );
    }

    return (
      <div className="w-full h-32 rounded-xl border-2 border-dashed border-white/10 bg-zinc-900/50 flex flex-col items-center justify-center gap-2 relative">
        <div className="absolute top-2 left-2 text-[10px] font-bold uppercase text-zinc-500">{label}</div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setShowCameraFor(side)} className="p-3 bg-zinc-800 rounded-full text-primary hover:bg-zinc-700 transition-colors" title="Tomar foto">
            <Camera size={20} />
          </button>
          <button onClick={() => openGallery(side, acceptPdf)} className="p-3 bg-zinc-800 rounded-full text-primary hover:bg-zinc-700 transition-colors" title="Subir archivo">
            <ImageIcon size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
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
                    className="h-32 w-full bg-zinc-900 relative cursor-pointer flex items-center justify-center"
                    onClick={() => {
                      if (doc.isPdf) {
                         window.open(doc.imageUrl, '_blank');
                      } else {
                         setSelectedDoc(doc);
                         setShowingBack(false);
                         resetZoom();
                      }
                    }}
                  >
                    {doc.isPdf ? (
                      <div className="flex flex-col items-center text-zinc-400 z-10">
                        <FileText size={40} className="text-primary mb-2" />
                        <span className="text-xs font-medium">Ver PDF</span>
                      </div>
                    ) : (
                      <img src={doc.imageUrl} alt={docName} className="h-full w-full object-cover opacity-80 absolute inset-0" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                    
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
                      <div>
                        <h3 className="font-semibold text-white drop-shadow-md">{docName}</h3>
                        {doc.expiryDate && (
                          <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md w-fit ${status.bg} ${status.color}`}>
                            <status.icon size={10} />
                            {status.text}
                          </div>
                        )}
                      </div>
                      {(doc.backImageUrl || doc.isPdf) && (
                        <div className="bg-black/50 p-1.5 rounded-full backdrop-blur-md text-white">
                          {doc.isPdf ? <FileText size={14} /> : <FlipHorizontal size={14} />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto pb-8">
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

              {selectedType !== 'cedula' && (
                <div className="animate-in fade-in slide-in-from-top-2">
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
              )}

              <div className="pt-2">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Archivos</label>
                {requiresFrontBack ? (
                  <div className="grid grid-cols-2 gap-3">
                    {renderFilePreview(frontFile, 'front', 'Frente', false)}
                    {renderFilePreview(backFile, 'back', 'Dorso (Opcional)', false)}
                  </div>
                ) : (
                  renderFilePreview(frontFile, 'single', 'Documento (Imagen o PDF)', true)
                )}
              </div>

              <input 
                type="file" 
                ref={galleryInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
              />

              <button 
                onClick={executeUpload}
                disabled={isUploading || !frontFile || (selectedType === 'otro' && !customType)}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <><Loader2 className="animate-spin" size={20} /> Guardando...</>
                ) : (
                  "Guardar Documento"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCameraFor && (
        <DocumentCamera 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCameraFor(null)} 
        />
      )}

      {/* Image Viewer Lightbox */}
      {selectedDoc && !selectedDoc.isPdf && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center p-4 z-10">
            <button 
              onClick={() => handleDelete(selectedDoc)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20"
            >
              <Trash2 size={16} /> Eliminar
            </button>
            <button onClick={() => setSelectedDoc(null)} className="p-2 bg-white/10 rounded-full text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {/* Interactive Image Container */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none">
              <img 
                src={showingBack && selectedDoc.backImageUrl ? selectedDoc.backImageUrl : selectedDoc.imageUrl} 
                alt="Documento ampliado" 
                className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-150 ease-out select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  cursor: scale > 1 ? 'grab' : 'zoom-in',
                  touchAction: 'none'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={handleDoubleTap}
              />
            </div>

            {/* Quick Zoom Controls Floating Overlay */}
            <div className="absolute bottom-6 flex items-center gap-4 bg-zinc-900/80 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md z-20">
              <button 
                onClick={() => setScale(prev => Math.max(1, prev - 0.5))} 
                disabled={scale <= 1}
                className="p-1.5 text-white/70 hover:text-white disabled:opacity-30"
              >
                <ZoomOut size={18} />
              </button>
              
              <span className="text-xs font-mono text-white/80 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>

              {scale > 1 && (
                <button 
                  onClick={resetZoom} 
                  className="p-1.5 text-primary hover:text-primary-hover"
                  title="Restablecer"
                >
                  <RotateCcw size={16} />
                </button>
              )}

              <button 
                onClick={() => setScale(prev => Math.min(4, prev + 0.5))} 
                disabled={scale >= 4}
                className="p-1.5 text-white/70 hover:text-white disabled:opacity-30"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            
            <p className="absolute bottom-16 text-[10px] text-zinc-500 font-medium select-none pointer-events-none">
              Doble toque para zoom · Arrastrá para mover
            </p>
          </div>
          
          <div className="p-6 bg-gradient-to-t from-black to-transparent">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedDoc.type === 'otro' ? selectedDoc.customTypeName : docTypes.find(t => t.id === selectedDoc.type)?.name}
                  {selectedDoc.backImageUrl && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                      {showingBack ? 'Dorso' : 'Frente'}
                    </span>
                  )}
                </h2>
                {selectedDoc.expiryDate && (
                  <p className="text-zinc-400 text-sm mt-1">
                    Vence el: {new Date(selectedDoc.expiryDate + 'T00:00:00').toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {selectedDoc.backImageUrl && (
                <button 
                  onClick={() => { setShowingBack(!showingBack); resetZoom(); }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors backdrop-blur-md"
                >
                  <FlipHorizontal size={18} />
                  Ver {showingBack ? 'Frente' : 'Dorso'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
