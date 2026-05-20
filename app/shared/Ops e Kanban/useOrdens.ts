"use client";

import { useEffect, useState } from "react";
import {
  ETAPAS_ORDEM,
  type Etapa,
  type HistoricoItem,
  type NovaOrdemInput,
  type OrdemProducao,
  type StatusOP,
} from "./types";

const STORAGE_KEY = "setor-producao-ordens";

function agoraISO() {
  return new Date().toISOString();
}

function novoId(prefixo = "id") {
  return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

function criarHistorico(acao: string): HistoricoItem {
  return {
    id: novoId("hist"),
    data: agoraISO(),
    acao,
  };
}

function progressoPorEtapa(etapa: Etapa) {
  const mapa: Record<Etapa, number> = {
    recepcao: 0,
    processamento: 25,
    fabricacao: 50,
    qualidade: 75,
    embalagem: 90,
    concluido: 100,
  };

  return mapa[etapa];
}

function calcularStatus(op: OrdemProducao): StatusOP {
  if (op.status === "Cancelada") return "Cancelada";
  if (op.status === "Pausada") return "Pausada";
  if (op.stage === "concluido") return "Concluída";

  const hoje = new Date();
  const prazo = new Date(`${op.due_date}T23:59:59`);

  if (prazo < hoje) return "Atrasada";

  return "Em andamento";
}

const DADOS_EXEMPLO: OrdemProducao[] = [
  {
    id: "order-001",
    code: "OP-0191",
    sheet_id: "sheet-001",
    product_name: "Placa Poliframe 2,40m",
    quantity: 80,
    due_date: "2026-04-27",
    priority: "Alta",
    responsible: "Carlos P.",
    lot: "LT-2459",
    stage: "processamento",
    status: "Em andamento",
    progress: 25,
    observations: "Priorizar esta OP por conta do prazo curto.",
    created_at: "2026-04-20T10:00:00Z",
    updated_at: "2026-04-20T10:00:00Z",
    historico: [
      {
        id: "hist-001",
        data: "2026-04-20T10:00:00Z",
        acao: "OP criada em Recepção.",
      },
      {
        id: "hist-002",
        data: "2026-04-21T09:00:00Z",
        acao: "OP movida para Processamento.",
      },
    ],
  },
{
  id: "order-002",
  code: "OP-0192",
  sheet_id: "sheet-002",
  product_name: "Reparô 500ml",
  quantity: 500,
  due_date: "2026-04-28",
  priority: "Média",
  responsible: "Ana L.",
  lot: "LT-2458",
  stage: "fabricacao",
  status: "Em andamento",
  progress: 50,
  observations: "Aguardando separação completa dos insumos.",
  created_at: "2026-04-21T08:00:00Z",
  updated_at: "2026-04-21T08:00:00Z",
  historico: [
    {
      id: "hist-003",
      data: "2026-04-21T08:00:00Z",
      acao: "OP criada.",
    },
  ],
},
{
  id: "order-003",
  code: "OP-0193",
  sheet_id: "sheet-001",
  product_name: "Placa Poliframe 2,40m",
  quantity: 30,
  due_date: "2026-05-05",
  priority: "Baixa",
  responsible: "Carlos P.",
  lot: "LT-2461",
  stage: "recepcao",
  status: "Em andamento",
  progress: 0,
  observations: "",
  created_at: "2026-04-22T09:00:00Z",
  updated_at: "2026-04-22T09:00:00Z",
  historico: [
    {
      id: "hist-004",
      data: "2026-04-22T09:00:00Z",
      acao: "OP criada.",
    },
  ],
},
];

type UseOrdensReturn = {
  ordens: OrdemProducao[];
  carregando: boolean;
  erro: string;

  criarOrdem: (dados: NovaOrdemInput) => OrdemProducao;
  editarOrdem: (id: string, dados: Partial<NovaOrdemInput>) => void;
  excluirOrdem: (id: string) => void;
  cancelarOrdem: (id: string) => void;

  avancar: (id: string) => void;
  voltar: (id: string) => void;
  moverParaEtapa: (id: string, etapa: Etapa) => void;

  pausar: (id: string) => void;
  retomar: (id: string) => void;
  concluir: (id: string) => void;

  adicionarObservacao: (id: string, observacao: string) => void;

  buscarPorId: (id: string) => OrdemProducao | undefined;
  recarregar: () => void;
  resetarDados: () => void;
};

function lerLocalStorage(): OrdemProducao[] {
  if (typeof window === "undefined") return DADOS_EXEMPLO;

  const salvo = window.localStorage.getItem(STORAGE_KEY);

  if (!salvo) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DADOS_EXEMPLO));
    return DADOS_EXEMPLO;
  }

  try {
    const dados = JSON.parse(salvo) as OrdemProducao[];

    return dados.map((op) => ({
      ...op,
      status: calcularStatus(op),
                              product_name: op.product_name ?? "Produto sem nome",
                              observations: op.observations ?? "",
                              historico: op.historico ?? [],
                              updated_at: op.updated_at ?? op.created_at,
    }));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DADOS_EXEMPLO));
    return DADOS_EXEMPLO;
  }
}

function salvarLocalStorage(ordens: OrdemProducao[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens));
}

