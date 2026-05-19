// Contrato de tipos da página de Produtos.
// Sem código que roda — só "moldes" que o TypeScript usa para te avisar
// de erros antes de rodar. Este arquivo também é a especificação que o
// colega do back vai implementar.

export type CategoriaProduto = "Poliframe" | "Reparô" | "Composteira";

export type StatusProduto = "Ativo" | "Em desenvolvimento" | "Inativo";

// Produto como existe no sistema (já persistido).
export type Produto = {
  id: string; // UUID, gerado pelo back
  nome: string;
  sku: string;
  categoria: CategoriaProduto;
  linha: string;
  percentualReciclado: number; // 0..100
  status: StatusProduto;
  criadoEm: string; // ISO 8601, ex: "2026-05-19T14:30:00.000Z"
  qtdFichas: number; // CRUZAMENTO: nº de fichas técnicas vinculadas (back calcula)
  qtdOPs: number; // CRUZAMENTO: nº de ordens de produção vinculadas (back calcula)
};

// O que o formulário produz ao CRIAR (sem os campos que o sistema preenche).
export type NovoProduto = Omit<
  Produto,
  "id" | "criadoEm" | "qtdFichas" | "qtdOPs"
>;

// O que o formulário produz ao EDITAR (NovoProduto + id do alvo).
export type EdicaoProduto = NovoProduto & { id: string };

// Critérios de busca/filtro aplicados no front sobre a lista carregada.
export type FiltroProdutos = {
  texto: string; // busca em nome OU sku (case-insensitive)
  categoria: CategoriaProduto | "Todas";
  status: StatusProduto | "Todos";
  criadoDe: string | null; // "YYYY-MM-DD" ou null
  criadoAte: string | null; // "YYYY-MM-DD" ou null
};

// Listas reaproveitáveis para preencher <select>s na UI.
export const CATEGORIAS: CategoriaProduto[] = [
  "Poliframe",
  "Reparô",
  "Composteira",
];

export const STATUS: StatusProduto[] = [
  "Ativo",
  "Em desenvolvimento",
  "Inativo",
];
