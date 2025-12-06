'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function BuscadorPacientesHCE({ onSelectPaciente }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchPacientes();
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const searchPacientes = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const response = await fetch(`${apiUrl}/pacientes/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result.data?.pacientes || []);
      }
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  const handleCreateNew = () => {
    window.location.href = '/?module=pacientes';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Buscar Paciente para Historia Clínica
        </h2>
        <p className="text-gray-600">
          Ingresa el nombre, cédula o correo del paciente para acceder a su HCE
        </p>
      </div>

      {/* Buscador */}
      <Card className="mb-6 shadow-lg border-2 border-blue-100">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, cédula o correo..."
              className="pl-10 h-12 text-base border-blue-200 focus:border-blue-400"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5 animate-spin" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {searched && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </p>
              {results.map((paciente) => (
                <Card
                  key={paciente.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-300 bg-white"
                  onClick={() => onSelectPaciente(paciente.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-sm">
                        <AvatarFallback className="text-white font-semibold">
                          {paciente.nombre?.[0]}{paciente.apellido?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {paciente.nombre} {paciente.apellido}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                          <span>
                            <span className="font-semibold">CC:</span> {paciente.cedula}
                          </span>
                          {paciente.email && (
                            <span>
                              <span className="font-semibold">Email:</span> {paciente.email}
                            </span>
                          )}
                          <span>
                            <span className="font-semibold">Edad:</span> {calcularEdad(paciente.fechaNacimiento)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {paciente.eps && (
                            <Badge variant="outline" className="text-xs border-blue-200">
                              {paciente.eps}
                            </Badge>
                          )}
                          {paciente.tipoSangre && (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              {paciente.tipoSangre}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPaciente(paciente.id);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                      >
                        Ver HCE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card className="border-2 border-dashed border-blue-200">
              <CardContent className="p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron pacientes
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No hay coincidencias con "{query}". ¿Deseas crear un nuevo paciente?
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Nuevo Paciente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Opción de crear siempre visible */}
      {!searched && (
        <Card className="border-2 border-blue-100 bg-blue-50">
          <CardContent className="p-6 text-center">
            <p className="text-gray-700 mb-4">
              ¿El paciente es nuevo en el sistema?
            </p>
            <Button
              onClick={handleCreateNew}
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-100"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Nuevo Paciente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
