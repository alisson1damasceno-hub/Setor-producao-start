# Guia: Tela de Login e Autenticação (porteiro de demonstração)

Este guia explica a tela de login do MVP: o que ela faz, como protege o
sistema inteiro, e por que foi feita assim. Mesmo estilo dos outros
`GUIA_*`: frases curtas, foco didático.

Pré-requisito: ter lido `GUIA_REACT_CONST_HOOKS.md` (usa `useState`,
`useEffect`) e `GUIA_ASSINCRONO_PROMISE_ASYNC_AWAIT.md` (`async/await`).

---

## 1. O que é "autenticação" — e o que NÃO fizemos

Autenticação = provar quem você é (usuário + senha) para o sistema liberar
o acesso.

Existem dois níveis bem diferentes:

| Nível | O que é | Fizemos? |
|---|---|---|
| Porteiro de demonstração | confere usuário/senha contra dados fake, guarda uma "sessão" no navegador | ✅ Sim |
| Autenticação real | senha com hash, token JWT, sessão no servidor, proteção real | ❌ Não — é trabalho do back |

**Importante ser honesto:** o que fizemos NÃO é seguro. Qualquer pessoa que
abrir o código vê a senha. É uma "tranca de papel" — perfeita para a
apresentação acadêmica, e preparada (contract-first) para o back trocar por
segurança real depois, sem a tela mudar.

---

## 2. Os 4 arquivos (todos isolados em `app/login/`)

```text
types.ts       contrato: Credenciais, NovoUsuario, Usuario, Sessao
authApi.ts     entrar / registrar / sair / sessaoAtual  (fake; localStorage)
page.tsx       a tela /login (alterna Entrar / Criar conta)
AuthGate.tsx   o "portão" que protege TODAS as páginas
```

E **uma** mudança mínima fora dali: `app/layout.tsx` ganhou 2 linhas para
envolver o app com o `AuthGate`.

Mesma filosofia do `produtosApi`: a tela só fala com `authApi`; só o
`authApi` toca no `localStorage`. Trocar fake → HTTP muda só o `authApi`.

---

## 3. `types.ts` — o contrato

```ts
type Credenciais = { usuario: string; senha: string };       // para entrar
type NovoUsuario = { nome: string; usuario: string; senha: string }; // cadastro
type Usuario     = { id: string; nome: string; usuario: string };    // SEM senha
type Sessao      = { usuario: Usuario; token: string; criadaEm: string };
```

Detalhe importante: `Usuario` **não tem senha**. Boa prática (mesmo no
fake): a senha entra, mas **nunca volta** numa resposta. O `token` é fake
agora; o back devolve um JWT depois.

---

## 4. `authApi.ts` — a camada de autenticação

Quatro funções (a interface estável que o back vai implementar igual):

| Função | O que faz |
|---|---|
| `entrar(cred)` | confere usuário+senha; ok → cria e salva `Sessao`; erro → `throw` |
| `registrar(novo)` | valida; se usuário já existe → `throw`; senão cria, salva e já loga |
| `sair()` | apaga a sessão do `localStorage` |
| `sessaoAtual()` | lê a sessão salva (ou `null`); nunca quebra |

### Conceito-chave: `localStorage`

`localStorage` é uma "gavetinha" do navegador que **sobrevive** quando você
troca de página ou recarrega. Por isso a sessão fica lá: senão, ao navegar
de `/produtos` para `/`, você "deslogaria".

Por que aqui usamos `localStorage` e no `produtosApi` não? Porque produto
era só demonstração em memória; **sessão precisa persistir**. E, de novo,
só o `authApi` toca nessa gaveta — o resto do app não sabe que ela existe.

### Seed preguiçoso (lazy)

Na primeira vez, não existe nenhum usuário salvo. O `authApi` então **cria
um usuário-semente**: `admin` / `admin123` (nome "Administrador"). Isso faz
o sistema funcionar na hora da apresentação, sem precisar cadastrar antes.
"Lazy" = só cria quando a primeira leitura acontece **no navegador** (nunca
no servidor — `localStorage` não existe no servidor).

### Erros viram `throw`

`entrar`/`registrar` dão `throw new Error("...")` quando falham. Quem chama
(a tela) pega com `try/catch` e mostra a mensagem. `sessaoAtual()` é a
exceção: ela **nunca lança** — se o dado estiver corrompido, devolve `null`
(trata como "deslogado").

---

## 5. `page.tsx` — a tela `/login`

- `"use client"` (tem formulário, estado, eventos).
- **Sem `Shell`**: login é *antes* de entrar no sistema, então não tem
  menu/cabeçalho.
- Um estado `modo` alterna entre `"entrar"` e `"criar"` (mesmo formulário,
  campos diferentes).
