# Especificação — Tela de Login (porteiro de demonstração, MVP inteiro)

- **Data:** 2026-05-19
- **Autor:** Bianca (front) + Claude (par/professor)
- **Status:** Design aprovado; aguardando revisão da spec
- **Branch de trabalho:** `front-entrega` (base = código real da equipe)

---

## 1. Contexto e objetivo

O MVP ProducaoStart está sendo refeito (front/back/banco). Esta spec cobre a
**tela de login do sistema inteiro**, feita **só no front**, no padrão
contract-first já usado em Produtos: lógica fake agora, contrato HTTP
documentado para o back implementar autenticação real depois.

**Objetivo:** porteiro de demonstração — pede usuário/senha, valida contra
dados fake, guarda sessão no navegador, libera o app; protege **todas** as
rotas (produtos, dashboard, ficha-técnica, ordens); permite criar conta e
sair. Não é segurança real (decisão consciente; segurança real é trabalho do
back, fora do escopo do front e do prazo).

### Não-objetivos

- Segurança real (hash de senha, JWT, sessão de servidor) — é do back.
- Recuperação de senha, verificação de e-mail, perfis/papéis.
- Editar páginas dos colegas (ficha-técnica/ordens) ou o `Shell`.
- Persistência em banco — usa `localStorage` (fake), isolado em `authApi`.

---

## 2. Decisões aprovadas

| Tema | Decisão |
|---|---|
| Tipo | Porteiro de demonstração (fake, contract-first) |
| Escopo | Login + cadastro + proteção de TODAS as rotas + logout |
| Abrangência | Sistema inteiro (via `AuthGate` no `app/layout.tsx`) |
| Proteção | Guarda no cliente (não middleware/cookie) — coerente com filosofia client-side; back faz segurança real depois |
| Sessão | `localStorage`, isolada em `authApi.ts` (só ele toca lá) |
| Usuário-semente | `admin` / `admin123` (funciona na hora da apresentação) |
| Visual | Tela centralizada, tema verde, classes existentes do `globals.css`, **sem `Shell`** (login é pré-autenticação) |
| Logout | Barra fina renderizada pelo `AuthGate` em todas as telas logadas — **não** mexe no `Shell` nem nas páginas dos colegas |
| Único arquivo de equipe tocado | `app/layout.tsx` (envolver `{children}` com `<AuthGate>`) — necessário e mínimo para auth do sistema todo |

---

## 3. Arquitetura

Novos arquivos isolados em `app/login/`:

```text
app/login/types.ts        contrato de tipos (sem código que roda)
app/login/authApi.ts      camada de auth fake + contrato HTTP do back
app/login/page.tsx        tela /login (Entrar / Criar conta)
app/login/AuthGate.tsx    "use client": protege o app + barra de logout
```

Mudança mínima: `app/layout.tsx` (server component) passa a renderizar
`<AuthGate>{children}</AuthGate>`. `AuthGate` é client component; `layout`
continua server component (padrão Next.js).

### 3.1 `types.ts`

```ts
export type Credenciais = { usuario: string; senha: string };

export type NovoUsuario = {
  nome: string;
  usuario: string;
  senha: string;
};

export type Usuario = {
  id: string;
  nome: string;
  usuario: string;
  // senha NÃO trafega de volta após login (boa prática, mesmo no fake)
};

export type Sessao = {
  usuario: Usuario;
  token: string; // fake agora; o back devolve um JWT depois
  criadaEm: string; // ISO 8601
};
```

### 3.2 `authApi.ts`

Interface pública (estável; não muda quando o back existir):

```ts
entrar(cred: Credenciais): Promise<Sessao>
registrar(novo: NovoUsuario): Promise<Sessao>   // cadastra e já loga
sair(): void
sessaoAtual(): Sessao | null
```

**Fase 1 (fake, agora):**
- Usuários guardados em `localStorage` chave `producaostart.usuarios`
  (inicia com semente `admin`/`admin123`, nome "Administrador").
- Sessão em `localStorage` chave `producaostart.sessao`.
- `entrar`: confere `usuario`+`senha`; ok → cria `Sessao`
  (`token = crypto.randomUUID()`), salva, retorna (sem a senha). Erro →
  `throw new Error("Usuário ou senha inválidos.")`.
- `registrar`: valida campos não-vazios; se `usuario` já existe →
  `throw new Error("Usuário já existe.")`; senão cria, salva, loga, retorna.
- `sair`: remove a chave da sessão.
- `sessaoAtual`: lê e faz parse da sessão (ou `null`). Tolera JSON inválido
  (retorna `null`). Atraso artificial (~300ms) só em `entrar`/`registrar`
  para exercitar o estado "enviando".

**Fase 2 (futura, HTTP) — contrato para o back:**

