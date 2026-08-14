"use client";

import { useState, useEffect } from "react";
import { Users, Search, UserPlus, Heart, GitFork, RefreshCw, User, X, Trash2 } from "lucide-react";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  maritalStatus?: string;
  cellPhone?: string;
}

interface FamilyRelation {
  id: number;
  relationType: string;
  relative: Member | null;
}

export default function FamilyTree() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedHead, setSelectedHead] = useState<Member | null>(null);

  // Estados de vinculación
  const [relations, setRelations] = useState<FamilyRelation[]>([]);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRelativeId, setSelectedRelativeId] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("spouse");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedHead) {
      fetchRelations(selectedHead.id);
    } else {
      setRelations([]);
    }
  }, [selectedHead]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members?limit=100");
      const result = await res.json();
      if (result.data) {
        setMembers(result.data);
      }
    } catch (err) {
      console.error("Error al cargar miembros:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelations = async (memberId: number) => {
    setLoadingRelations(true);
    try {
      const res = await fetch(`/api/family-relationships?memberId=${memberId}`);
      if (res.ok) {
        const data = await res.json();
        setRelations(data);
      }
    } catch (err) {
      console.error("Error al cargar relaciones familiares:", err);
    } finally {
      setLoadingRelations(false);
    }
  };

  const handleLinkRelative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHead || !selectedRelativeId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/family-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedHead.id,
          relatedMemberId: parseInt(selectedRelativeId, 10),
          relationshipType,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedRelativeId("");
        fetchRelations(selectedHead.id);
      }
    } catch (err) {
      console.error("Error al guardar vínculo familiar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (relationId: number) => {
    if (!confirm("¿Deseas desvincular a este familiar?")) return;
    try {
      const res = await fetch(`/api/family-relationships?id=${relationId}`, {
        method: "DELETE",
      });
      if (res.ok && selectedHead) {
        fetchRelations(selectedHead.id);
      }
    } catch (err) {
      console.error("Error al eliminar relación:", err);
    }
  };

  const filteredMembers = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  // Filtrar miembros disponibles para vincular (excluyendo a la cabeza y a los ya vinculados)
  const linkedIds = new Set(relations.map((r) => r.relative?.id).filter(Boolean));
  const availableMembers = members.filter(
    (m) => m.id !== selectedHead?.id && !linkedIds.has(m.id)
  );

  const getRelationLabel = (type: string) => {
    switch (type) {
      case "spouse":
        return "Cónyuge / Esposo(a)";
      case "child":
        return "Hijo / Hija";
      case "parent":
        return "Padre / Madre";
      case "sibling":
        return "Hermano / Hermana";
      default:
        return "Familiar";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitFork className="w-7 h-7 text-indigo-600" />
            Árbol Genealógico y Núcleos Familiares
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza y conecta los vínculos familiares entre los miembros de la congregación.
          </p>
        </div>
        <button
          onClick={fetchMembers}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-medium text-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Lista de Selección */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Seleccionar Cabeza de Familia
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar miembro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-sm text-gray-400">Cargando lista...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">No se encontraron miembros</div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedHead(m)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-3 ${
                    selectedHead?.id === m.id
                      ? "bg-indigo-50 border-indigo-300 font-medium text-indigo-900"
                      : "bg-gray-50/50 border-gray-100 hover:bg-gray-100/60 text-gray-700"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate font-semibold">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-400">{m.maritalStatus || "Sin estado civil"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Visualizador del Árbol */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
          {selectedHead ? (
            <div className="w-full space-y-8 text-center">
              {/* Nodo Principal (Cabeza de Familia) */}
              <div className="inline-block bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-2xl shadow-lg transform transition-all hover:scale-105">
                <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {selectedHead.photoUrl ? (
                    <img src={selectedHead.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-bold">{selectedHead.firstName} {selectedHead.lastName}</h3>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                  Cabeza de Familia / Miembro
                </span>
              </div>

              {/* Conector */}
              <div className="w-0.5 h-8 bg-indigo-300 mx-auto"></div>

              {/* Sección de Parientes Registrados */}
              <div className="bg-gray-50 border border-dashed border-gray-300 p-6 rounded-2xl text-center space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <h4 className="font-semibold text-gray-800">Vínculos Familiares Registrados</h4>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-sm transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Vincular Pariente
                  </button>
                </div>

                {loadingRelations ? (
                  <p className="text-sm text-gray-400 py-6">Cargando relaciones familiares...</p>
                ) : relations.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6">
                    Aún no hay parientes vinculados a este miembro. Haz clic en <strong>"Vincular Pariente"</strong> para conectar cónyuge, hijos o padres.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {relations.map((rel) => (
                      rel.relative && (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                              {rel.relative.photoUrl ? (
                                <img src={rel.relative.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {rel.relative.firstName} {rel.relative.lastName}
                              </p>
                              <span className="inline-block text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {getRelationLabel(rel.relationType)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnlink(rel.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Desvincular"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <GitFork className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-base font-medium text-gray-600">Selecciona un miembro de la lista</p>
              <p className="text-xs text-gray-400 max-w-sm">
                Haz clic en cualquier persona para examinar o construir su núcleo familiar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Vincular Pariente */}
      {isModalOpen && selectedHead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Vincular Pariente
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkRelative} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Cabeza de Familia
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedHead.firstName} ${selectedHead.lastName}`}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Seleccionar Familiar
                </label>
                <select
                  required
                  value={selectedRelativeId}
                  onChange={(e) => setSelectedRelativeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Elige un miembro --</option>
                  {availableMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Parentesco
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="spouse">Cónyuge / Esposo(a)</option>
                  <option value="child">Hijo / Hija</option>
                  <option value="parent">Padre / Madre</option>
                  <option value="sibling">Hermano / Hermana</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedRelativeId}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando..." : "Guardar Vínculo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}