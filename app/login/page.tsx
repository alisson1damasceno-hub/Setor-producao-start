"use client";

// Tela /login — porteiro de demonstração. Alterna entre "Entrar" e
// "Criar conta". Sem Shell (login é pré-autenticação). Tema verde,
// classes existentes do globals.css. Conversa só com authApi.

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { entrar, registrar, sessaoAtual } from "./authApi";

type Modo = "entrar" | "criar";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(true);

  // Já logado? Vai direto pro dashboard (segura o render até checar).
  useEffect(() => {
    if (sessaoAtual()) {
      router.replace("/");
    } else {
      setVerificando(false);
    }
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    try {
      setEnviando(true);
      if (modo === "entrar") {
        await entrar({ usuario, senha });
      } else {
        await registrar({ nome, usuario, senha });
      }
      router.replace("/");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível continuar.");
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#a1a1aa" }}>
        Carregando…
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div className="section-title">
          <div>
            <h3>ProducaoStart</h3>
            <p>
              {modo === "entrar"
                ? "Entre para acessar o sistema."
                : "Crie sua conta para começar."}
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {modo === "criar" && (
            <div className="form-group">
              <label className="required">Nome</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="form-group">
            <label className="required">Usuário</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="ex: admin"
            />
          </div>

          <div className="form-group">
            <label className="required">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {erro && (
            <div className="badge badge-orange" style={{ alignSelf: "flex-start" }}>
              {erro}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={enviando}
          >
            {modo === "entrar" ? <LogIn size={17} /> : <UserPlus size={17} />}{" "}
            {enviando
              ? "Aguarde…"
              : modo === "entrar"
              ? "Entrar"
              : "Criar conta"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 13, color: "#71717a" }}>
          {modo === "entrar" ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setModo("criar");
                  setErro(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#14532d",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setModo("entrar");
                  setErro(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#14532d",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Entrar
              </button>
            </>
          )}
        </p>

        {modo === "entrar" && (
          <p style={{ marginTop: 8, fontSize: 12, color: "#a1a1aa" }}>
            Demonstração: usuário <strong>admin</strong> · senha{" "}
            <strong>admin123</strong>
          </p>
        )}
      </div>
    </div>
  );
}
