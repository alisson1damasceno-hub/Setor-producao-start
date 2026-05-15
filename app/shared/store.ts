"use client";

import { useState, useEffect } from "react";
import type { AppData, TechnicalSheet, ProductionOrder } from "./types";

const STORAGE_KEY = "setor-producao-data";

const initialData: AppData = {
  products: [
    { id: "p1", name: "Cadeira Flex", category: "Mobiliário" },
    { id: "p2", name: "Mesa Retrô", category: "Mobiliário" },
    { id: "p3", name: "Estante Modular", category: "Armazenamento" },
  ],
  sheets: [],
  orders: [],
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateCode(prefix: string, list: { code: string }[]) {
  const num = String(list.length + 1).padStart(3, "0");
  return `${prefix}-${num}`;
}

function loadData(): AppData {
  if (typeof window === "undefined") return initialData;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  } catch {
    return initialData;
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useAppData() {
  const [data, setData] = useState<AppData>(initialData);

  useEffect(() => {
    setData(loadData());
  }, []);

  function persist(newData: AppData) {
    setData(newData);
    saveData(newData);
  }

  function addSheet(sheet: Omit<TechnicalSheet, "id" | "code">) {
    const newSheet: TechnicalSheet = {
      ...sheet,
      id: generateId("sheet"),
      code: generateCode("FT", data.sheets),
      unitCost: sheet.rawMaterials.reduce((t, m) => t + m.quantity * m.unitCost, 0),
    };
    persist({ ...data, sheets: [...data.sheets, newSheet] });
  }

  function updateSheet(sheet: TechnicalSheet) {
    persist({
      ...data,
      sheets: data.sheets.map((s) => (s.id === sheet.id ? sheet : s)),
    });
  }

  function deleteSheet(id: string) {
    persist({
      ...data,
      sheets: data.sheets.filter((s) => s.id !== id),
      orders: data.orders.filter((o) => o.sheetId !== id),
    });
  }

  function addOrder(order: Omit<ProductionOrder, "id" | "code" | "stage" | "progress" | "createdAt">) {
    const newOrder: ProductionOrder = {
      ...order,
      id: generateId("order"),
      code: generateCode("OP", data.orders),
      stage: "recepcao",
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    persist({ ...data, orders: [...data.orders, newOrder] });
  }

  function updateOrder(order: ProductionOrder) {
    persist({
      ...data,
      orders: data.orders.map((o) => (o.id === order.id ? order : o)),
    });
  }

  function deleteOrder(id: string) {
    persist({
      ...data,
      orders: data.orders.filter((o) => o.id !== id),
    });
  }

  return {
    products: data.products,
    sheets: data.sheets,
    orders: data.orders,
    addSheet,
    updateSheet,
    deleteSheet,
    addOrder,
    updateOrder,
    deleteOrder,
  };
}