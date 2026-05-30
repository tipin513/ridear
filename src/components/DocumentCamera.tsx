"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCcw } from 'lucide-react';

interface DocumentCameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function DocumentCamera({ onCapture, onClose }: DocumentCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("No pudimos acceder a la cámara. Por favor, revisa los permisos.");
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // We want to crop the center area. Let's say the overlay is 80% width, and ID aspect ratio is ~ 1.58 (standard ID card)
    // We will just capture the full frame for simplicity and reliability across different camera resolutions,
    // but we can try to crop it. Let's do a simple full frame capture for maximum quality, 
    // as cropping in JS can sometimes lose too much resolution if not handled perfectly.
    // However, the user asked for "crop automático". We will calculate the crop box.

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // The overlay in CSS is e.g. 85% width.
    const overlayWidthRatio = 0.85;
    const overlayHeightRatio = overlayWidthRatio * (videoWidth / videoHeight) * (1 / 1.58); // Approx ID ratio relative to screen
    // It's safer to just capture the whole image and let the user see it, or crop precisely.
    // Let's do a precise crop based on the center.
    const cropWidth = videoWidth * 0.85;
    const cropHeight = cropWidth / 1.58;
    
    const startX = (videoWidth - cropWidth) / 2;
    const startY = (videoHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw only the cropped portion
    ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `document_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Stop stream before closing
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => {
          if (stream) stream.getTracks().forEach(t => t.stop());
          onClose();
        }} className="p-2 text-white">
          <X size={28} />
        </button>
        <button onClick={startCamera} className="p-2 text-white">
          <RefreshCcw size={24} />
        </button>
      </div>

      {error ? (
        <div className="text-white text-center p-6">
          <p>{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-black rounded-xl font-bold">Volver</button>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay Mask */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            background: 'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.7) 150%)'
          }}>
            <div className="w-full h-full flex items-center justify-center">
              {/* The Crop Box */}
              <div 
                className="border-2 border-primary rounded-xl relative"
                style={{ width: '85%', aspectRatio: '1.58' }}
              >
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/50 font-medium text-sm text-center px-4">Ubica el documento dentro del recuadro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center z-10 bg-gradient-to-t from-black/80 to-transparent">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/40 transition-colors active:scale-95"
        >
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
            <Camera className="text-black" size={28} />
          </div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
