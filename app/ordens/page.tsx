"use client";

import { useState, FormEvent } from "react";
import {
  Factory, Pencil, PlusCircle, Save,
  Trash2, X, Coins, Package
} from "lucide-react";
import { Shell } from "../shared/shell";
import { useAppData } from "../shared/store";
import type { ProductionOrder, ProductionStage } from "../shared/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const stageLabels: Record<ProductionStage, string> = {
  recepcao: "Recepção",
  processamento: "Processamento",
  fabricacao: "Fabricação",
  qualidade: "Teste de Qualidade",
  embalagem: "Embalagem",
  concluido: "Concluído",
};

const stageBadge: Record<ProductionStage, string> = {
  recepcao: "badge-blue",
  processamento: "badge-blue",
  fabricacao: "badge-orange",
  qualidade: "badge-orange",
  embalagem: "badge-orange",
  concluido: "badge-green",
};

type OrderForm = Pick<ProductionOrder,
  "sheetId" | "quantity" | "dueDate" | "priority" | "responsible" | "stage" | "progress"
>;

const emptyForm: OrderForm = {
  sheetId: "",
  quantity: 100,
  dueDate: new Date().toISOString().slice(0, 10),
  priority: "Média",
  responsible: "",
  stage: "recepcao",
  progress: 0,
};

export default function OrdensPage() {
  const { products, sheets, orders, addOrder, updateOrder, deleteOrder } = useAppData();

  const [form, setForm] = useState<OrderForm>({ ...emptyForm, sheetId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const sheetId = form.sheetId || sheets[0]?.id || "";
  const selectedSheet = sheets.find((s) => s.id === sheetId);
  const editingOrder = orders.find((o) => o.id === editingId);

  function sheetLabel(id: string) {
    const sheet = sheets.find((s) => s.id === id);
    const product = products.find((p) => p.id === sheet?.productId);
    return sheet && product ? `${sheet.code} — ${product.name}` : "Ficha não encontrada";
  }

  function orderCost(order: ProductionOrder) {
    const sheet = sheets.find((s) => s.id === order.sheetId);
    return sheet ? sheet.unitCost * order.quantity : 0;
  }

  function plannedConsumption() {
    if (!selectedSheet) return [];
    return selectedSheet.rawMaterials.map((m) => ({
      ...m,
      totalQty: m.quantity * form.quantity,
      totalCost: m.quantity * m.unitCost * form.quantity,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, sheetId: sheets[0]?.id ?? "" });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!sheetId) return;

    if (editingId && editingOrder) {
      updateOrder({ ...editingOrder, ...form, sheetId });
    } else {
      addOrder({
        sheetId,
        quantity: form.quantity,
        dueDate: form.dueDate,
        priority: form.priority,
        responsible: form.responsible,
      });
    }

    resetForm();
  }

  function startEdit(order: ProductionOrder) {
    setEditingId(order.id);
    setForm({
      sheetId: order.sheetId,
      quantity: order.quantity,
      dueDate: order.dueDate,
      priority: order.priority,
      responsible: order.responsible,
      stage: order.stage,
      progress: order.progress,
    });
  }

  function handleDelete(order: ProductionOrder) {
    if (window.confirm(`Excluir ${order.code}?`)) {
      deleteOrder(order.id);
      if (editingId === order.id) resetForm();
    }
  }

  return (
    <Shell active="ordens">
      <div className="page-header">
        <div>
          <h2>Ordens de Produção</h2>
          <p className="subtitle">Crie e acompanhe ordens vinculadas às fichas técnicas.</p>
        </div>
      </div>

      <div className="workbench-grid">

        {/* Formulário */}
        <form className="card form-panel" onSubmit={handleSubmit}>
          <h3>{editingId ? "Editar ordem" : "Nova ordem"}</h3>
          {editingOrder && <p className="subtitle">Editando {editingOrder.code}</p>}

          <div className="form-group">
            <label className="required">Ficha técnica</label>
            <select
              value={sheetId}
              onChange={(e) => setForm({ ...form, sheetId: e.target.value })}
              disabled={sheets.length === 0}
            >
              {sheets.length === 0
                ? <option>Nenhuma ficha cadastrada</option>
                : sheets.map((s) => (
                    <option key={s.id} value={s.id}>{sheetLabel(s.id)}</option>
                  ))
              }
            </select>
          </div>

          <div className="row">
            <div className="form-group">
              <label>Quantidade</label>
              <input
                type="number" min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Prazo</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div className="form-group">
              <label>Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as ProductionOrder["priority"] })}
              >
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
            <div className="form-group">
              <label>Responsável</label>
              <input
                placeholder="Nome do responsável"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              />
            </div>
          </div>

          {editingId && (
            <div className="row">
              <div className="form-group">
                <label>Etapa atual</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value as ProductionStage })}
                >
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Progresso (%)</label>
                <input
                  type="number" min="0" max="100"
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                />
              </div>
            </div>
          )}

          {/* Consumo previsto de MP */}
          {selectedSheet && selectedSheet.rawMaterials.length > 0 && (
            <div className="consumption-box">
              <div className="consumption-head">
                <Package size={15} />
                <div>
                  <strong>Consumo previsto de MP</strong>
                  <span>{form.quantity} un · baseado em {selectedSheet.code}</span>
                </div>
              </div>
              {plannedConsumption().map((m) => (
                <div className="consumption-row" key={m.id}>
                  <span>{m.name}</span>
                  <strong>{m.totalQty.toLocaleString("pt-BR")} {m.unit}</strong>
                  <strong>{currency.format(m.totalCost)}</strong>
                </div>
              ))}
              <div className="consumption-total">
                <Coins size={14} />
                <span>Custo total previsto</span>
                <strong>{currency.format(plannedConsumption().reduce((t, m) => t + m.totalCost, 0))}</strong>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={sheets.length === 0}>
              {editingId
                ? <><Save size={15} /> Salvar edição</>
                : <><PlusCircle size={15} /> Abrir OP</>
              }
            </button>
            {editingId && (
              <button className="btn btn-secondary" type="button" onClick={resetForm}>
                <X size={15} /> Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Tabela de ordens */}
        <div className="card">
          <h3>Ordens geradas</h3>
          <p className="subtitle">{orders.length} ordem(ns) no sistema</p>

          {orders.length === 0
            ? <div className="empty-column">Nenhuma ordem cadastrada ainda.</div>
            : (
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>OP</th>
                      <th>Ficha</th>
                      <th>Qtd</th>
                      <th>Custo MP</th>
                      <th>Prazo</th>
                      <th>Prioridade</th>
                      <th>Etapa</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.code}</strong>
                          <span className="meta">{order.responsible || "—"}</span>
                        </td>
                        <td>{sheetLabel(order.sheetId)}</td>
                        <td>{order.quantity} un</td>
                        <td>{currency.format(orderCost(order))}</td>
                        <td>{new Date(`${order.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}</td>
                        <td>
                          <span className={`badge ${
                            order.priority === "Alta" ? "badge-orange" :
                            order.priority === "Baixa" ? "badge-green" : "badge-blue"
                          }`}>
                            {order.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${stageBadge[order.stage]}`}>
                            {stageLabels[order.stage]}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-btn" onClick={() => startEdit(order)} title="Editar">
                              <Pencil size={14} />
                            </button>
                            <button className="icon-btn danger" onClick={() => handleDelete(order)} title="Excluir">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

      </div>
    </Shell>
  );
}


