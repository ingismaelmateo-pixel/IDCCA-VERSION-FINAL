"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, UserPlus, Mail, Phone, MapPin, Calendar } from "lucide-react";

export default function AgregarMiembroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    maritalStatus: "",
    address: "",
    phone: "",
    cellPhone: "",
    email: "",
    documentId: "",
    joinDate: new Date().toISOString().split("T")[0],
    baptismDate: "",
    conversionDate: "",
    profession: "",
    status: "active",
    observations: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/miembros");
        }, 1500);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
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
              <UserPlus size={24} className="text-blue-600" />
              Agregar Miembro
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Registra un nuevo miembro en la iglesia
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/miembros")}
          className="btn-outline flex items-center gap-2"
        >
          <X size={16} />
          Cancelar
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="card-premium p-6">
        {success && (
          <div className="alert alert-success mb-4">
            <Save size={16} />
            <span className="text-sm font-medium">¡Miembro agregado exitosamente!</span>
          </div>
        )}

        {/* Información Personal */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <UserPlus size={14} />
            Información Personal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="firstName"
                required
                className="input-field"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                name="lastName"
                required
                className="input-field"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Apellido"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Sexo
              </label>
              <select
                name="gender"
                className="input-field"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                className="input-field"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Estado Civil
              </label>
              <select
                name="maritalStatus"
                className="input-field"
                value={formData.maritalStatus}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="single">Soltero/a</option>
                <option value="married">Casado/a</option>
                <option value="divorced">Divorciado/a</option>
                <option value="widowed">Viudo/a</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Documento de Identidad
              </label>
              <input
                type="text"
                name="documentId"
                className="input-field"
                value={formData.documentId}
                onChange={handleChange}
                placeholder="Cédula / Pasaporte"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Phone size={14} />
            Contacto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                className="input-field"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Teléfono fijo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Celular
              </label>
              <input
                type="text"
                name="cellPhone"
                className="input-field"
                value={formData.cellPhone}
                onChange={handleChange}
                placeholder="Celular / WhatsApp"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                className="input-field"
                value={formData.address}
                onChange={handleChange}
                placeholder="Calle, sector, ciudad..."
              />
            </div>
          </div>
        </div>

        {/* Información Eclesiástica */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar size={14} />
            Información Eclesiástica
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                name="joinDate"
                className="input-field"
                value={formData.joinDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Fecha de Conversión
              </label>
              <input
                type="date"
                name="conversionDate"
                className="input-field"
                value={formData.conversionDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Fecha de Bautismo
              </label>
              <input
                type="date"
                name="baptismDate"
                className="input-field"
                value={formData.baptismDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Profesión
              </label>
              <input
                type="text"
                name="profession"
                className="input-field"
                value={formData.profession}
                onChange={handleChange}
                placeholder="Profesión u oficio"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Estado
              </label>
              <select
                name="status"
                className="input-field"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="visitor">Visitante</option>
              </select>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Observaciones
          </label>
          <textarea
            name="observations"
            className="input-field resize-none"
            rows={3}
            value={formData.observations}
            onChange={handleChange}
            placeholder="Notas adicionales sobre el miembro..."
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push("/miembros")}
            className="btn-outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {loading ? "Guardando..." : "Guardar Miembro"}
          </button>
        </div>
      </form>
    </div>
  );
}