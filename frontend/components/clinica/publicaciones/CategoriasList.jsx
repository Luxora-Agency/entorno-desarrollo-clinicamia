
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

export default function CategoriasList({ user }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones/categorias/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategorias(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categorías de Publicaciones</CardTitle>
        <Button onClick={() => toast.info("Próximamente", { description: "Creación de categorías" })}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No hay categorías registradas
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nombre}</TableCell>
                    <TableCell className="text-gray-500">{cat.slug}</TableCell>
                    <TableCell>{cat.descripcion}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
