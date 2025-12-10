'use client';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CitaFilters({ selectedFecha, onFechaChange, totalCitas }) {
  return (
    <Card className="mb-6 shadow-sm border-gray-200">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <Input
              type="date"
              value={selectedFecha}
              onChange={(e) => onFechaChange(e.target.value)}
              className="max-w-full sm:max-w-xs h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {totalCitas} cita{totalCitas !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
