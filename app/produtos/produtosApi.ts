// Camada de dados (Service Layer) da página de Produtos.
//
// A página (page.tsx) SÓ conversa com este arquivo. Ela não sabe se os
// dados vêm de um array fake, de HTTP, ou de Supabase. Trocar a fonte
// (fake -> HTTP) muda APENAS este arquivo; a página não muda nada.
//
// FASE 1 (agora): dados fake em memória + atraso artificial p/ simular HTTP.
// FASE 2 (quando o back existir): trocar o miolo por fetch(). As assinaturas
// das funções NÃO mudam. Ver o mapa de endpoints no fim do arquivo —
// é o contrato que o colega do back vai implementar.

import type { Produto, NovoProduto, EdicaoProduto } from "./types";

// "Banco" fake em memória. Some quando a página recarrega — é esperado
// nesta fase. Alguns itens de exemplo para a tela já nascer com conteúdo.
let produtosFake: Produto[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    nome: "Placa Poliframe 1,20m",
    sku: "POL-120-STD",
    categoria: "Poliframe",
    linha: "Linha 01",
    percentualReciclado: 60,
    status: "Ativo",
    criadoEm: "2026-04-02T13:10:00.000Z",
    qtdFichas: 2,
    qtdOPs: 5,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    nome: "Kit Reparô 500ml",
    sku: "REP-500",
    categoria: "Reparô",
    linha: "Envase",
    percentualReciclado: 35,
    status: "Em desenvolvimento",
    criadoEm: "2026-04-21T09:45:00.000Z",
    qtdFichas: 0,
    qtdOPs: 0,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    nome: "Composteira Doméstica 60L",
    sku: "CMP-060",
    categoria: "Composteira",
    linha: "Montagem",
    percentualReciclado: 80,
    status: "Ativo",
    criadoEm: "2026-05-09T16:20:00.000Z",
    qtdFichas: 1,
    qtdOPs: 2,
  },
];

// Atraso artificial: devolve uma Promise que resolve depois de `ms`.
// Serve só para simular a demora de uma chamada HTTP real (e exercitar
// o estado "Carregando..." da tela). Apagar quando virar HTTP de verdade.
const atraso = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listarProdutos(): Promise<Produto[]> {
  await atraso(300);
  return [...produtosFake]; // devolve uma cópia (protege o array interno)
}

export async function obterProduto(id: string): Promise<Produto> {
  await atraso(300);
  const encontrado = produtosFake.find((p) => p.id === id);
  if (!encontrado) throw new Error("Produto não encontrado.");
  return { ...encontrado };
}

export async function criarProduto(novo: NovoProduto): Promise<Produto> {
  await atraso(300);
  const produto: Produto = {
    ...novo,
    id: crypto.randomUUID(),
    criadoEm: new Date().toISOString(),
    qtdFichas: 0, // produto novo ainda não tem ficha/OP; o back recalcula
    qtdOPs: 0,
  };
  produtosFake.push(produto);
  return { ...produto };
}

export async function atualizarProduto(
  edicao: EdicaoProduto
): Promise<Produto> {
  await atraso(300);
  const indice = produtosFake.findIndex((p) => p.id === edicao.id);
  if (indice === -1) throw new Error("Produto não encontrado.");
  const anterior = produtosFake[indice];
  const atualizado: Produto = {
    ...anterior, // preserva id, criadoEm, qtdFichas, qtdOPs
    nome: edicao.nome,
    sku: edicao.sku,
    categoria: edicao.categoria,
    linha: edicao.linha,
    percentualReciclado: edicao.percentualReciclado,
    status: edicao.status,
  };
  produtosFake[indice] = atualizado;
  return { ...atualizado };
}

export async function excluirProduto(id: string): Promise<void> {
  await atraso(300);
  const existe = produtosFake.some((p) => p.id === id);
  if (!existe) throw new Error("Produto não encontrado.");
  produtosFake = produtosFake.filter((p) => p.id !== id);
}

// ---------------------------------------------------------------------------
// CONTRATO PARA O COLEGA DO BACK (Fase 2 — HTTP).
//
// Quando o back existir, trocar o miolo das funções acima por fetch, mantendo
// EXATAMENTE as mesmas assinaturas. Endpoints esperados:
//
//   listarProdutos     GET    /produtos          -> Produto[]
//   obterProduto       GET    /produtos/:id      -> Produto
//   criarProduto       POST   /produtos          (NovoProduto) -> Produto
//   atualizarProduto   PUT    /produtos/:id      (NovoProduto) -> Produto
//   excluirProduto     DELETE /produtos/:id      -> 204
//
// Exemplo da versão HTTP (para referência futura):
//
//   const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
//   export async function listarProdutos(): Promise<Produto[]> {
//     const r = await fetch(`${API}/produtos`);
//     if (!r.ok) throw new Error("Falha ao listar produtos");
//     return r.json();
//   }
//
// IMPORTANTE: qtdFichas e qtdOPs são CRUZAMENTO de domínios — o back precisa
// cruzar (JOIN) produtos x fichas x ordens para preenchê-los.
// ---------------------------------------------------------------------------
