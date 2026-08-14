"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  Search, 
  UserPlus, 
  Heart, 
  Home, 
  Mail, 
  Phone,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  User,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Network,
  Link,
  Unlink,
  Sparkles,
  Crown,
  Baby,
  HeartHandshake,
  Users as UsersIcon,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  RefreshCw,
  Download
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  maritalStatus: string;
  email: string;
  cellPhone: string;
  photoUrl: string;
  address: string;
  profession: string;
}

interface MemberWithRelations extends Member {
  relationships: {
    spouse: Member[];
    parents: Member[];
    children: Member[];
    siblings: Member[];
  };
}

const relationshipLabels = {
  spouse: 'Cónyuge',
  parent: 'Padre/Madre',
  child: 'Hijo/Hija',
  sibling: 'Hermano/a'
};

const relationshipEmojis = {
  spouse: '💑',
  parent: '👨‍👩‍👦',
  child: '👶',
  sibling: '👫'
};

const relationshipColors = {
  spouse: 'from-pink-500 to-rose-500',
  parent: 'from-emerald-500 to-teal-500',
  child: 'from-blue-500 to-cyan-500',
  sibling: 'from-purple-500 to-indigo-500'
};

export default function ArbolFamiliarPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [selectedForRelationship, setSelectedForRelationship] = useState<Member | null>(null);
  const [relationshipType, setRelationshipType] = useState<'spouse' | 'parent' | 'child' | 'sibling'>('spouse');
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ memberId: number; type: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members?limit=100");
      const data = await res.json();
      setMembers(data.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberRelationships = async (memberId: number) => {
    try {
      const res = await fetch(`/api/family-relationships?memberId=${memberId}`);
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error:", error);
      return { spouse: [], parents: [], children: [], siblings: [] };
    }
  };

  const handleSelectMember = async (member: Member) => {
    setLoading(true);
    try {
      const relationships = await fetchMemberRelationships(member.id);
      const memberWithRelations: MemberWithRelations = {
        ...member,
        relationships: {
          spouse: relationships.spouse || [],
          parents: relationships.parents || [],
          children: relationships.children || [],
          siblings: relationships.siblings || []
        }
      };
      setSelectedMember(memberWithRelations);
      setIsEditing(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelationship = (member: Member) => {
    setSelectedForRelationship(member);
    const relatedIds = new Set([
      selectedMember?.id,
      ...(selectedMember?.relationships.spouse.map(m => m.id) || []),
      ...(selectedMember?.relationships.parents.map(m => m.id) || []),
      ...(selectedMember?.relationships.children.map(m => m.id) || []),
      ...(selectedMember?.relationships.siblings.map(m => m.id) || [])
    ]);
    setAvailableMembers(members.filter(m => !relatedIds.has(m.id) && m.id !== selectedMember?.id));
    setShowRelationshipModal(true);
  };

  const handleSaveRelationship = async () => {
    if (!selectedForRelationship || !selectedMember) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const res = await fetch("/api/family-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          relatedMemberId: selectedForRelationship.id,
          relationshipType
        })
      });

      if (res.ok) {
        showToast(`✅ Relación de ${relationshipLabels[relationshipType]} agregada exitosamente`);
        
        await handleSelectMember(selectedMember);
        await fetchMembers();
        
        setShowRelationshipModal(false);
        setSelectedForRelationship(null);
        setIsSaving(false);
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await res.json();
        showToast(`❌ ${error.error || 'Error al agregar relación'}`);
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      showToast('❌ Error de conexión al guardar la relación');
      setIsSaving(false);
    }
  };

  const handleConfirmRemove = (memberId: number, type: string, name: string) => {
    setDeleteTarget({ memberId, type, name });
  };

  const handleRemoveRelationship = async () => {
    if (!deleteTarget || !selectedMember) return;

    try {
      const res = await fetch("/api/family-relationships", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          relatedMemberId: deleteTarget.memberId,
          relationshipType: deleteTarget.type
        })
      });

      if (res.ok) {
        setDeleteTarget(null);
        showToast(`✅ Relación eliminada exitosamente`);
        await handleSelectMember(selectedMember);
        await fetchMembers();
      } else {
        showToast('❌ Error al eliminar la relación');
      }
    } catch (error) {
      console.error("Error:", error);
      showToast('❌ Error de conexión');
    }
  };

  // 📄 EXPORTAR PDF (CORREGIDO CON TOAST)
  const handleExportPDF = () => {
    if (!selectedMember) {
      showToast("⚠️ Selecciona un miembro para exportar su árbol.", "error");
      return;
    }

    const doc = new jsPDF();
    const title = `Árbol Genealógico - ${selectedMember.firstName} ${selectedMember.lastName}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Exportado el: ${new Date().toLocaleDateString()}`, 14, 28);

    const tableData: any[] = [];
    
    const addSection = (label: string, members: Member[]) => {
      if (members.length === 0) return;
      members.forEach(m => {
        tableData.push([label, `${m.firstName} ${m.lastName}`, m.cellPhone || "-", m.email || "-"]);
      });
    };

    addSection("Cónyuge", selectedMember.relationships.spouse);
    addSection("Padres", selectedMember.relationships.parents);
    addSection("Hijos", selectedMember.relationships.children);
    addSection("Hermanos", selectedMember.relationships.siblings);

    if (tableData.length === 0) {
      showToast("ℹ️ Este miembro no tiene relaciones familiares para exportar.", "error");
      return;
    }

    autoTable(doc, {
      startY: 35,
      head: [["Relación", "Nombre", "Teléfono", "Email"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
      didParseCell: (data) => {
        if (data.section === 'head') return;
        if (data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    });

    doc.save(`arbol_familiar_${selectedMember.firstName}_${selectedMember.lastName}.pdf`);
    showToast("✅ Árbol exportado exitosamente", "success");
  };

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const RelationshipCard = ({ 
    members: relMembers, 
    type, 
    icon: Icon,
    onAdd,
    onRemove
  }: { 
    members: Member[], 
    type: string, 
    icon: any,
    onAdd?: () => void,
    onRemove?: (id: number, name: string) => void
  }) => {
    const label = relationshipLabels[type as keyof typeof relationshipLabels] || type;
    const emoji = relationshipEmojis[type as keyof typeof relationshipEmojis] || '👤';
    const color = relationshipColors[type as keyof typeof relationshipColors] || 'from-gray-500 to-gray-600';

    return (
      <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${color}`} />
            {emoji} {label}
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {relMembers.length}
            </span>
          </h4>
          {onAdd && isEditing && (
            <button
              onClick={onAdd}
              className="p-1 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
              title={`Agregar ${label}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {relMembers.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400">Sin {label}</p>
            {isEditing && (
              <button
                onClick={onAdd}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-medium"
              >
                + Agregar {label}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {relMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.firstName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${color} flex items-center justify-center text-white font-bold text-sm`}>
                    {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {member.gender === "male" ? "👨 Masculino" : "👩 Femenino"}
                  </p>
                </div>
                {isEditing && (
                  <button
                    onClick={() => onRemove?.(member.id, `${member.firstName} ${member.lastName}`)}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title={`Eliminar ${label}`}
                  >
                    <Trash2 size={14} /> {/* 🔥 Icono de basura corregido */}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const FamilyTree = ({ member }: { member: MemberWithRelations }) => {
    return (
      <div className="relative">
        {/* Miembro central */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.firstName}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full shadow-md">
              <Crown size={14} />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mt-3">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-sm text-gray-500">
            {member.gender === "male" ? "👨 Masculino" : "👩 Femenino"}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {member.email && (
              <span className="flex items-center gap-1">
                <Mail size={12} />
                {member.email}
              </span>
            )}
            {member.cellPhone && (
              <span className="flex items-center gap-1">
                <Phone size={12} />
                {member.cellPhone}
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                isEditing 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isEditing ? (
                <>
                  <Check size={14} />
                  Finalizar Edición
                </>
              ) : (
                <>
                  <Edit2 size={14} />
                  Editar Relaciones
                </>
              )}
            </button>
            <button
              onClick={() => handleSelectMember(member)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
          {isEditing && (
            <div className="mt-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertCircle size={14} />
                Modo edición activado. Agrega o elimina relaciones familiares.
              </p>
            </div>
          )}
        </div>

        {/* Relaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <RelationshipCard
              members={member.relationships.spouse}
              type="spouse"
              icon={HeartHandshake}
              onAdd={() => handleAddRelationship(member)}
              onRemove={(id, name) => handleConfirmRemove(id, 'spouse', name)}
            />
            <RelationshipCard
              members={member.relationships.parents}
              type="parent"
              icon={UsersIcon}
              onAdd={() => handleAddRelationship(member)}
              onRemove={(id, name) => handleConfirmRemove(id, 'parent', name)}
            />
          </div>
          <div className="space-y-4">
            <RelationshipCard
              members={member.relationships.children}
              type="child"
              icon={Baby}
              onAdd={() => handleAddRelationship(member)}
              onRemove={(id, name) => handleConfirmRemove(id, 'child', name)}
            />
            <RelationshipCard
              members={member.relationships.siblings}
              type="sibling"
              icon={Users}
              onAdd={() => handleAddRelationship(member)}
              onRemove={(id, name) => handleConfirmRemove(id, 'sibling', name)}
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-4 gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-500">{member.relationships.spouse.length}</div>
            <div className="text-xs text-gray-500">Cónyuges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">{member.relationships.parents.length}</div>
            <div className="text-xs text-gray-500">Padres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{member.relationships.children.length}</div>
            <div className="text-xs text-gray-500">Hijos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{member.relationships.siblings.length}</div>
            <div className="text-xs text-gray-500">Hermanos</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] p-4 rounded-xl shadow-2xl border-l-4 transition-all duration-300 flex items-center gap-3 max-w-md ${
          toast.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {toast.type === 'success' ? <Check size={20} className="text-green-500 shrink-0" /> : <AlertCircle size={20} className="text-red-500 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Network size={24} className="text-blue-600" />
              Árbol Familiar Interactivo
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Gestiona las relaciones familiares de los miembros
            </p>
          </div>
        </div>
        {selectedMember && (
          <button onClick={handleExportPDF} className="btn-outline text-sm flex items-center gap-2">
            <Download size={15} /> Exportar Árbol
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="card-premium p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar miembro por nombre..."
            className="input-field pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de miembros */}
        <div className="card-premium p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users size={16} />
              Miembros
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {members.length}
              </span>
            </h3>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-14 w-full rounded-xl" />
              ))
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No se encontraron miembros</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    selectedMember?.id === member.id
                      ? "bg-blue-50 border-2 border-blue-200 shadow-sm"
                      : "hover:bg-gray-50 border-2 border-transparent"
                  }`}
                >
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.firstName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {member.gender === "male" ? "👨 Masculino" : "👩 Femenino"}
                    </p>
                  </div>
                  {selectedMember?.id === member.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Árbol familiar */}
        <div className="lg:col-span-3">
          {selectedMember ? (
            <div className="card-premium p-6">
              <FamilyTree member={selectedMember} />
            </div>
          ) : (
            <div className="card-premium p-12 text-center">
              <div className="text-7xl mb-4">🌳</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Selecciona un miembro</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Haz clic en un miembro de la lista para ver y gestionar su árbol familiar.
                Puedes agregar o eliminar relaciones familiares en modo edición.
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">💑 Cónyuge</span>
                <span className="flex items-center gap-1">👨‍👩‍👦 Padres</span>
                <span className="flex items-center gap-1">👶 Hijos</span>
                <span className="flex items-center gap-1">👫 Hermanos</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar relación */}
      {showRelationshipModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRelationshipModal(false)}>
          <div className="modal-content max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Link size={20} className="text-blue-500" />
                  Agregar Relación
                </h3>
                <button
                  onClick={() => setShowRelationshipModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Tipo de Relación
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(relationshipLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setRelationshipType(key as any)}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          relationshipType === key
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {relationshipEmojis[key as keyof typeof relationshipEmojis]} {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Seleccionar Miembro
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {availableMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedForRelationship(member)}
                        className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-all ${
                          selectedForRelationship?.id === member.id
                            ? 'bg-blue-50 border-2 border-blue-200'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-xs">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                        <span className="text-sm">
                          {member.firstName} {member.lastName}
                        </span>
                      </button>
                    ))}
                  </div>
                  {availableMembers.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                      No hay miembros disponibles para relacionar
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setShowRelationshipModal(false)}
                    className="btn-outline text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveRelationship}
                    disabled={!selectedForRelationship || isSaving}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Guardar Relación
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DE CONFIRMACIÓN PARA ELIMINAR RELACIÓN */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Unlink size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Eliminar Relación</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Estás seguro de eliminar la relación de <span className="font-bold">{relationshipLabels[deleteTarget.type as keyof typeof relationshipLabels]}</span> con <span className="font-bold">{deleteTarget.name}</span>?
              <br/><span className="text-xs text-red-400">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRemoveRelationship}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-md transition-colors duration-200"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}