"use client";

// Dashboard (rota "/") — reescrito no mesmo padrão da página de Produtos.
// Consome SÓ produtosApi.ts (mesmo contrato), sem useMvpData. Página de
// leitura: agrega Produto[] em indicadores. Visual reaproveita apenas
// classes já existentes em globals.css.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Factory,
  Layers,
  Leaf,
  PackageCheck,
  PackagePlus,
} from "lucide-react";
import { Shell } from "./shared/shell";
import { listarProdutos } from "./produtos/produtosApi";
import { CATEGORIAS, type Produto } from "./produtos/types";

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);
        const lista = await listarProdutos();
        setProdutos(lista);
      } catch {
        setErro("Não foi possível carregar o painel.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // KPIs derivados de Produto[] (sem acoplar a domínios dos colegas).
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter((p) => p.status === "Ativo").length;
  const comFicha = produtos.filter((p) => p.qtdFichas > 0).length;
  const totalOPs = produtos.reduce((s, p) => s + p.qtdOPs, 0);
  const mediaReciclado = produtos.length
    ? Math.round(
        produtos.reduce((s, p) => s + p.percentualReciclado, 0) /
          produtos.length
      )
    : 0;

  // Distribuição por categoria (barrinhas).
  const porCategoria = CATEGORIAS.map((categoria) => ({
    categoria,
    qtd: produtos.filter((p) => p.categoria === categoria).length,
  }));
  const maxCategoria = Math.max(1, ...porCategoria.map((c) => c.qtd));

  // Destaques: produtos com mais OPs vinculadas.
  const destaques = [...produtos]
    .sort((a, b) => b.qtdOPs - a.qtdOPs)
    .slice(0, 4);

  return (
    <Shell active="dashboard">
      <div className="page-header">
        <div>
          <h2>Painel operacional</h2>
          <div className="subtitle">
            Visão consolidada do portfólio de produtos e seu vínculo com a
            produção.
          </div>
        </div>
        <Link className="btn btn-primary btn-lg" href="/produtos">
          Ir para Produtos <ArrowRight size={18} />
        </Link>
      </div>

      <div className="kpi-row compact">
        <div className="kpi">
          <div className="kpi-icon">
            <PackagePlus size={18} />
          </div>
          <div className="kpi-label">Produtos ativos</div>
          <div className="kpi-value">{produtosAtivos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <ClipboardList size={18} />
          </div>
          <div className="kpi-label">Com ficha técnica</div>
          <div className="kpi-value">{comFicha}</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <Activity size={18} />
          </div>
          <div className="kpi-label">OPs vinculadas</div>
          <div className="kpi-value">{totalOPs}</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <Leaf size={18} />
          </div>
          <div className="kpi-label">Média reciclada</div>
          <div className="kpi-value">{mediaReciclado}%</div>
        </div>
      </div>

      {erro ? (
        <div className="card">
          <div className="empty-column">{erro}</div>
        </div>
      ) : carregando ? (
        <div className="card">
          <div className="empty-column">Carregando painel…</div>
        </div>
      ) : produtos.length === 0 ? (
        <div className="card">
          <div className="empty-column">
            Nenhum produto cadastrado ainda. Comece pelo catálogo.
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <section className="card operations-panel">
            <div className="section-title">
              <div>
                <h3>Portfólio por categoria</h3>
                <p>Distribuição dos produtos cadastrados.</p>
              </div>
              <Link className="btn btn-secondary compact-btn" href="/produtos">
                Catálogo <ArrowRight size={14} />
              </Link>
            </div>
            <div className="stage-list">
              {porCategoria.map((c) => (
                <div className="stage-row" key={c.categoria}>
                  <div>
                    <strong>{c.categoria}</strong>
                    <span>
                      {c.qtd} produto{c.qtd === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="stage-meter">
                    <span
                      style={{
                        width: `${(c.qtd / maxCategoria) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card operations-panel">
            <div className="section-title">
              <div>
                <h3>Destaques de produção</h3>
                <p>Produtos com mais ordens vinculadas.</p>
              </div>
              <span className="badge badge-green">{totalProdutos} no total</span>
            </div>
            <div className="ops-list">
              {destaques.some((p) => p.qtdOPs > 0) ? (
                destaques.map((p) => (
                  <div className="ops-item" key={p.id}>
                    <div>
                      <strong>{p.nome}</strong>
                      <span>
                        SKU {p.sku} • {p.categoria}
                      </span>
                    </div>
                    <div className="ops-item-status">
                      <span className="badge badge-blue">{p.qtdOPs} OP(s)</span>
                      <small>{p.percentualReciclado}% reciclado</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  Nenhum produto com ordem vinculada ainda.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Governança da operação</h3>
            <p>Atalhos para as etapas do fluxo produtivo.</p>
          </div>
        </div>
        <div className="governance-grid">
          <Link className="governance-tile" href="/produtos">
            <PackageCheck size={20} />
            <div>
              <strong>Portfólio industrial</strong>
              <span>{totalProdutos} produtos cadastrados</span>
            </div>
          </Link>
          <Link className="governance-tile" href="/ficha-tecnica">
            <Layers size={20} />
            <div>
              <strong>Engenharia de produto</strong>
              <span>{comFicha} com ficha vinculada</span>
            </div>
          </Link>
          <Link className="governance-tile" href="/ordens">
            <Factory size={20} />
            <div>
              <strong>Planejamento de OPs</strong>
              <span>{totalOPs} OPs vinculadas</span>
            </div>
          </Link>
          <Link className="governance-tile" href="/ops">
            <CheckCircle2 size={20} />
            <div>
              <strong>Acompanhamento</strong>
              <span>{produtosAtivos} produtos ativos</span>
            </div>
          </Link>
        </div>
      </section>
    </Shell>
  );
}
