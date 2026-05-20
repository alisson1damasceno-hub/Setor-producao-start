// Camada de autenticação (Service Layer). A tela e o AuthGate SÓ conversam
// com este arquivo. Só ele toca no localStorage — igual o produtosApi isola
// os dados de produto.
//
// FASE 1 (agora): usuários e sessão no localStorage. Porteiro de demonstração
// (NÃO é segurança real — qualquer um que abrir o código vê a senha).
// FASE 2 (back pronto): trocar o miolo por fetch(); assinaturas NÃO mudam.
// Contrato HTTP no fim do arquivo.

import type { Credenciais, NovoUsuario, Sessao, Usuario } from "./types";

const CHAVE_USUARIOS = "producaostart.usuarios";
const CHAVE_SESSAO = "producaostart.sessao";

// Usuário interno (com senha) — só existe dentro deste arquivo.
type UsuarioInterno = Usuario & { senha: string };

const atraso = (ms: number) => new Promise((r) => setTimeout(r, ms));

// localStorage só existe no navegador. Helpers seguros.
function temStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

// Seed preguiçoso: cria o usuário-semente na primeira leitura no cliente.
function lerUsuarios(): UsuarioInterno[] {
  if (!temStorage()) return [];
  const cru = window.localStorage.getItem(CHAVE_USUARIOS);
  if (!cru) {
    const semente: UsuarioInterno[] = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        nome: "Administrador",
        usuario: "admin",
        senha: "admin123",
      },
    ];
    window.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(semente));
    return semente;
  }
  try {
    const parsed = JSON.parse(cru);
    return Array.isArray(parsed) ? (parsed as UsuarioInterno[]) : [];
  } catch {
    return [];
  }
}

function salvarUsuarios(lista: UsuarioInterno[]): void {
  if (temStorage()) {
    window.localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
  }
}

function semSenha(u: UsuarioInterno): Usuario {
  return { id: u.id, nome: u.nome, usuario: u.usuario };
}

function criarSessao(u: UsuarioInterno): Sessao {
  const sessao: Sessao = {
    usuario: semSenha(u),
    token: crypto.randomUUID(), // fake; o back devolve um JWT
    criadaEm: new Date().toISOString(),
  };
  if (temStorage()) {
    window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }
  return sessao;
}

export async function entrar(cred: Credenciais): Promise<Sessao> {
  await atraso(300);
  const usuarios = lerUsuarios();
  const achado = usuarios.find(
    (u) => u.usuario === cred.usuario.trim() && u.senha === cred.senha
  );
  if (!achado) throw new Error("Usuário ou senha inválidos.");
  return criarSessao(achado);
}

export async function registrar(novo: NovoUsuario): Promise<Sessao> {
  await atraso(300);
  const nome = novo.nome.trim();
  const usuario = novo.usuario.trim();
  if (!nome || !usuario || !novo.senha) {
    throw new Error("Preencha nome, usuário e senha.");
  }
  const usuarios = lerUsuarios();
  if (usuarios.some((u) => u.usuario === usuario)) {
    throw new Error("Esse usuário já existe. Escolha outro.");
  }
  const criado: UsuarioInterno = {
    id: crypto.randomUUID(),
    nome,
    usuario,
    senha: novo.senha,
  };
  usuarios.push(criado);
  salvarUsuarios(usuarios);
  return criarSessao(criado);
}

export function sair(): void {
  if (temStorage()) window.localStorage.removeItem(CHAVE_SESSAO);
}

export function sessaoAtual(): Sessao | null {
  if (!temStorage()) return null;
  const cru = window.localStorage.getItem(CHAVE_SESSAO);
  if (!cru) return null;
  try {
    return JSON.parse(cru) as Sessao;
  } catch {
    return null; // JSON corrompido — trata como deslogado
  }
}

// ---------------------------------------------------------------------------
// CONTRATO PARA O COLEGA DO BACK (Fase 2 — HTTP). Mesmas assinaturas:
//
//   entrar       POST /auth/login     (Credenciais)  -> Sessao
//   registrar    POST /auth/register  (NovoUsuario)  -> Sessao
//   sair         POST /auth/logout    —              -> 204 (e limpa local)
//   sessaoAtual  GET  /auth/me        —              -> Sessao | 401
//
// const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
// Resposta não-ok => throw new Error(...). A SENHA nunca volta na resposta;
// o back deve guardar com hash (bcrypt/argon2) e devolver um JWT em `token`.
// ---------------------------------------------------------------------------
