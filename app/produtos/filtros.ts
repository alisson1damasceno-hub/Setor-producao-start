// Lógica de busca/filtro da página de Produtos, isolada da UI.
// `aplicarFiltro` é uma função PURA: só entra dado e sai dado (não mexe em
// estado nem em nada de fora). Por isso é fácil de entender e de testar
// sozinha. Fica fora de page.tsx porque arquivos de página no Next.js
// App Router só podem exportar o componente default.

import type { FiltroProdutos, Produto } from "./types";

export function aplicarFiltro(
  produtos: Produto[],
  filtro: FiltroProdutos
): Produto[] {
  const texto = filtro.texto.trim().toLowerCase();
  return produtos.filter((p) => {
    if (texto) {
      const alvo = `${p.nome} ${p.sku}`.toLowerCase();
      if (!alvo.includes(texto)) return false;
    }
    if (filtro.categoria !== "Todas" && p.categoria !== filtro.categoria) {
      return false;
    }
    if (filtro.status !== "Todos" && p.status !== filtro.status) {
      return false;
    }
    const dia = p.criadoEm.slice(0, 10); // "YYYY-MM-DD" (ISO já vem ordenável)
    if (filtro.criadoDe && dia < filtro.criadoDe) return false;
    if (filtro.criadoAte && dia > filtro.criadoAte) return false;
    return true;
  });
}
