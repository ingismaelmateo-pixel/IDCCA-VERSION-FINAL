"use client";

import { useState } from "react";
import { UserPlus, Search, X, Check } from "lucide-react";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

interface Props {
  courseId: number;
  courseName: string;
  availableMembers: Member[]; // Lista de miembros no inscritos aún
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnrollStudentsModal({
  courseId,
  courseName,
  availableMembers,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const filteredMembers = availableMembers.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleEnroll = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bible-school/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, memberIds: selectedIds }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Inscribir Estudiantes</h3>
            <p className="text-xs text-gray-500">{courseName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar miembro por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Lista de Miembros */}
        <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1">
          {filteredMembers.map((member) => {
            const isSelected = selectedIds.includes(member.id);
            return (
              <div
                key={member.id} // 🔥 React necesita esta key en el div
                onClick={() => toggleSelect(member.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                    isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check size={12} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">
            Cancelar
          </button>
          <button
            onClick={handleEnroll}
            disabled={loading || selectedIds.length === 0}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus size={14} />
            {loading ? "Inscribiendo..." : `Inscribir (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}