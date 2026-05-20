// ─── Tipos do Setor de Produção ───────────────────────────────────────────────

export type Etapa =
| "recepcao"
| "processamento"
| "fabricacao"
| "qualidade"
| "embalagem"
| "concluido";

export const ETAPA_LABEL: Record<Etapa, string> = {
  recepcao: "Recepção",
  processamento: "Processamento",
  fabricacao: "Fabricação",
  qualidade: "Qualidade",
  embalagem: "Embalagem",
  concluido: "Concluído",
};

export const ETAPAS_ORDEM: Etapa[] = [
  "recepcao",
"processamento",
"fabricacao",
"qualidade",
"embalagem",
"concluido",
];

export type Prioridade = "Alta" | "Média" | "Baixa";

export type StatusOP =
| "Em andamento"
| "Pausada"
| "Atrasada"
| "Concluída"
| "Cancelada";

export type HistoricoItem = {
  id: string;
  data: string;
  acao: string;
};

export type OrdemProducao = {
  id: string;
  code: string;
  sheet_id: string;
  product_name: string;
  quantity: number;
  due_date: string;
  priority: Prioridade;
  responsible: string;
  lot: string;
  stage: Etapa;
  status: StatusOP;
  progress: number;
  observations: string;
  created_at: string;
  updated_at: string;
  historico: HistoricoItem[];
};

export type NovaOrdemInput = {
  code: string;
  sheet_id: string;
  product_name: string;
  quantity: number;
  due_date: string;
  priority: Prioridade;
  responsible: string;
  lot: string;
  stage: Etapa;
  observations: string;
};
