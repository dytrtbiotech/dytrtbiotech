"use client";

import LoginModal from "@/components/LoginModal";
import { loadAuthUser } from "@/lib/screening/storage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PrihlaseniPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loadAuthUser()) {
      router.replace("/prehled");
      return;
    }
    setReady(true);
  }, [router]);

  const onClose = useCallback(() => {
    router.push("/");
  }, [router]);

  if (!ready) {
    return <div className="app-loading">Načítání…</div>;
  }

  return (
    <div className="login-page">
      <LoginModal open onClose={onClose} />
    </div>
  );
}