| Função | HTTP | Corpo → Resposta |
|---|---|---|
| `entrar` | `POST /auth/login` | `Credenciais` → `Sessao` |
| `registrar` | `POST /auth/register` | `NovoUsuario` → `Sessao` |
| `sair` | `POST /auth/logout` | — → `204` (e limpa local) |
| `sessaoAtual` | `GET /auth/me` | — → `Sessao` \| `401` |

Resposta não-ok → `throw new Error(...)`. `API_BASE` via
`process.env.NEXT_PUBLIC_API_URL`. Senha nunca é logada/retornada.

### 3.3 `page.tsx` (rota `/login`)

- `"use client"`. Sem `Shell`. Layout centralizado (`card` em container
  flex centrado), tema verde, classes existentes.
- Estado: `modo: "entrar" | "criar"`, `form` (campos conforme modo),
  `enviando: boolean`, `erro: string | null`.
- Alterna entre "Entrar" (usuario, senha) e "Criar conta" (nome, usuario,
  senha) por um link/botão.
- Submit: valida campos; `await entrar(...)` ou `registrar(...)` em
  `try/catch/finally`; sucesso → `router.replace("/")` (dashboard);
  erro → mostra mensagem.
- Se já há sessão ao abrir `/login` → `router.replace("/")`.

### 3.4 `AuthGate.tsx`

- `"use client"`. Recebe `{children}` e o `pathname` (via
  `usePathname()` do `next/navigation`).
- Estado: `verificando: boolean` (evita "piscar" conteúdo), `sessao`.
- No mount/troca de rota: lê `sessaoAtual()`.
  - Rota é `/login`: renderiza `children` direto (não protege a própria
    tela de login).
  - Sem sessão e rota ≠ `/login`: `router.replace("/login")`; enquanto
    isso renderiza um placeholder neutro.
  - Com sessão: renderiza uma **barra fina** (`logado como {nome}` +
    botão **Sair**) acima de `children`. "Sair" → `sair()` +
    `router.replace("/login")`.
- A barra usa classes existentes; não depende de `Shell`.

---

## 4. Estados de UI

`/login`: formulário (idle) · enviando ("Entrando…/Criando…") · erro
(mensagem) · sucesso (redireciona). `AuthGate`: verificando (placeholder) ·
autenticado (barra + conteúdo) · não autenticado (redireciona).

---

## 5. Fluxo

```text
abre /qualquer-rota
  → AuthGate lê sessaoAtual()
     sem sessão & rota≠/login → redireciona /login
     com sessão → barra "Sair" + conteúdo
/login → entrar() ou registrar() → salva Sessao → /  (dashboard)
barra "Sair" (qualquer tela) → sair() → /login
```

---

## 6. Tratamento de erros

- `authApi` detecta e dá `throw` (credenciais inválidas, usuário existente,
  HTTP não-ok). `page.tsx` mostra mensagem amigável PT-BR via `try/catch`.
- `sessaoAtual()` nunca lança: JSON inválido/ausente → `null`.
- `finally` desliga `enviando`. Senha nunca aparece em log nem na `Sessao`.

---

## 7. Verificação manual

1. Abrir `/produtos` deslogado → redireciona para `/login`.
2. Idem para `/`, `/ficha-tecnica`, `/ordens` (MVP inteiro protegido).
3. Login `admin`/`admin123` → vai para `/` (dashboard).
4. Senha errada → mensagem de erro, permanece em `/login`.
5. "Criar conta" novo usuário → loga e entra; usuário repetido → erro.
6. Recarregar a página logado → continua logado (sessão persiste).
7. "Sair" em qualquer tela → volta a `/login`; `/produtos` volta a barrar.
8. Abrir `/login` já logado → redireciona para `/`.
9. `next build` (Turbopack) limpo; 5 rotas respondem.

---

## 8. Riscos

| Risco | Mitigação |
|---|---|
| "Tranca de papel" (sem segurança real) | Explícito na spec; contrato pronto pro back fazer auth real |
| Tocar `layout.tsx` (arquivo da equipe) | Mudança mínima (1 wrapper); necessária para auth do sistema todo; páginas/Shell dos colegas não editados |
| Flash de conteúdo antes do redirect | `AuthGate` tem estado `verificando` que segura o render |
| `localStorage` indisponível/SSR | Acesso só no cliente (`useEffect`); `try/catch` em parse |
| Conflito de merge no `layout.tsx` com a equipe | Mudança isolada e pequena; documentada para o scrum master |

---

## 9. Próximos passos

1. Revisão da spec (subagente revisor).
2. Implementação na `front-entrega`.
3. Verificação manual (§7) + build.
4. Commit + atualizar backup no repo do usuário.
5. Guia didático `GUIA_LOGIN_AUTENTICACAO.md`.
