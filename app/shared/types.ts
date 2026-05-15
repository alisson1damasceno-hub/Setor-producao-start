// Um produto cadastrado no sistema
export type Product = {
  id: string;
  name: string;
  category: string;
};

// Uma matéria-prima dentro de uma ficha técnica
export type RawMaterial = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
};

// Uma ficha técnica completa
export type TechnicalSheet = {
  id: string;
  code: string;
  productId: string;
  version: string;
  cycleMinutes: number;
  unitCost: number;
  rawMaterials: RawMaterial[];
  steps: string;
  status: "Aprovada" | "Em revisão";
};

// As etapas possíveis de uma ordem de produção
export type ProductionStage =
  | "recepcao"
  | "processamento"
  | "fabricacao"
  | "qualidade"
  | "embalagem"
  | "concluido";

// Uma ordem de produção
export type ProductionOrder = {
  id: string;
  code: string;
  sheetId: string;
  quantity: number;
  dueDate: string;
  priority: "Alta" | "Média" | "Baixa";
  responsible: string;
  stage: ProductionStage;
  progress: number;
  createdAt: string;
};

// Tudo que o sistema guarda
export type AppData = {
  products: Product[];
  sheets: TechnicalSheet[];
  orders: ProductionOrder[];
};