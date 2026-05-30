"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Bike, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/garage");
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setIsAuthenticating(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-black">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1080&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>

      {/* Login Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
          
          <div className="flex flex-col items-center justify-center text-center">
            {/* Custom Logo Container */}
            <div className="relative mb-6 flex h-40 w-full items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Ridear Logo" 
                className="h-36 w-auto max-w-[280px] object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-transform duration-500 hover:scale-105" 
              />
            </div>
            
            <p className="mt-2 text-sm font-medium text-zinc-300">
              El garage virtual y la bitácora definitiva para tu moto.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-black shadow-lg transition-all hover:bg-zinc-200 hover:shadow-white/20 active:scale-95 disabled:opacity-70"
            >
              {isAuthenticating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </>
              )}
            </button>
            <p className="mt-6 text-center text-xs text-zinc-500">
              Al continuar, aceptas formar parte de la comunidad motera más grande.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
