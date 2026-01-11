
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

export default function PublicacionList({ user }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPublicaciones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/publicaciones?search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPublicaciones(data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "No se pudieron cargar las publicaciones" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicaciones();
  }, [searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Listado de Publicaciones</CardTitle>
        <Button onClick={() => toast.info("Próximamente", { description: "Formulario de creación en desarrollo" })}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Publicación
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Buscar por título..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {publicaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No hay publicaciones encontradas
                  </TableCell>
                </TableRow>
              ) : (
                publicaciones.map((pub) => (
                  <TableRow key={pub.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{pub.titulo}</span>
                        <span className="text-xs text-gray-500">{pub.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pub.estado === 'Publicado' ? 'default' : 'secondary'}>
                        {pub.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{pub.autor?.nombre} {pub.autor?.apellido}</TableCell>
                    <TableCell>{pub.fechaPublicacion ? new Date(pub.fechaPublicacion).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
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