export function useOrdens(): UseOrdensReturn {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  function sincronizar(novasOrdens: OrdemProducao[]) {
    const corrigidas = novasOrdens.map((op) => ({
      ...op,
      status: calcularStatus(op),
    }));

    setOrdens(corrigidas);
    salvarLocalStorage(corrigidas);
  }

  function recarregar() {
    setCarregando(true);

    try {
      const dados = lerLocalStorage();
      setOrdens(dados);
      setErro("");
    } catch {
      setErro("Erro ao carregar ordens salvas no navegador.");
      setOrdens(DADOS_EXEMPLO);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    recarregar();
  }, []);

  function criarOrdem(dados: NovaOrdemInput) {
    const data = agoraISO();

    const nova: OrdemProducao = {
      id: novoId("order"),
      code: dados.code,
      sheet_id: dados.sheet_id,
      product_name: dados.product_name,
      quantity: dados.quantity,
      due_date: dados.due_date,
      priority: dados.priority,
      responsible: dados.responsible,
      lot: dados.lot,
      stage: dados.stage,
      status: "Em andamento",
      progress: progressoPorEtapa(dados.stage),
      observations: dados.observations,
      created_at: data,
      updated_at: data,
      historico: [criarHistorico(`OP criada na etapa ${dados.stage}.`)],
    };

    sincronizar([nova, ...ordens]);

    return nova;
  }

  function editarOrdem(id: string, dados: Partial<NovaOrdemInput>) {
    const atualizadas = ordens.map((op) => {
      if (op.id !== id) return op;

      const etapaNova = dados.stage ?? op.stage;

      return {
        ...op,
        ...dados,
        stage: etapaNova,
        progress: progressoPorEtapa(etapaNova),
                                   updated_at: agoraISO(),
                                   historico: [
                                     criarHistorico("Dados da OP editados."),
                                   ...op.historico,
                                   ],
      };
    });

    sincronizar(atualizadas);
  }

  function excluirOrdem(id: string) {
    sincronizar(ordens.filter((op) => op.id !== id));
  }

  function cancelarOrdem(id: string) {
    const atualizadas = ordens.map((op) =>
    op.id === id
    ? {
      ...op,
      status: "Cancelada" as StatusOP,
      updated_at: agoraISO(),
                                   historico: [criarHistorico("OP cancelada."), ...op.historico],
    }
    : op
    );

    sincronizar(atualizadas);
  }

  function moverParaEtapa(id: string, etapa: Etapa) {
    const atualizadas = ordens.map((op) =>
    op.id === id
    ? {
      ...op,
      stage: etapa,
      status: etapa === "concluido" ? "Concluída" : "Em andamento",
      progress: progressoPorEtapa(etapa),
                                   updated_at: agoraISO(),
                                   historico: [
                                     criarHistorico(`OP movida para ${etapa}.`),
                                   ...op.historico,
                                   ],
    }
    : op
    );

    sincronizar(atualizadas);
  }

  function avancar(id: string) {
    const op = ordens.find((item) => item.id === id);
    if (!op) return;

    const indice = ETAPAS_ORDEM.indexOf(op.stage);
    const proxima = ETAPAS_ORDEM[indice + 1];

    if (!proxima) return;

    moverParaEtapa(id, proxima);
  }

  function voltar(id: string) {
    const op = ordens.find((item) => item.id === id);
    if (!op) return;

    const indice = ETAPAS_ORDEM.indexOf(op.stage);
    const anterior = ETAPAS_ORDEM[indice - 1];

    if (!anterior) return;

    moverParaEtapa(id, anterior);
  }

  function pausar(id: string) {
    const atualizadas = ordens.map((op) =>
    op.id === id
    ? {
      ...op,
      status: "Pausada" as StatusOP,
      updated_at: agoraISO(),
                                   historico: [criarHistorico("OP pausada."), ...op.historico],
    }
    : op
    );

    sincronizar(atualizadas);
  }

  function retomar(id: string) {
    const atualizadas = ordens.map((op) =>
    op.id === id
    ? {
      ...op,
      status: "Em andamento" as StatusOP,
      updated_at: agoraISO(),
                                   historico: [criarHistorico("OP retomada."), ...op.historico],
    }
    : op
    );

    sincronizar(atualizadas);
  }

  function concluir(id: string) {
    moverParaEtapa(id, "concluido");
  }

  function adicionarObservacao(id: string, observacao: string) {
    const atualizadas = ordens.map((op) =>
    op.id === id
    ? {
      ...op,
      observations: observacao,
      updated_at: agoraISO(),
                                   historico: [
                                     criarHistorico("Observação atualizada."),
                                   ...op.historico,
                                   ],
    }
    : op
    );

    sincronizar(atualizadas);
  }

  function buscarPorId(id: string) {
    return ordens.find((op) => op.id === id);
  }

  function resetarDados() {
    sincronizar(DADOS_EXEMPLO);
  }

  return {
    ordens,
    carregando,
    erro,

    criarOrdem,
    editarOrdem,
    excluirOrdem,
    cancelarOrdem,

    avancar,
    voltar,
    moverParaEtapa,

    pausar,
    retomar,
    concluir,

    adicionarObservacao,

    buscarPorId,
    recarregar,
    resetarDados,
  };
}