- Estados de UI: digitando · enviando ("Aguarde…") · erro (mensagem) ·
  sucesso (redireciona para `/`).
- Se você abrir `/login` **já logado**, ela te manda direto pro dashboard
  (`router.replace("/")`). Por isso ela segura um "Carregando…" até checar
  a sessão — evita "piscar" o formulário à toa.

`router.replace` (do `next/navigation`) troca de página **sem** deixar a
tela de login no histórico do botão "voltar". Faz sentido: depois de logar,
"voltar" não deve te jogar no login de novo.

---

## 6. `AuthGate.tsx` — o portão que protege tudo

Esta é a peça esperta. Ela **envolve o app inteiro** (via `layout.tsx`) e
decide, a cada página:

```text
rota é /login?            -> deixa passar (a própria tela cuida do resto)
tem sessão?
   não  -> manda pra /login (e segura um "Carregando…" — sem piscar
            conteúdo protegido)
   sim  -> mostra uma barra fina "Logado como X · Sair" + a página
```

### Por que no `layout.tsx`?

Para proteger **o MVP inteiro** (suas páginas + as dos colegas), a checagem
tem que estar num lugar **único que envolve todas as páginas**. No Next.js
App Router esse lugar é o `layout.tsx` (o molde raiz). Foi a única coisa da
base da equipe que tocamos — só 2 linhas (importar e envolver). Não mexemos
no `Shell` nem nas páginas de ficha-técnica/ordens; elas ficam protegidas
**sem serem editadas**.

### O problema do "flash" (e como resolvemos)

A checagem de sessão roda no `useEffect` (só no navegador). No primeiro
instante, o componente ainda não sabe se você está logado. Se ele
mostrasse o conteúdo nesse instante, você veria a página protegida
"piscar" antes de ser chutado pro login. Solução: um estado `verificando`
que mantém um placeholder neutro ("Carregando…") **até** a sessão ser
resolvida. Conceito: *o que aparece na tela nem sempre é a verdade ainda —
segure até ter certeza.*

### Logout global sem tocar no `Shell`

O botão "Sair" fica numa barra fina que o **próprio `AuthGate`** desenha,
acima de qualquer página logada. Assim o logout existe em **todas** as
telas sem precisar editar o `Shell` (que é compartilhado com os colegas).

---

## 7. O fluxo completo

```text
abre QUALQUER rota
   -> AuthGate lê sessaoAtual()
        sem sessão & rota ≠ /login  -> vai pra /login
        com sessão                  -> barra "Sair" + conteúdo
/login -> entrar() ou registrar()   -> salva Sessao -> vai pra /  (dashboard)
qualquer tela logada -> "Sair"      -> apaga sessão -> volta pra /login
recarregar a página logado          -> continua logado (sessão persiste)
```

---

## 8. Contrato para o back (Fase 2 — HTTP)

Quando o back existir, troca-se só o miolo do `authApi` por `fetch`,
mantendo as mesmas 4 funções. Endpoints combinados:

```text
entrar       POST /auth/login     (Credenciais) -> Sessao
registrar    POST /auth/register  (NovoUsuario) -> Sessao
sair         POST /auth/logout    —             -> 204
sessaoAtual  GET  /auth/me        —             -> Sessao | 401
```

Regras para o back: guardar senha com **hash** (bcrypt/argon2), devolver um
**JWT** em `token`, e **nunca** retornar a senha. A tela não muda nada.

---

## 9. Glossário

| Termo | Uma linha |
|---|---|
| autenticação | provar quem é você para liberar o acesso |
| porteiro de demonstração | login fake, sem segurança real (só pra demo) |
| sessão | prova de que você está logado, guardada entre páginas |
| `localStorage` | gaveta do navegador que sobrevive a recarregar |
| seed/semente | usuário criado automático na 1ª vez (admin/admin123) |
| lazy (preguiçoso) | só faz quando precisa (1ª leitura no cliente) |
| guarda de rota | código que bloqueia páginas de quem não está logado |
| `router.replace` | troca de página sem deixar a anterior no "voltar" |
| flash de conteúdo | conteúdo protegido "piscando" antes do redirect |
| JWT | token assinado de sessão (o back faz; aqui é fake) |
| hash de senha | guardar a senha embaralhada e irreversível (back) |
| contract-first | front define o contrato; back implementa depois |

---

## 10. Resumo em uma frase

> A tela de login é um **porteiro de demonstração**: `authApi` finge a
> autenticação (guardando sessão no `localStorage`), o `AuthGate` usa essa
> sessão para liberar ou barrar **todas** as páginas a partir de um único
> ponto (`layout.tsx`), e tudo está pronto (contract-first) para o back
> trocar o fake por segurança real sem mexer na tela.
