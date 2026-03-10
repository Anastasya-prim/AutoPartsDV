"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, isLoggedIn, getUserRole } from "@/lib/api";
import type { Supplier } from "@/lib/types";

interface SuppliersResponse {
  suppliers: Supplier[];
}

const EMPTY_FORM: Omit<Supplier, "id"> & { id: string } = {
  id: "",
  name: "",
  url: "",
  region: "",
  status: "online",
  apiType: "api",
};

export default function AdminSuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn() || getUserRole() !== "admin") {
      router.replace("/profile");
      return;
    }
  }, [router]);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await api<SuppliersResponse>("/suppliers");
      setSuppliers(data.suppliers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditingId(s.id);
    setForm({ id: s.id, name: s.name, url: s.url, region: s.region, status: s.status, apiType: s.apiType });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  async function handleSave() {
    setFormError("");
    if (!form.id.trim()) { setFormError("ID обязателен"); return; }
    if (!editingId && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.id.trim())) {
      setFormError("ID может содержать только латиницу в нижнем регистре, цифры и дефис");
      return;
    }
    if (!form.name.trim()) { setFormError("Название обязательно"); return; }
    if (!form.url.trim()) { setFormError("URL обязателен"); return; }
    try { new URL(form.url.trim()); } catch {
      setFormError("Некорректный формат URL (например: https://example.com)");
      return;
    }
    if (!form.region.trim()) { setFormError("Регион обязателен"); return; }

    setSaving(true);
    try {
      if (editingId) {
        await api(`/suppliers/${editingId}`, {
          method: "PUT",
          body: { name: form.name, url: form.url, region: form.region, status: form.status, apiType: form.apiType },
          auth: true,
        });
      } else {
        await api("/suppliers", {
          method: "POST",
          body: form,
          auth: true,
        });
      }
      closeForm();
      await loadSuppliers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await api(`/suppliers/${id}`, { method: "DELETE", auth: true });
      setDeleteConfirm(null);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    } finally {
      setSaving(false);
    }
  }

  const statusLabel: Record<string, string> = {
    online: "Работает",
    offline: "Недоступен",
    maintenance: "Обслуживание",
  };

  const statusColor: Record<string, string> = {
    online: "bg-green-100 text-green-700",
    offline: "bg-red-100 text-red-700",
    maintenance: "bg-yellow-100 text-yellow-700",
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && suppliers.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="font-medium text-red-700">Ошибка</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Управление поставщиками</h1>
          <p className="text-gray-500 text-sm mt-1">Добавление, редактирование и удаление поставщиков</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          + Добавить
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Скрыть</button>
        </div>
      )}

      {/* Форма создания / редактирования */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Редактировать поставщика" : "Новый поставщик"}
          </h2>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID (латиница, цифры, дефис)</label>
              <input
                type="text"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                disabled={!!editingId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="nahodka-parts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Находка Запчасти"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Приморский край"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Supplier["status"] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="online">Работает</option>
                <option value="offline">Недоступен</option>
                <option value="maintenance">Обслуживание</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип подключения</label>
              <select
                value={form.apiType}
                onChange={(e) => setForm({ ...form, apiType: e.target.value as Supplier["apiType"] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="api">API</option>
                <option value="scraper">Парсинг</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
            </button>
            <button
              onClick={closeForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Таблица поставщиков */}
      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Поставщики не найдены. Нажмите «+ Добавить», чтобы создать первого.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Регион</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.id}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.region}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[s.status] || ""}`}>
                        {statusLabel[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.apiType === "api" ? "API" : "Парсинг"}</td>
                    <td className="px-4 py-3 text-right">
                      {deleteConfirm === s.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-gray-500">Удалить?</span>
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={saving}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Нет
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-3">
                          <button
                            onClick={() => openEdit(s)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(s.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Удалить
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
