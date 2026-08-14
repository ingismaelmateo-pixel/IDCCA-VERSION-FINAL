"use client";

import { useState, ChangeEvent } from "react";
import { UploadCloud, X, Camera, Check } from "lucide-react";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface UploadPhotoModalProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedMemberId: number, newPhotoUrl: string) => void;
}

export default function UploadPhotoModal({
  member,
  isOpen,
  onClose,
  onSuccess,
}: UploadPhotoModalProps) {
  const [preview, setPreview] = useState<string | null>(member.photoUrl || null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  // Manejar la selección del archivo local
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen y no supere los 4MB
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido.");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        alert("La imagen debe pesar menos de 4MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar la foto en Neon DB
  const handleSave = async () => {
    if (!fileBase64) return;

    setUploading(true);
    try {
      const res = await fetch("/api/members/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          photoUrl: fileBase64,
        }),
      });

      if (res.ok) {
        onSuccess(member.id, fileBase64);
        onClose();
      } else {
        alert("Hubo un error al guardar la foto.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative space-y-5">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Actualizar Foto</h3>
          <p className="text-xs text-slate-500">
            {member.firstName} {member.lastName}
          </p>
        </div>

        {/* Zona de Arrastre / Previsualización */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative group w-32 h-32 rounded-full border-4 border-slate-100 shadow-inner overflow-hidden bg-slate-50 flex items-center justify-center mb-4">
            {preview ? (
              <img
                src={preview}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-10 h-10 text-slate-300" />
            )}
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all">
            <UploadCloud className="w-4 h-4 text-indigo-600" />
            <span>Examinar archivo local</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-2">Formatos PNG, JPG hasta 4MB</p>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!fileBase64 || uploading}
            className="flex-1 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {uploading ? (
              "Guardando..."
            ) : (
              <>
                <Check className="w-4 h-4" /> Guardar Foto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}