
import React from 'react';
import PublicacionList from './PublicacionList';

export default function PublicacionesModule({ user }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Publicaciones</h1>
          <p className="text-gray-500">Administra noticias, artículos y contenido educativo.</p>
        </div>
      </div>

      <PublicacionList user={user} />
    </div>
  );
}
