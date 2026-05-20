"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ETAPA_LABEL,
  ETAPAS_ORDEM,
  type Etapa,
  type OrdemProducao,
  type Prioridade,
} from "../shared/Ops e Kanban/types";
import { useOrdens } from "../shared/Ops e Kanban/useOrdens";

const prioridades: Prioridade[] = ["Alta", "Média", "Baixa"];

export default function OpsPage() {
  const {
    ordens,
    carregando,
    erro,
    criarOrdem,
    editarOrdem,
    excluirOrdem,
    cancelarOrdem,
    avancar,
    voltar,
    pausar,
    retomar,
    concluir,
    adicionarObservacao,
    resetarDados,
  } = useOrdens();

  const [tema, setTema] = useState<"dark" | "light">("dark");
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });

  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<Etapa | "todas">("todas");
  const [filtroPrioridade, setFiltroPrioridade] = useState<Prioridade | "todas">("todas");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<OrdemProducao | null>(null);
  const [opDetalhada, setOpDetalhada] = useState<OrdemProducao | null>(null);
  const [novaObservacao, setNovaObservacao] = useState("");

  const [form, setForm] = useState({
    code: "",
    sheet_id: "",
    product_name: "",
    quantity: 1,
    due_date: "",
    priority: "Média" as Prioridade,
    responsible: "",
    lot: "",
    stage: "recepcao" as Etapa,
    observations: "",
  });

  const opDetalhadaAtualizada = useMemo(() => {
    if (!opDetalhada) return null;
    return ordens.find((op) => op.id === opDetalhada.id) || null;
  }, [ordens, opDetalhada]);

  function limparForm() {
    setForm({
      code: "",
      sheet_id: "",
      product_name: "",
      quantity: 1,
      due_date: "",
      priority: "Média",
      responsible: "",
      lot: "",
      stage: "recepcao",
      observations: "",
    });

    setEditando(null);
  }

  function abrirEdicao(op: OrdemProducao) {
    setEditando(op);
    setMostrarForm(true);

    setForm({
      code: op.code,
      sheet_id: op.sheet_id,
      product_name: op.product_name,
      quantity: op.quantity,
      due_date: op.due_date,
      priority: op.priority,
      responsible: op.responsible,
      lot: op.lot,
      stage: op.stage,
      observations: op.observations,
    });
  }

  function salvarOP() {
    if (!form.code || !form.product_name || !form.due_date) {
      alert("Preencha código, produto e prazo.");
      return;
    }

    if (editando) {
      editarOrdem(editando.id, form);
    } else {
      criarOrdem(form);
    }

    limparForm();
    setMostrarForm(false);
  }

  function salvarObservacaoModal() {
    if (!opDetalhadaAtualizada) return;
    if (!novaObservacao.trim()) return;

    adicionarObservacao(opDetalhadaAtualizada.id, novaObservacao);
    setNovaObservacao("");
  }

  const ordensFiltradas = useMemo(() => {
    return ordens
    .filter((op) => {
      const texto = `${op.code} ${op.product_name} ${op.responsible} ${op.lot}`.toLowerCase();

      return (
        texto.includes(busca.toLowerCase()) &&
        (filtroEtapa === "todas" || op.stage === filtroEtapa) &&
        (filtroPrioridade === "todas" || op.priority === filtroPrioridade)
      );
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [ordens, busca, filtroEtapa, filtroPrioridade]);

  const totalAtrasadas = ordens.filter((op) => op.status === "Atrasada").length;
  const totalConcluidas = ordens.filter((op) => op.status === "Concluída").length;
  const totalAndamento = ordens.filter((op) => op.status === "Em andamento").length;
  const totalPausadas = ordens.filter((op) => op.status === "Pausada").length;

  if (carregando) {
    return <main className="ops-page dark">Carregando OPs...</main>;
  }

  return (
    <main
    className={`ops-page ${tema}`}
    onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
    >
    <div className="glow glow-one" />
    <div className="glow glow-two" />

    <div
    className="mouse-glow"
    style={{
      left: mouse.x,
      top: mouse.y,
    }}
    />

    <header className="hero">
    <div>
    <Link href="/" className="back">
    ← Início
    </Link>

    <p className="eyebrow">Módulo de produção</p>

    <h1>Visão de OPs</h1>

    <p className="subtitle">
    Controle as ordens, acompanhe prazos e mova a produção sem ruído.
    </p>
    </div>

    <div className="hero-actions">
    <Link href="/kanban" className="ghost link-btn">
    Kanban
    </Link>

    <button
    className="ghost"
    onClick={() => setTema(tema === "dark" ? "light" : "dark")}
    >
    {tema === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </button>

    <button
    className="primary"
    onClick={() => {
      limparForm();
      setMostrarForm(true);
    }}
    >
    + Nova OP
    </button>
    </div>
    </header>

    {erro && <div className="error">{erro}</div>}

    <section className="metrics">
    <Metric title="Total" value={ordens.length} />
    <Metric title="Andamento" value={totalAndamento} />
    <Metric title="Pausadas" value={totalPausadas} />
    <Metric title="Atrasadas" value={totalAtrasadas} danger />
    <Metric title="Concluídas" value={totalConcluidas} success />
    </section>

    <section className="toolbar">
    <input
    placeholder="Buscar OP, produto, lote ou responsável..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    />

    <select
    value={filtroEtapa}
    onChange={(e) => setFiltroEtapa(e.target.value as Etapa | "todas")}
    >
    <option value="todas">Todas as etapas</option>

    {ETAPAS_ORDEM.map((etapa) => (
      <option key={etapa} value={etapa}>
      {ETAPA_LABEL[etapa]}
      </option>
    ))}
    </select>

    <select
    value={filtroPrioridade}
    onChange={(e) => setFiltroPrioridade(e.target.value as Prioridade | "todas")}
    >
    <option value="todas">Todas as prioridades</option>

    {prioridades.map((prioridade) => (
      <option key={prioridade} value={prioridade}>
      {prioridade}
      </option>
    ))}
    </select>

    <button className="ghost" onClick={resetarDados}>
    Resetar
    </button>
    </section>

    {mostrarForm && (
      <section className="form-card">
      <div className="form-head">
      <div>
      <p className="eyebrow">{editando ? "Atualização" : "Cadastro"}</p>
      <h2>{editando ? "Editar OP" : "Nova ordem de produção"}</h2>
      </div>

      <button className="icon-btn" onClick={() => setMostrarForm(false)}>
      ×
      </button>
      </div>

      <div className="form-grid">
      <input
      placeholder="Código da OP"
      value={form.code}
      onChange={(e) => setForm({ ...form, code: e.target.value })}
      />

      <input
      placeholder="ID da ficha"
      value={form.sheet_id}
      onChange={(e) => setForm({ ...form, sheet_id: e.target.value })}
      />

      <input
      placeholder="Produto"
      value={form.product_name}
      onChange={(e) => setForm({ ...form, product_name: e.target.value })}
      />

      <input
      type="number"
      placeholder="Quantidade"
      value={form.quantity}
      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
      />

      <input
      type="date"
      value={form.due_date}
      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
      />

      <select
      value={form.priority}
      onChange={(e) => setForm({ ...form, priority: e.target.value as Prioridade })}
      >
      {prioridades.map((prioridade) => (
        <option key={prioridade} value={prioridade}>
        {prioridade}
        </option>
      ))}
      </select>

      <input
      placeholder="Responsável"
      value={form.responsible}
      onChange={(e) => setForm({ ...form, responsible: e.target.value })}
      />

      <input
      placeholder="Lote"
      value={form.lot}
      onChange={(e) => setForm({ ...form, lot: e.target.value })}
      />

      <select
      value={form.stage}
      onChange={(e) => setForm({ ...form, stage: e.target.value as Etapa })}
      >
      {ETAPAS_ORDEM.map((etapa) => (
        <option key={etapa} value={etapa}>
        {ETAPA_LABEL[etapa]}
        </option>
      ))}
      </select>
      </div>

      <textarea
      placeholder="Observações importantes..."
      value={form.observations}
      onChange={(e) => setForm({ ...form, observations: e.target.value })}
      />

      <div className="form-actions">
      <button className="primary" onClick={salvarOP}>
      {editando ? "Salvar alterações" : "Criar OP"}
      </button>

      <button
      className="ghost"
      onClick={() => {
        limparForm();
        setMostrarForm(false);
      }}
      >
      Cancelar
      </button>
      </div>
      </section>
    )}

    <section className="ops-grid">
    {ordensFiltradas.map((op) => (
      <article className="op-card" key={op.id}>
      <div className="op-top">
      <div>
      <span className={`priority ${op.priority.toLowerCase().replace("é", "e")}`}>
      {op.priority}
      </span>

      <h2>{op.code}</h2>
      <p>{op.product_name}</p>
      </div>

      <span className={`status ${statusClass(op.status)}`}>
      {op.status}
      </span>
      </div>

      <div className="op-info">
      <span>
      <b>Qtd</b>
      {op.quantity}
      </span>

      <span>
      <b>Prazo</b>
      {op.due_date}
      </span>

      <span>
      <b>Resp.</b>
      {op.responsible || "—"}
      </span>

      <span>
      <b>Lote</b>
      {op.lot || "—"}
      </span>
      </div>

      <div className="stage-line">
      <span>{ETAPA_LABEL[op.stage]}</span>
      <span>{op.progress}%</span>
      </div>

      <div className="progress">
      <div style={{ width: `${op.progress}%` }} />
      </div>

      {op.observations && <p className="note">{op.observations}</p>}

      <div className="actions">
      <button
      className="primary-action"
      onClick={() => {
        setOpDetalhada(op);
        setNovaObservacao("");
      }}
      >
      Ver mais
      </button>

      <button onClick={() => voltar(op.id)}>←</button>
      <button onClick={() => avancar(op.id)}>Avançar</button>

      {op.status === "Pausada" ? (
        <button onClick={() => retomar(op.id)}>Retomar</button>
      ) : (
        <button onClick={() => pausar(op.id)}>Pausar</button>
      )}

      <button onClick={() => concluir(op.id)}>Concluir</button>
      <button onClick={() => abrirEdicao(op)}>Editar</button>

      <button className="danger-btn" onClick={() => cancelarOrdem(op.id)}>
      Cancelar
      </button>

      <button className="danger-btn" onClick={() => excluirOrdem(op.id)}>
      Excluir
      </button>
      </div>
      </article>
    ))}

    {ordensFiltradas.length === 0 && (
      <div className="empty">Nenhuma OP encontrada.</div>
    )}
    </section>

    {opDetalhadaAtualizada && (
      <div className="modal-backdrop" onClick={() => setOpDetalhada(null)}>
      <section className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
      <div>
      <p className="eyebrow">Detalhes da OP</p>
      <h2>{opDetalhadaAtualizada.code}</h2>
      <p className="modal-subtitle">{opDetalhadaAtualizada.product_name}</p>
      </div>

      <button className="icon-btn" onClick={() => setOpDetalhada(null)}>
      ×
      </button>
      </div>

      <div className="modal-status-row">
      <span className={`status ${statusClass(opDetalhadaAtualizada.status)}`}>
      {opDetalhadaAtualizada.status}
      </span>

      <span className={`priority ${opDetalhadaAtualizada.priority.toLowerCase().replace("é", "e")}`}>
      {opDetalhadaAtualizada.priority}
      </span>
      </div>

      <div className="modal-info-grid">
      <Info label="Etapa atual" value={ETAPA_LABEL[opDetalhadaAtualizada.stage]} />
      <Info label="Progresso" value={`${opDetalhadaAtualizada.progress}%`} />
      <Info label="Quantidade" value={String(opDetalhadaAtualizada.quantity)} />
      <Info label="Prazo" value={opDetalhadaAtualizada.due_date} />
      <Info label="Responsável" value={opDetalhadaAtualizada.responsible || "—"} />
      <Info label="Lote" value={opDetalhadaAtualizada.lot || "—"} />
      <Info label="Ficha" value={opDetalhadaAtualizada.sheet_id || "—"} />
      <Info
      label="Última atualização"
      value={new Date(opDetalhadaAtualizada.updated_at).toLocaleString("pt-BR")}
      />
      </div>

      <div className="stage-line modal-progress-title">
      <span>{ETAPA_LABEL[opDetalhadaAtualizada.stage]}</span>
      <span>{opDetalhadaAtualizada.progress}%</span>
      </div>

      <div className="progress">
      <div style={{ width: `${opDetalhadaAtualizada.progress}%` }} />
      </div>

      <div className="modal-section">
      <h3>Observações</h3>

      {opDetalhadaAtualizada.observations ? (
        <p className="note">{opDetalhadaAtualizada.observations}</p>
      ) : (
        <p className="muted">Nenhuma observação registrada.</p>
      )}

      <textarea
      placeholder="Adicionar ou substituir observação..."
      value={novaObservacao}
      onChange={(e) => setNovaObservacao(e.target.value)}
      />

      <button className="primary" onClick={salvarObservacaoModal}>
      Salvar observação
      </button>
      </div>

      <div className="modal-section">
      <h3>Histórico</h3>

      <div className="timeline">
      {opDetalhadaAtualizada.historico.length > 0 ? (
        opDetalhadaAtualizada.historico.map((item) => (
          <div className="timeline-item" key={item.id}>
          <div className="dot" />
          <div>
          <strong>{item.acao}</strong>
          <span>{new Date(item.data).toLocaleString("pt-BR")}</span>
          </div>
          </div>
        ))
      ) : (
        <p className="muted">Nenhum histórico registrado.</p>
      )}
      </div>
      </div>

      <div className="modal-actions">
      <button onClick={() => voltar(opDetalhadaAtualizada.id)}>← Voltar etapa</button>
      <button className="primary-action" onClick={() => avancar(opDetalhadaAtualizada.id)}>
      Avançar etapa
      </button>

      {opDetalhadaAtualizada.status === "Pausada" ? (
        <button onClick={() => retomar(opDetalhadaAtualizada.id)}>Retomar</button>
      ) : (
        <button onClick={() => pausar(opDetalhadaAtualizada.id)}>Pausar</button>
      )}

      <button onClick={() => concluir(opDetalhadaAtualizada.id)}>Concluir</button>
      <button onClick={() => abrirEdicao(opDetalhadaAtualizada)}>Editar</button>
      <button className="danger-btn" onClick={() => cancelarOrdem(opDetalhadaAtualizada.id)}>
      Cancelar
      </button>
      </div>
      </section>
      </div>
    )}

    <style>{`
      * {
        box-sizing: border-box;
      }

      .ops-page {
        min-height: 100vh;
        padding: 34px;
        font-family: Inter, Arial, sans-serif;
        position: relative;
        overflow-x: hidden;
        transition: 0.25s ease;
      }

      .ops-page.dark {
        --bg: #080b12;
        --card: rgba(15, 23, 42, 0.78);
        --card-strong: rgba(17, 24, 39, 0.92);
        --text: #f8fafc;
        --muted: #94a3b8;
        --line: rgba(148, 163, 184, 0.16);
        --field: rgba(15, 23, 42, 0.95);
        --accent: #7c3aed;
        --accent2: #06b6d4;
        --green: #22c55e;
        --red: #fb7185;
        --yellow: #facc15;
        background:
        radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 35%),
          radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.16), transparent 35%),
          var(--bg);
          color: var(--text);
      }

      .ops-page.light {
        --bg: #f5f7fb;
        --card: rgba(255, 255, 255, 0.86);
        --card-strong: rgba(255, 255, 255, 0.96);
        --text: #0f172a;
        --muted: #64748b;
        --line: rgba(15, 23, 42, 0.10);
        --field: rgba(255, 255, 255, 0.98);
        --accent: #7c3aed;
        --accent2: #0891b2;
        --green: #16a34a;
        --red: #e11d48;
        --yellow: #ca8a04;
        background:
        radial-gradient(circle at top left, rgba(124, 58, 237, 0.12), transparent 35%),
          radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.12), transparent 35%),
          var(--bg);
          color: var(--text);
      }

      .glow {
        position: fixed;
        width: 280px;
        height: 280px;
        border-radius: 999px;
        filter: blur(90px);
        opacity: 0.45;
        pointer-events: none;
        z-index: 0;
      }

      .glow-one {
        top: 80px;
        right: 130px;
        background: var(--accent);
      }

      .glow-two {
        bottom: 80px;
        left: 80px;
        background: var(--accent2);
      }

      .mouse-glow {
        position: fixed;
        width: 220px;
        height: 220px;
        border-radius: 999px;
        pointer-events: none;
        transform: translate(-50%, -50%);
        background: radial-gradient(
          circle,
          rgba(124, 58, 237, 0.24),
                                    rgba(6, 182, 212, 0.12),
                                    transparent 72%
        );
        filter: blur(26px);
        opacity: 0.55;
        z-index: 0;
        transition: left 0.08s linear, top 0.08s linear;
      }

      .hero,
      .metrics,
      .toolbar,
      .form-card,
      .ops-grid,
      .error {
        position: relative;
        z-index: 1;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 22px;
        padding: 26px;
        border: 1px solid var(--line);
        background: linear-gradient(135deg, var(--card), rgba(124, 58, 237, 0.08));
        border-radius: 28px;
        backdrop-filter: blur(18px);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.16);
      }

      .back {
        color: var(--muted);
        text-decoration: none;
        font-size: 14px;
      }

      .eyebrow {
        margin: 14px 0 8px;
        color: var(--accent2);
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 12px;
        font-weight: 800;
      }

      h1 {
        margin: 0;
        font-size: clamp(34px, 5vw, 60px);
        line-height: 0.95;
        letter-spacing: -0.06em;
      }

      h2 {
        margin: 0;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      h3 {
        margin: 0 0 12px;
        font-size: 17px;
      }

      .subtitle,
      .modal-subtitle {
        margin: 14px 0 0;
        color: var(--muted);
        max-width: 590px;
        font-size: 16px;
      }

      .hero-actions,
      .form-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      .primary,
      .primary-action {
        border: none !important;
        border-radius: 16px;
        padding: 13px 18px;
        color: white !important;
        font-weight: 800;
        cursor: pointer;
        background: linear-gradient(135deg, var(--accent), var(--accent2)) !important;
        box-shadow: 0 16px 34px rgba(124, 58, 237, 0.28);
        transition: 0.18s ease;
      }

      .primary:hover,
      .ghost:hover,
      .actions button:hover,
      .modal-actions button:hover {
        transform: translateY(-2px);
      }

      .ghost {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 13px 16px;
        color: var(--text);
        background: var(--card);
        cursor: pointer;
        backdrop-filter: blur(14px);
        transition: 0.18s ease;
      }

      .link-btn {
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        margin: 22px 0;
      }

      .metric {
        padding: 20px;
        border-radius: 22px;
        background: var(--card);
        border: 1px solid var(--line);
        backdrop-filter: blur(16px);
      }

      .metric strong {
        display: block;
        font-size: 34px;
        letter-spacing: -0.06em;
      }

      .metric span {
        color: var(--muted);
        font-size: 13px;
      }

      .metric.success strong {
        color: var(--green);
      }

      .metric.danger strong {
        color: var(--red);
      }

      .toolbar,
      .form-card,
      .op-card,
      .empty {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        backdrop-filter: blur(18px);
        box-shadow: 0 20px 55px rgba(0, 0, 0, 0.10);
      }

      .toolbar {
        display: grid;
        grid-template-columns: 1fr 220px 220px auto;
        gap: 12px;
        padding: 14px;
        margin-bottom: 22px;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 15px;
        padding: 13px 14px;
        color: var(--text);
        background: var(--field);
        outline: none;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: var(--accent2);
        box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.12);
      }

      .form-card {
        padding: 22px;
        margin-bottom: 22px;
      }

      .form-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .icon-btn {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: var(--field);
        color: var(--text);
        cursor: pointer;
        font-size: 24px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      textarea {
        margin-top: 12px;
        min-height: 88px;
        resize: vertical;
      }

      .form-actions {
        margin-top: 14px;
      }

      .ops-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 16px;
      }

      .op-card {
        padding: 20px;
        transition: 0.2s ease;
      }

      .op-card:hover {
        transform: translateY(-4px);
        border-color: rgba(124, 58, 237, 0.42);
      }

      .op-top {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }

      .op-top h2 {
        margin: 10px 0 4px;
        font-size: 28px;
        letter-spacing: -0.05em;
      }

      .op-top p {
        margin: 0;
        color: var(--muted);
      }

      .priority,
      .status {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        padding: 7px 10px;
      }

      .priority.alta {
        color: var(--red);
        background: rgba(251, 113, 133, 0.12);
      }

      .priority.media {
        color: var(--yellow);
        background: rgba(250, 204, 21, 0.12);
      }

      .priority.baixa {
        color: var(--green);
        background: rgba(34, 197, 94, 0.12);
      }

      .status {
        white-space: nowrap;
      }

      .status.andamento {
        color: var(--accent2);
        background: rgba(6, 182, 212, 0.13);
      }

      .status.pausada {
        color: var(--yellow);
        background: rgba(250, 204, 21, 0.13);
      }

      .status.atrasada,
      .status.cancelada {
        color: var(--red);
        background: rgba(251, 113, 133, 0.13);
      }

      .status.concluida {
        color: var(--green);
        background: rgba(34, 197, 94, 0.13);
      }

      .op-info,
      .modal-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin: 18px 0;
      }

      .op-info span,
      .info-box {
        padding: 12px;
        border-radius: 16px;
        background: rgba(148, 163, 184, 0.08);
        color: var(--muted);
        font-size: 13px;
      }

      .op-info b,
      .info-box b {
        display: block;
        color: var(--text);
        margin-bottom: 3px;
        font-size: 12px;
      }

      .stage-line {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 13px;
        margin-bottom: 8px;
      }

      .progress {
        height: 11px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(148, 163, 184, 0.16);
      }

      .progress div {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--accent), var(--accent2), var(--green));
      }

      .note,
      .muted {
        color: var(--muted);
        line-height: 1.45;
      }

      .note {
        margin: 14px 0 0;
        padding: 12px;
        border-radius: 16px;
        background: rgba(148, 163, 184, 0.08);
      }

      .actions,
      .modal-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }

      .actions button,
      .modal-actions button {
        border: 1px solid var(--line);
        background: rgba(148, 163, 184, 0.08);
        color: var(--text);
        padding: 9px 11px;
        border-radius: 13px;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .actions .danger-btn,
      .modal-actions .danger-btn {
        color: var(--red);
        background: rgba(251, 113, 133, 0.10);
      }

      .error {
        margin-top: 16px;
        padding: 14px;
        border-radius: 16px;
        color: var(--red);
        background: rgba(251, 113, 133, 0.12);
        border: 1px solid rgba(251, 113, 133, 0.22);
      }

      .empty {
        padding: 34px;
        color: var(--muted);
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 30;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .modal {
        width: min(940px, 100%);
        max-height: 88vh;
        overflow-y: auto;
        border-radius: 30px;
        padding: 24px;
        background: var(--card-strong);
        border: 1px solid var(--line);
        box-shadow: 0 35px 100px rgba(0, 0, 0, 0.45);
      }

      .modal-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;
      }

      .modal-status-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .modal-progress-title {
        margin-top: 18px;
      }

      .modal-section {
        margin-top: 22px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
      }

      .timeline {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .timeline-item {
        display: grid;
        grid-template-columns: 16px 1fr;
        gap: 12px;
        align-items: start;
      }

      .dot {
        width: 12px;
        height: 12px;
        margin-top: 5px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--accent), var(--accent2));
        box-shadow: 0 0 20px rgba(124, 58, 237, 0.7);
      }

      .timeline-item strong {
        display: block;
      }

      .timeline-item span {
        display: block;
        color: var(--muted);
        font-size: 13px;
        margin-top: 4px;
      }

      @media (max-width: 920px) {
        .hero {
          flex-direction: column;
        }

        .toolbar {
          grid-template-columns: 1fr;
        }

        .metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .form-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 520px) {
        .ops-page {
          padding: 18px;
        }

        .ops-grid {
          grid-template-columns: 1fr;
        }

        .metrics,
        .op-info,
        .modal-info-grid {
          grid-template-columns: 1fr;
        }

        .modal-backdrop {
          padding: 12px;
        }

        .modal {
          border-radius: 22px;
        }
      }
      `}</style>
      </main>
  );
}

function Metric({
  title,
  value,
  success,
  danger,
}: {
  title: string;
  value: number;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`metric ${success ? "success" : ""} ${danger ? "danger" : ""}`}>
    <strong>{value}</strong>
    <span>{title}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-box">
    <b>{label}</b>
    {value}
    </div>
  );
}

function statusClass(status: string) {
  if (status === "Em andamento") return "andamento";
  if (status === "Pausada") return "pausada";
  if (status === "Atrasada") return "atrasada";
  if (status === "Concluída") return "concluida";
  if (status === "Cancelada") return "cancelada";
  return "";
}
