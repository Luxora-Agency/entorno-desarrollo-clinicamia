
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicacionList from './PublicacionList';
import CategoriasList from './CategoriasList';

export default function PublicacionesModule({ user, activeTab = 'publicaciones' }) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Publicaciones</h1>
          <p className="text-gray-500">Administra noticias, artículos y contenido educativo.</p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList>
          <TabsTrigger value="publicaciones">Publicaciones</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>
        
        <TabsContent value="publicaciones" className="space-y-4">
          <PublicacionList user={user} />
        </TabsContent>
        
        <TabsContent value="categorias" className="space-y-4">
          <CategoriasList user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
