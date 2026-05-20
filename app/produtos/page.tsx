"use client";

// Página de Produtos — CRUD completo + busca/filtros.
// Conversa SÓ com produtosApi.ts (não usa fetch/localStorage/useMvpData).
// Visual reaproveita apenas classes já existentes em globals.css.

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Leaf,
  PackagePlus,
  Pencil,
  Save,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { Shell } from "../shared/shell";
import {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  excluirProduto,
} from "./produtosApi";
import { aplicarFiltro } from "./filtros";
import {
  CATEGORIAS,
  STATUS,
  type FiltroProdutos,
  type NovoProduto,
  type Produto,
} from "./types";

// Estado inicial do formulário (modo criar).
const formVazio: NovoProduto = {
  nome: "",
  sku: "",
  categoria: "Poliframe",
  linha: "Linha 01",
  percentualReciclado: 60,
  status: "Ativo",
};

// Estado inicial dos filtros (nada filtrado).
const filtroInicial: FiltroProdutos = {
  texto: "",
  categoria: "Todas",
  status: "Todos",
  criadoDe: null,
  criadoAte: null,
};

// Formata data ISO -> "dd/mm/aaaa" para exibição.
function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export default function ProductsPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState<NovoProduto>(formVazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [visualizando, setVisualizando] = useState<Produto | null>(null);
  const [filtro, setFiltro] = useState<FiltroProdutos>(filtroInicial);
  const [salvando, setSalvando] = useState(false);

  // Carga inicial: roda UMA vez quando a página aparece.
  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);
        const lista = await listarProdutos();
        setProdutos(lista);
      } catch {
        setErro("Não foi possível carregar os produtos.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Lista derivada (recalculada a cada render; sem useState próprio).
  const listaFiltrada = aplicarFiltro(produtos, filtro);

  // KPIs derivados de `produtos`.
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter((p) => p.status === "Ativo").length;
  const mediaReciclado = produtos.length
    ? Math.round(
        produtos.reduce((s, p) => s + p.percentualReciclado, 0) /
          produtos.length
      )
    : 0;
  const comFicha = produtos.filter((p) => p.qtdFichas > 0).length;

  function resetForm() {
    setForm(formVazio);
    setEditandoId(null);
  }

  function iniciarEdicao(p: Produto) {
    setEditandoId(p.id);
    setVisualizando(null);
    setForm({
      nome: p.nome,
      sku: p.sku,
      categoria: p.categoria,
      linha: p.linha,
      percentualReciclado: p.percentualReciclado,
      status: p.status,
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.nome || !form.sku) return; // validação mínima
    try {
      setSalvando(true);
      setErro(null);
      if (editandoId) {
        const atualizado = await atualizarProduto({ ...form, id: editandoId });
        setProdutos((lista) =>
          lista.map((p) => (p.id === editandoId ? atualizado : p))
        );
      } else {
        const criado = await criarProduto(form);
        setProdutos((lista) => [...lista, criado]);
      }
      resetForm();
    } catch {
      setErro("Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao(p: Produto) {
    const ok = window.confirm(`Excluir "${p.nome}"? Esta ação não volta.`);
    if (!ok) return;
    try {
      setErro(null);
      await excluirProduto(p.id);
      setProdutos((lista) => lista.filter((x) => x.id !== p.id));
      if (visualizando?.id === p.id) setVisualizando(null);
      if (editandoId === p.id) resetForm();
    } catch {
      setErro("Não foi possível excluir o produto.");
    }
  }

  const filtroAtivo =
    filtro.texto !== "" ||
    filtro.categoria !== "Todas" ||
    filtro.status !== "Todos" ||
    filtro.criadoDe !== null ||
    filtro.criadoAte !== null;

  return (
    <Shell active="produtos">
      <div className="page-header">
        <div>
          <h2>Produtos</h2>
          <div className="subtitle">
            Cadastre, edite, busque e mantenha os produtos do fluxo produtivo.
          </div>
        </div>
        <Link className="btn btn-primary btn-lg" href="/ficha-tecnica">
          Próximo <ArrowRight size={18} />
        </Link>
      </div>

      <div className="kpi-row compact">
        <div className="kpi">
          <div className="kpi-icon">
            <Tags size={18} />
          </div>
          <div className="kpi-label">Produtos cadastrados</div>
          <div className="kpi-value">{totalProdutos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <CheckCircle2 size={18} />
          </div>
          <div className="kpi-label">Produtos ativos</div>
          <div className="kpi-value">{produtosAtivos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <Leaf size={18} />
          </div>
          <div className="kpi-label">Média reciclada</div>
          <div className="kpi-value">{mediaReciclado}%</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <PackagePlus size={18} />
          </div>
          <div className="kpi-label">Com ficha técnica</div>
          <div className="kpi-value">{comFicha}</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <div>
            <h3>Busca e filtros</h3>
            <p>Refine o catálogo por texto, categoria, status ou data.</p>
          </div>
          {filtroAtivo && (
            <button
              className="btn btn-secondary compact-btn"
              type="button"
              onClick={() => setFiltro(filtroInicial)}
            >
              <X size={14} /> Limpar
            </button>
          )}
        </div>
        <div className="row">
          <div className="form-group">
            <label>Buscar (nome ou SKU)</label>
            <input
              value={filtro.texto}
              onChange={(e) =>
                setFiltro({ ...filtro, texto: e.target.value })
              }
              placeholder="Ex: Poliframe ou POL-120"
            />
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select
              value={filtro.categoria}
              onChange={(e) =>
                setFiltro({
                  ...filtro,
                  categoria: e.target.value as FiltroProdutos["categoria"],
                })
              }
            >
              <option>Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={filtro.status}
              onChange={(e) =>
                setFiltro({
                  ...filtro,
                  status: e.target.value as FiltroProdutos["status"],
                })
              }
            >
              <option>Todos</option>
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="form-group">
            <label>Criado de</label>
            <input
              type="date"
              value={filtro.criadoDe ?? ""}
              onChange={(e) =>
                setFiltro({ ...filtro, criadoDe: e.target.value || null })
              }
            />
          </div>
          <div className="form-group">
            <label>Criado até</label>
            <input
              type="date"
              value={filtro.criadoAte ?? ""}
              onChange={(e) =>
                setFiltro({ ...filtro, criadoAte: e.target.value || null })
              }
            />
          </div>
        </div>
      </div>

      <div className="workbench-grid">
        <form className="card form-panel" onSubmit={submit}>
          <div className="section-title">
            <div>
              <h3>{editandoId ? "Editar produto" : "Novo produto"}</h3>
              <p>
                {editandoId
                  ? "Altere os dados e salve a edição."
                  : "Dados essenciais para cadastro e rastreabilidade."}
              </p>
            </div>
            <span className="badge badge-blue">
              {editandoId ? "Edição" : "Novo"}
            </span>
          </div>

          <div className="form-group">
            <label className="required">Nome</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Placa Poliframe 1,20m"
            />
          </div>

          <div className="row">
            <div className="form-group">
              <label className="required">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="POL-120-STD"
              />
            </div>
            <div className="form-group">
              <label>% reciclado</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.percentualReciclado}
                onChange={(e) =>
                  setForm({
                    ...form,
                    percentualReciclado: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="row">
            <div className="form-group">
              <label>Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoria: e.target.value as NovoProduto["categoria"],
                  })
                }
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Linha</label>
              <input
                value={form.linha}
                onChange={(e) => setForm({ ...form, linha: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as NovoProduto["status"],
                })
              }
            >
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={salvando}
            >
              {editandoId ? <Save size={17} /> : <PackagePlus size={17} />}{" "}
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar edição"
                : "Salvar produto"}
            </button>
            {editandoId && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={resetForm}
              >
                <X size={16} /> Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <div className="section-title">
            <div>
              <h3>Catálogo</h3>
              <p>
                {listaFiltrada.length} de {produtos.length} produto(s).
              </p>
            </div>
          </div>

          {visualizando && (
            <div className="detail-panel">
              <div>
                <span className="eyebrow">Visualização</span>
                <h3>{visualizando.nome}</h3>
                <p>
                  SKU {visualizando.sku} · {visualizando.categoria} ·{" "}
                  {visualizando.linha}
                </p>
                <p>
                  {visualizando.percentualReciclado}% reciclado · Status:{" "}
                  {visualizando.status} · Criado em{" "}
                  {formatarData(visualizando.criadoEm)}
                </p>
                <p>
                  {visualizando.qtdFichas} ficha(s) · {visualizando.qtdOPs}{" "}
                  OP(s) vinculada(s)
                </p>
              </div>
              <div className="detail-panel-actions">
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => iniciarEdicao(visualizando)}
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  type="button"
                  onClick={() => confirmarExclusao(visualizando)}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => setVisualizando(null)}
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {erro ? (
            <div className="empty-column">{erro}</div>
          ) : carregando ? (
            <div className="empty-column">Carregando produtos…</div>
          ) : listaFiltrada.length === 0 ? (
            <div className="empty-column">
              {produtos.length === 0
                ? "Nenhum produto cadastrado ainda."
                : "Nenhum produto encontrado para os filtros."}
            </div>
          ) : (
            <div className="product-grid">
              {listaFiltrada.map((p) => (
                <article className="product-card" key={p.id}>
                  <div className="product-card-head">
                    <div className="product-avatar">
                      {p.categoria.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <strong>{p.nome}</strong>
                      <span className="meta">SKU: {p.sku}</span>
                    </div>
                  </div>
                  <div className="product-card-meta">
                    <span>{p.categoria}</span>
                    <span>{p.linha}</span>
                    <span>{p.qtdOPs} OP(s)</span>
                  </div>
                  <div className="recycled-meter">
                    <div className="recycled-meter-top">
                      <span>Material reciclado</span>
                      <strong>{p.percentualReciclado}%</strong>
                    </div>
                    <div className="progress-mini">
                      <div
                        className="bar"
                        style={{ width: `${p.percentualReciclado}%` }}
                      />
                    </div>
                  </div>
                  <div className="product-card-footer">
                    <span className="badge badge-green">{p.status}</span>
                    <span
                      className={`badge ${
                        p.qtdFichas > 0 ? "badge-blue" : "badge-orange"
                      }`}
                    >
                      {p.qtdFichas > 0 ? "Ficha vinculada" : "Sem ficha"}
                    </span>
                  </div>
                  <div className="crud-actions">
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setVisualizando(p)}
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => iniciarEdicao(p)}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn danger"
                      type="button"
                      onClick={() => confirmarExclusao(p)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
