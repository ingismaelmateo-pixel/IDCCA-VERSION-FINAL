"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Calendar, Save, X } from "lucide-react";

interface EnrolledStudent {
  enrollmentId: number;
  studentId: number;
  firstName: string;
  lastName: string;
}

interface Props {
  courseId: number;
  courseName: string;
  students: EnrolledStudent[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TakeAttendanceModal({
  courseId,
  courseName,
  students,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [classDate, setClassDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceList, setAttendanceList] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    students.forEach((s) => (initial[s.enrollmentId] = true)); // Por defecto presentes
    return initial;
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleAttendance = (enrollmentId: number) => {
    setAttendanceList((prev) => ({
      ...prev,
      [enrollmentId]: !prev[enrollmentId],
    }));
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    // ✅ studentId (coincide con el campo que espera /api/bible-school/attendance)
    const records = students.map((s) => ({
      enrollmentId: s.enrollmentId,
      studentId: s.studentId,
      present: !!attendanceList[s.enrollmentId],
    }));

    try {
      const res = await fetch("/api/bible-school/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, classDate, records }),
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
            <h3 className="font-bold text-lg text-gray-900">Pasar Lista de Asistencia</h3>
            <p className="text-xs text-gray-500">{courseName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Selector de Fecha */}
        <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Fecha de Clase:</span>
          <input
            type="date"
            value={classDate}
            onChange={(e) => setClassDate(e.target.value)}
            className="bg-white text-xs border rounded-lg px-2 py-1 text-gray-800 focus:outline-none"
          />
        </div>

        {/* Lista de Estudiantes Inscritos */}
        <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1">
          {students.map((student) => {
            const isPresent = attendanceList[student.enrollmentId];
            return (
              <div
                key={student.enrollmentId}
                onClick={() => toggleAttendance(student.enrollmentId)}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all"
              >
                <span className="text-sm font-medium text-gray-800">
                  {student.firstName} {student.lastName}
                </span>

                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    isPresent
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isPresent ? (
                    <>
                      <CheckCircle size={14} /> Presente
                    </>
                  ) : (
                    <>
                      <XCircle size={14} /> Ausente
                    </>
                  )}
                </button>
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
            onClick={handleSaveAttendance}
            disabled={loading || students.length === 0}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={14} />
            {loading ? "Guardando..." : "Guardar Asistencia"}
          </button>
        </div>
      </div>
    </div>
  );
}