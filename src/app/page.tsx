"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/garage");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-4 text-sm text-zinc-400">Arrancando motores...</p>
      </div>
    </div>
  );
}
