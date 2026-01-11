'use client';

import { useState } from 'react';
import { CheckSquare, Plus, Search } from 'lucide-react';

export default function ChecklistsModule({ user }) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-blue-600" />
              Checklists de Calidad
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de listas de verificación y auditorías
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Checklist
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar checklists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Módulo en Desarrollo</h3>
          <p className="text-sm">
            El módulo de Checklists de Calidad está en construcción.
            <br />
            Aquí podrás gestionar listas de verificación, auditorías y controles de calidad.
          </p>
        </div>
      </div>
    </div>
  );
}
