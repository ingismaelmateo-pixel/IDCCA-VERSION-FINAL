"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, X, Search, Trash2, RefreshCw, Library as LibraryIcon, User, Calendar, CheckCircle, AlertCircle } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  quantity: number;
  available_count: number;
  coverUrl: string | null;
}

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [kpis, setKpis] = useState({ total: 0, available: 0, activeLoans: 0 });
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [search, setSearch] = useState("");
  
  // Formulario para nuevo libro
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    description: "",
    quantity: "1",
    publishedYear: "",
    coverUrl: ""
  });

  // Formulario para préstamo
  const [loanForm, setLoanForm] = useState({
    bookId: "",
    memberId: "",
    dueDate: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", ...(search && { search }) });
      const res = await fetch(`/api/library?${params}`);
      const data = await res.json();
      setBooks(data.books || []);
      setKpis(data.kpis || { total: 0, available: 0, activeLoans: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'addBook', ...form }),
      });
      if (res.ok) {
        setShowBookModal(false);
        setForm({ title: "", author: "", isbn: "", category: "", description: "", quantity: "1", publishedYear: "", coverUrl: "" });
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: 'loanBook', ...loanForm }),
      });
      if (res.ok) {
        setShowLoanModal(false);
        setLoanForm({ bookId: "", memberId: "", dueDate: "" });
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <LibraryIcon size={24} className="text-blue-600" />
            Biblioteca
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Gestión de libros, Biblias, préstamos y devoluciones.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLoanModal(true)} className="btn-outline text-sm flex items-center gap-2">
            <User size={15} /> Prestar Libro
          </button>
          <button onClick={() => setShowBookModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Agregar Libro
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Libros</p>
          <h4 className="text-3xl font-bold text-blue-600">{kpis.total}</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Disponibles</p>
          <h4 className="text-3xl font-bold text-green-600">{kpis.available}</h4>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Préstamos Activos</p>
          <h4 className="text-3xl font-bold text-purple-600">{kpis.activeLoans}</h4>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título o autor..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-300 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Libros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Cargando...</div>
        ) : books.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium">Aún no hay libros registrados</p>
            <p className="text-sm mt-1">Agrega el primer libro a la biblioteca.</p>
          </div>
        ) : (
          books.map((book) => (
            <div key={book.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{book.title}</h4>
                  <p className="text-xs text-gray-500 truncate">{book.author || "Autor desconocido"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${book.available_count > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {book.available_count > 0 ? `${book.available_count} disponibles` : 'Prestado'}
                    </span>
                    {book.category && <span className="text-xs text-gray-400">{book.category}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Agregar Libro */}
      {showBookModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowBookModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Agregar Nuevo Libro</h3>
                <button onClick={() => setShowBookModal(false)} className="text-gray-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div><label className="text-xs font-semibold text-gray-500">Título *</label><input className="input-field" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500">Autor</label><input className="input-field" value={form.author} onChange={e => setForm({...form, author: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500">Categoría</label><input className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                  <div><label className="text-xs font-semibold text-gray-500">Cantidad</label><input type="number" className="input-field" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500">Descripción</label><textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <button type="submit" className="btn-primary w-full">Guardar Libro</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Prestar Libro */}
      {showLoanModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowLoanModal(false)}>
          <div className="modal-content max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Registrar Préstamo</h3>
                <button onClick={() => setShowLoanModal(false)} className="text-gray-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleLoan} className="space-y-4">
                <div><label className="text-xs font-semibold text-gray-500">ID del Libro *</label><input type="number" className="input-field" required value={loanForm.bookId} onChange={e => setLoanForm({...loanForm, bookId: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500">ID del Miembro *</label><input type="number" className="input-field" required value={loanForm.memberId} onChange={e => setLoanForm({...loanForm, memberId: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500">Fecha de Devolución</label><input type="date" className="input-field" value={loanForm.dueDate} onChange={e => setLoanForm({...loanForm, dueDate: e.target.value})} /></div>
                <button type="submit" className="btn-primary w-full">Registrar Préstamo</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}