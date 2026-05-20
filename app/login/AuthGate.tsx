"use client";

// Portão de autenticação do MVP inteiro. Envolve {children} no layout raiz.
// - rota /login: passa direto (a própria tela cuida do "já logado").
// - sem sessão: redireciona pra /login (sem piscar conteúdo protegido).
// - com sessão: barra fina "logado como X · Sair" + conteúdo.
//
// Não usa o Shell nem toca nas páginas dos colegas: a proteção fica toda
// concentrada aqui + uma linha no layout.tsx.

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { sair, sessaoAtual } from "./authApi";
import type { Sessao } from "./types";

function Placeholder() {
  // Mesmo visual neutro para "verificando" e "redirecionando" (sem pulo).
  return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "#a1a1aa" }}>
      Carregando…
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [sessao, setSessao] = useState<Sessao | null>(null);

  const ehLogin = pathname === "/login";

  useEffect(() => {
    const s = sessaoAtual();
    setSessao(s);
    if (ehLogin) {
      // A tela de login é pública; ela mesma redireciona se já logado.
      setVerificando(false);
      return;
    }
    if (!s) {
      router.replace("/login");
      // mantém `verificando` (placeholder) até a rota trocar — sem flash
      return;
    }
    setVerificando(false);
  }, [pathname, ehLogin, router]);

  if (ehLogin) return <>{children}</>;

  if (verificando || !sessao) return <Placeholder />;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          padding: "8px 16px",
          fontSize: 13,
          color: "#52525b",
        }}
      >
        <span>
          Logado como <strong>{sessao.usuario.nome}</strong>
        </span>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => {
            sair();
            router.replace("/login");
          }}
        >
          <LogOut size={15} /> Sair
        </button>
      </div>
      {children}
    </>
  );
}
