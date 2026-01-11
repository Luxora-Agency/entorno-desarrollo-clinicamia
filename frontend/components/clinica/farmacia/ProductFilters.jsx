import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductFilters({ filters, onFilterChange, categorias }) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, SKU o descripción..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-9 border-gray-200"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <Select 
                value={filters.categoriaId} 
                onValueChange={(val) => onFilterChange({ ...filters, categoriaId: val })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
                value={filters.stockStatus} 
                onValueChange={(val) => onFilterChange({ ...filters, stockStatus: val })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado de Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los stocks</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="low">Bajo Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select 
                value={filters.estado} 
                onValueChange={(val) => onFilterChange({ ...filters, estado: val })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
