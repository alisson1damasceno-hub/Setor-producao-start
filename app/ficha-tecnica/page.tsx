"use client";

import { useState, FormEvent } from "react";
import {
  ClipboardList, Clock3, Coins, Pencil,
  PlusCircle, Save, Trash2, X, Calculator
} from "lucide-react";
import { Shell } from "../shared/shell";
import { useAppData } from "../shared/store";
import type { TechnicalSheet, RawMaterial } from "../shared/types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function newMaterial(): RawMaterial {
  return {
    id: `mp-${Date.now()}`,
    name: "",
    quantity: 1,
    unit: "kg",
    unitCost: 0,
  };
}

type SheetForm = Omit<TechnicalSheet, "id" | "code">;

const emptyForm: SheetForm = {
  productId: "",
  version: "1.0",
  cycleMinutes: 30,
  unitCost: 0,
  rawMaterials: [newMaterial()],
  steps: "",
  status: "Aprovada",
};

export default function FichaTecnicaPage() {
  const { products, sheets, orders, addSheet, updateSheet, deleteSheet } = useAppData();

  const [form, setForm] = useState<SheetForm>({ ...emptyForm, productId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const productId = form.productId || products[0]?.id || "";
  const validMaterials = form.rawMaterials.filter((m) => m.name.trim() !== "");
  const calculatedCost = validMaterials.reduce(
    (total, m) => total + m.quantity * m.unitCost, 0
  );
  const editingSheet = sheets.find((s) => s.id === editingId);

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "Produto não encontrado";
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, productId: products[0]?.id ?? "" });
  }

  function updateMaterial(id: string, patch: Partial<RawMaterial>) {
    setForm((f) => ({
      ...f,
      rawMaterials: f.rawMaterials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  function addMaterial() {
    setForm((f) => ({ ...f, rawMaterials: [...f.rawMaterials, newMaterial()] }));
  }

  function removeMaterial(id: string) {
    setForm((f) => ({
      ...f,
      rawMaterials: f.rawMaterials.length > 1
        ? f.rawMaterials.filter((m) => m.id !== id)
        : [newMaterial()],
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!productId || validMaterials.length === 0 || !form.steps) return;

    const payload = { ...form, productId, rawMaterials: validMaterials, unitCost: calculatedCost };

    if (editingId && editingSheet) {
      updateSheet({ ...payload, id: editingId, code: editingSheet.code });
    } else {
      addSheet(payload);
    }

    resetForm();
  }

  function startEdit(sheet: TechnicalSheet) {
    setEditingId(sheet.id);
    setForm({
      productId: sheet.productId,
      version: sheet.version,
      cycleMinutes: sheet.cycleMinutes,
      unitCost: sheet.unitCost,
      rawMaterials: sheet.rawMaterials.length ? sheet.rawMaterials : [newMaterial()],
      steps: sheet.steps,
      status: sheet.status,
    });
  }

  function handleDelete(sheet: TechnicalSheet) {
    const linked = orders.filter((o) => o.sheetId === sheet.id).length;
    const msg = linked > 0
      ? `Excluir ${sheet.code} também remove ${linked} ordem(ns) vinculada(s). Confirmar?`
      : `Excluir ${sheet.code}?`;
    if (window.confirm(msg)) deleteSheet(sheet.id);
  }

  return (
    <Shell active="ficha">
      <div className="page-header">
        <div>
          <h2>Fichas Técnicas</h2>
          <p className="subtitle">Cadastre a receita produtiva com matérias-primas e etapas.</p>
        </div>
      </div>

      <div className="workbench-grid">

        {/* Formulário */}
        <form className="card form-panel" onSubmit={handleSubmit}>
          <h3>{editingId ? "Editar ficha" : "Nova ficha"}</h3>
          {editingSheet && <p className="subtitle">Editando {editingSheet.code}</p>}

          <div className="form-group">
            <label className="required">Produto</label>
            <select
              value={productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              disabled={products.length === 0}
            >
              {products.length === 0
                ? <option>Nenhum produto cadastrado</option>
                : products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
              }
            </select>
          </div>

          <div className="row">
            <div className="form-group">
              <label>Versão</label>
              <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Ciclo (min)</label>
              <input type="number" min="1" value={form.cycleMinutes}
                onChange={(e) => setForm({ ...form, cycleMinutes: Number(e.target.value) })} />
            </div>
          </div>

          <div className="row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TechnicalSheet["status"] })}>
                <option>Aprovada</option>
                <option>Em revisão</option>
              </select>
            </div>
            <div className="form-group">
              <label>Custo MP/un.</label>
              <input readOnly value={currency.format(calculatedCost)} />
            </div>
          </div>

          {/* Editor de matérias-primas */}
          <div className="form-group">
            <div className="mp-header">
              <label className="required">Matérias-primas</label>
              <button type="button" className="btn btn-secondary" onClick={addMaterial}>
                <PlusCircle size={14} /> Adicionar MP
              </button>
            </div>

            <div className="mp-editor">
              <div className="mp-labels">
                <span>Nome</span><span>Qtd</span><span>Un</span><span>R$/un</span><span>Total</span><span />
              </div>
              {form.rawMaterials.map((m) => (
                <div className="mp-row" key={m.id}>
                  <input placeholder="Ex: Aço" value={m.name}
                    onChange={(e) => updateMaterial(m.id, { name: e.target.value })} />
                  <input type="number" min="0" step="0.001" value={m.quantity}
                    onChange={(e) => updateMaterial(m.id, { quantity: Number(e.target.value) })} />
                  <input placeholder="kg" value={m.unit}
                    onChange={(e) => updateMaterial(m.id, { unit: e.target.value })} />
                  <input type="number" min="0" step="0.01" value={m.unitCost}
                    onChange={(e) => updateMaterial(m.id, { unitCost: Number(e.target.value) })} />
                  <strong>{currency.format(m.quantity * m.unitCost)}</strong>
                  <button type="button" className="icon-btn danger" onClick={() => removeMaterial(m.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mp-total">
              <Calculator size={15} />
              <span>Custo total por unidade</span>
              <strong>{currency.format(calculatedCost)}</strong>
            </div>
          </div>

          <div className="form-group">
            <label className="required">Etapas de produção</label>
            <textarea placeholder="Ex: Corte, solda, pintura, inspeção" value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })} />
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit"
              disabled={products.length === 0 || validMaterials.length === 0}>
              {editingId ? <><Save size={15} /> Salvar edição</> : <><PlusCircle size={15} /> Salvar ficha</>}
            </button>
            {editingId && (
              <button className="btn btn-secondary" type="button" onClick={resetForm}>
                <X size={15} /> Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista de fichas */}
        <div className="card">
          <h3>Fichas cadastradas</h3>
          <p className="subtitle">{sheets.length} ficha(s) no sistema</p>

          {sheets.length === 0
            ? <div className="empty-column">Nenhuma ficha cadastrada ainda.</div>
            : (
              <div className="sheet-list">
                {sheets.map((sheet) => (
                  <article className="sheet-card" key={sheet.id}>
                    <div className="sheet-card-head">
                      <div>
                        <span className="sheet-code">{sheet.code}</span>
                        <strong>{productName(sheet.productId)}</strong>
                      </div>
                      <span className={`badge ${sheet.status === "Aprovada" ? "badge-green" : "badge-orange"}`}>
                        {sheet.status}
                      </span>
                    </div>

                    <div className="sheet-metrics">
                      <span><Clock3 size={13} /> {sheet.cycleMinutes} min</span>
                      <span><Coins size={13} /> {currency.format(sheet.unitCost)}/un</span>
                      <span><ClipboardList size={13} /> v{sheet.version}</span>
                    </div>

                    <div className="sheet-steps">
                      <span>Etapas:</span> {sheet.steps}
                    </div>

                    <div className="sheet-materials">
                      {sheet.rawMaterials.map((m) => (
                        <span key={m.id} className="mp-tag">{m.name} · {m.quantity}{m.unit}</span>
                      ))}
                    </div>

                    <div className="card-actions">
                      <button className="icon-btn" onClick={() => startEdit(sheet)} title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDelete(sheet)} title="Excluir">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        </div>

      </div>
    </Shell>
  );
}