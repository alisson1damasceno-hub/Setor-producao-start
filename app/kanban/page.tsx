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

export default function KanbanPage() {
  const {
    ordens,
    carregando,
    erro,
    avancar,
    voltar,
    pausar,
    retomar,
    concluir,
    cancelarOrdem,
    adicionarObservacao,
  } = useOrdens();

  const [tema, setTema] = useState<"dark" | "light">("dark");
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });

  const [busca, setBusca] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] =
  useState<Prioridade | "todas">("todas");
  const [filtroResponsavel, setFiltroResponsavel] = useState("todos");

  const [opDetalhada, setOpDetalhada] = useState<OrdemProducao | null>(null);
  const [novaObservacao, setNovaObservacao] = useState("");

  const opDetalhadaAtualizada = useMemo(() => {
    if (!opDetalhada) return null;
    return ordens.find((op) => op.id === opDetalhada.id) || null;
  }, [ordens, opDetalhada]);

  const responsaveis = useMemo(() => {
    const lista = ordens.map((op) => op.responsible).filter(Boolean);
    return Array.from(new Set(lista));
  }, [ordens]);

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((op) => {
      const texto =
      `${op.code} ${op.product_name} ${op.responsible} ${op.lot}`.toLowerCase();

      return (
        texto.includes(busca.toLowerCase()) &&
        (filtroPrioridade === "todas" || op.priority === filtroPrioridade) &&
        (filtroResponsavel === "todos" || op.responsible === filtroResponsavel)
      );
    });
  }, [ordens, busca, filtroPrioridade, filtroResponsavel]);

  function ordensPorEtapa(etapa: Etapa) {
    return ordensFiltradas.filter((op) => op.stage === etapa);
  }

  function salvarObservacaoModal() {
    if (!opDetalhadaAtualizada) return;
    if (!novaObservacao.trim()) return;

    adicionarObservacao(opDetalhadaAtualizada.id, novaObservacao);
    setNovaObservacao("");
  }

  if (carregando) {
    return <main className="kanban-page dark">Carregando Kanban...</main>;
  }

  return (
    <main
    className={`kanban-page ${tema}`}
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

    <p className="eyebrow">Fluxo de produção</p>

    <h1>Kanban</h1>

    <p className="subtitle">
    Mova as OPs entre etapas, pause gargalos e conclua a produção com
    clareza.
    </p>
    </div>

    <div className="hero-actions">
    <Link href="/ops" className="ghost link-btn">
    Ver OPs
    </Link>

    <button
    className="ghost"
    onClick={() => setTema(tema === "dark" ? "light" : "dark")}
    >
    {tema === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </button>
    </div>
    </header>

    {erro && <div className="error">{erro}</div>}

    <section className="toolbar">
    <input
    placeholder="Buscar OP, produto, lote ou responsável..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    />

    <select
    value={filtroPrioridade}
    onChange={(e) =>
      setFiltroPrioridade(e.target.value as Prioridade | "todas")
    }
    >
    <option value="todas">Todas as prioridades</option>
    {prioridades.map((prioridade) => (
      <option key={prioridade} value={prioridade}>
      {prioridade}
      </option>
    ))}
    </select>

    <select
    value={filtroResponsavel}
    onChange={(e) => setFiltroResponsavel(e.target.value)}
    >
    <option value="todos">Todos responsáveis</option>
    {responsaveis.map((responsavel) => (
      <option key={responsavel} value={responsavel}>
      {responsavel}
      </option>
    ))}
    </select>
    </section>

    <section className="kanban-board">
    {ETAPAS_ORDEM.map((etapa) => {
      const itens = ordensPorEtapa(etapa);

      return (
        <div className="column" key={etapa}>
        <div className="column-head">
        <div>
        <h2>{ETAPA_LABEL[etapa]}</h2>
        <span>{itens.length} OPs</span>
        </div>

        <div className="column-dot" />
        </div>

        <div className="column-list">
        {itens.map((op) => (
          <KanbanCard
          key={op.id}
          op={op}
          onVerMais={() => {
            setOpDetalhada(op);
            setNovaObservacao("");
          }}
          onAvancar={() => avancar(op.id)}
          onVoltar={() => voltar(op.id)}
          onPausar={() => pausar(op.id)}
          onRetomar={() => retomar(op.id)}
          onConcluir={() => concluir(op.id)}
          onCancelar={() => cancelarOrdem(op.id)}
          />
        ))}

        {itens.length === 0 && (
          <div className="empty-column">Nenhuma OP nesta etapa.</div>
        )}
        </div>
        </div>
      );
    })}
    </section>

    {opDetalhadaAtualizada && (
      <div className="modal-backdrop" onClick={() => setOpDetalhada(null)}>
      <section className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
      <div>
      <p className="eyebrow">Detalhes da OP</p>
      <h2>{opDetalhadaAtualizada.code}</h2>
      <p className="modal-subtitle">
      {opDetalhadaAtualizada.product_name}
      </p>
      </div>

      <button className="icon-btn" onClick={() => setOpDetalhada(null)}>
      ×
      </button>
      </div>

      <div className="modal-status-row">
      <span className={`status ${statusClass(opDetalhadaAtualizada.status)}`}>
      {opDetalhadaAtualizada.status}
      </span>

      <span
      className={`priority ${opDetalhadaAtualizada.priority
        .toLowerCase()
        .replace("é", "e")}`}
        >
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
        <button className="step-action" onClick={() => voltar(opDetalhadaAtualizada.id)}>
        ← Voltar etapa
        </button>

        <button
        className="step-action"
        onClick={() => avancar(opDetalhadaAtualizada.id)}
        >
        Avançar etapa →
        </button>

        {opDetalhadaAtualizada.status === "Pausada" ? (
          <button onClick={() => retomar(opDetalhadaAtualizada.id)}>
          Retomar
          </button>
        ) : (
          <button onClick={() => pausar(opDetalhadaAtualizada.id)}>
          Pausar
          </button>
        )}

        <button onClick={() => concluir(opDetalhadaAtualizada.id)}>
        Concluir
        </button>

        <button
        className="danger-btn"
        onClick={() => cancelarOrdem(opDetalhadaAtualizada.id)}
        >
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

      .kanban-page {
        min-height: 100vh;
        padding: 34px;
        font-family: Inter, Arial, sans-serif;
        position: relative;
        overflow-x: hidden;
        transition: 0.25s ease;
      }

      .kanban-page.dark {
        --bg: #080b12;
        --card: rgba(15, 23, 42, 0.78);
        --card-strong: rgba(17, 24, 39, 0.94);
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

      .kanban-page.light {
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
      .toolbar,
      .kanban-board,
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
        max-width: 620px;
        font-size: 16px;
      }

      .hero-actions {
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

      .ghost:hover,
      .card-actions button:hover,
      .modal-actions button:hover {
        transform: translateY(-2px);
      }

      .link-btn {
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      }

      .toolbar {
        display: grid;
        grid-template-columns: 1fr 220px 240px;
        gap: 12px;
        padding: 14px;
        margin: 22px 0;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        backdrop-filter: blur(18px);
        box-shadow: 0 20px 55px rgba(0, 0, 0, 0.10);
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

      .kanban-board {
        display: grid;
        grid-template-columns: repeat(6, minmax(290px, 1fr));
        gap: 16px;
        overflow-x: auto;
        padding-bottom: 12px;
      }

      .column {
        min-height: 620px;
        background: rgba(148, 163, 184, 0.07);
        border: 1px solid var(--line);
        border-radius: 26px;
        padding: 14px;
        backdrop-filter: blur(16px);
      }

      .column-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 8px 16px;
      }

      .column-head h2 {
        margin: 0;
        font-size: 18px;
        letter-spacing: -0.03em;
      }

      .column-head span {
        color: var(--muted);
        font-size: 13px;
      }

      .column-dot {
        width: 13px;
        height: 13px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--accent), var(--accent2));
        box-shadow: 0 0 24px rgba(124, 58, 237, 0.7);
      }

      .column-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .kanban-card {
        padding: 16px;
        border-radius: 22px;
        background: var(--card-strong);
        border: 1px solid var(--line);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
        transition: 0.2s ease;
      }

      .kanban-card:hover {
        transform: translateY(-3px);
        border-color: rgba(124, 58, 237, 0.42);
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
      }

      .code {
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.05em;
        margin-top: 9px;
      }

      .product {
        color: var(--muted);
        margin-top: 3px;
        line-height: 1.35;
      }

      .priority,
      .status {
        display: inline-flex;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 900;
        padding: 6px 9px;
        white-space: nowrap;
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

      .mini-info,
      .modal-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin: 14px 0;
      }

      .mini-info span,
      .info-box {
        padding: 10px;
        border-radius: 14px;
        background: rgba(148, 163, 184, 0.08);
        color: var(--muted);
        font-size: 12px;
      }

      .mini-info b,
      .info-box b {
        display: block;
        color: var(--text);
        margin-bottom: 2px;
      }

      .progress-line,
      .stage-line {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 12px;
        margin-bottom: 7px;
      }

      .progress {
        height: 10px;
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
        line-height: 1.4;
      }

      .note {
        margin: 12px 0 0;
        padding: 10px;
        border-radius: 14px;
        background: rgba(148, 163, 184, 0.08);
        font-size: 13px;
      }

      .card-actions,
      .modal-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .card-actions button,
      .modal-actions button {
        border: 1px solid var(--line);
        background: rgba(148, 163, 184, 0.08);
        color: var(--text);
        padding: 8px 10px;
        border-radius: 12px;
        cursor: pointer;
        transition: 0.18s ease;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .primary,
      .primary-action,
      .step-action {
        color: white !important;
        border: none !important;
        background: linear-gradient(135deg, var(--accent), var(--accent2)) !important;
        font-weight: 800;
        box-shadow: 0 16px 34px rgba(124, 58, 237, 0.28);
      }

      .primary {
        border-radius: 16px;
        padding: 13px 18px;
        cursor: pointer;
      }

      .step-action {
        min-width: 92px;
      }

      .danger-btn {
        color: var(--red) !important;
        background: rgba(251, 113, 133, 0.10) !important;
        border: 1px solid rgba(251, 113, 133, 0.18) !important;
        box-shadow: none !important;
      }

      .empty-column {
        border: 1px dashed var(--line);
        border-radius: 20px;
        padding: 24px;
        color: var(--muted);
        text-align: center;
        font-size: 14px;
      }

      .error {
        margin-top: 16px;
        padding: 14px;
        border-radius: 16px;
        color: var(--red);
        background: rgba(251, 113, 133, 0.12);
        border: 1px solid rgba(251, 113, 133, 0.22);
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

      textarea {
        margin-top: 12px;
        min-height: 88px;
        resize: vertical;
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
      }

      @media (max-width: 520px) {
        .kanban-page {
          padding: 18px;
        }

        .kanban-board {
          grid-template-columns: repeat(6, 280px);
        }

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

function KanbanCard({
  op,
  onVerMais,
  onAvancar,
  onVoltar,
  onPausar,
  onRetomar,
  onConcluir,
  onCancelar,
}: {
  op: OrdemProducao;
  onVerMais: () => void;
  onAvancar: () => void;
  onVoltar: () => void;
  onPausar: () => void;
  onRetomar: () => void;
  onConcluir: () => void;
  onCancelar: () => void;
}) {
  return (
    <article className="kanban-card">
    <div className="card-top">
    <div>
    <span className={`priority ${op.priority.toLowerCase().replace("é", "e")}`}>
    {op.priority}
    </span>

    <div className="code">{op.code}</div>
    <div className="product">{op.product_name}</div>
    </div>

    <span className={`status ${statusClass(op.status)}`}>{op.status}</span>
    </div>

    <div className="mini-info">
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

    <div className="progress-line">
    <span>{ETAPA_LABEL[op.stage]}</span>
    <span>{op.progress}%</span>
    </div>

    <div className="progress">
    <div style={{ width: `${op.progress}%` }} />
    </div>

    {op.observations && <p className="note">{op.observations}</p>}

    <div className="card-actions">
    <button className="primary-action" onClick={onVerMais}>
    Ver mais
    </button>

    <button className="step-action" onClick={onVoltar}>
    ← Voltar
    </button>

    <button className="step-action" onClick={onAvancar}>
    Avançar →
    </button>

    {op.status === "Pausada" ? (
      <button onClick={onRetomar}>Retomar</button>
    ) : (
      <button onClick={onPausar}>Pausar</button>
    )}

    <button onClick={onConcluir}>Concluir</button>

    <button className="danger-btn" onClick={onCancelar}>
    Cancelar
    </button>
    </div>
    </article>
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
