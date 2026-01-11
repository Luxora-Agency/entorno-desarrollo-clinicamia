'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Copy, History, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function CatalogSearch({
  type = 'CUPS', // 'CUPS', 'CIE11', or 'CIE10'
  onSelect,
  defaultValue = '',
  placeholder = 'Buscar...'
}) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState([]);
  const searchRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem(`search_history_${type}`);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, [type]);

  useEffect(() => {
    setQuery(defaultValue || '');
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchTerm) => {
    setLoading(true);
    setShowResults(true);
    try {
      // Limpieza inteligente de búsqueda
      let queryToSend = searchTerm;
      
      // Si parece que el usuario pegó "CODIGO - DESCRIPCION" o "CODIGO DESCRIPCION"
      // Intentamos extraer el código si está al principio
      const possibleCodeMatch = searchTerm.match(/^([a-zA-Z0-9]{3,10})[\s\-\t]+.+/);
      if (possibleCodeMatch) {
        // Si la primera parte parece un código, usamos eso para buscar
        // Esto ayuda cuando copian y pegan filas enteras de tablas
        queryToSend = possibleCodeMatch[1];
      }

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const endpoint = type === 'CUPS' ? 'cups' : type === 'CIE10' ? 'cie10' : 'cie11';
      
      const response = await fetch(`${apiUrl}/catalogos/${endpoint}?query=${encodeURIComponent(queryToSend)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({ variant: 'destructive', description: 'Error al buscar en el catálogo' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setQuery(item.codigo); // Show code in input, or maybe `${item.codigo} - ${item.descripcion}`
    setShowResults(false);
    addToHistory(item);
  };

  const addToHistory = (item) => {
    const newHistory = [item, ...history.filter(h => h.codigo !== item.codigo)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem(`search_history_${type}`, JSON.stringify(newHistory));
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ description: 'Código copiado al portapapeles' });
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem(`search_history_${type}`);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length === 0) setShowResults(true); // Show history on focus empty
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-9 pr-4"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-emerald-600" />
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[300px] overflow-hidden">
          <ScrollArea className="h-full max-h-[300px]">
            <div className="p-2">
              {results.length === 0 && query.length < 3 && history.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-2 py-1 text-xs text-gray-500 font-semibold bg-gray-50 rounded">
                    <span className="flex items-center gap-1"><History className="h-3 w-3" /> Recientes</span>
                    <button onClick={clearHistory} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                  </div>
                  {history.map((item) => (
                    <div
                      key={item.codigo}
                      className="flex items-start gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
                      onClick={() => handleSelect(item)}
                    >
                      <Badge variant="outline" className="font-mono mt-0.5">{item.codigo}</Badge>
                      <p className="text-sm text-gray-700 line-clamp-2">{item.descripcion}</p>
                    </div>
                  ))}
                </div>
              )}

              {results.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col gap-1 p-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 font-mono">
                        {item.codigo}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {type === 'CUPS' ? item.seccion : item.capitulo}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => copyToClipboard(item.codigo, e)}
                    >
                      <Copy className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">
                    {item.descripcion}
                  </p>
                </div>
              ))}

              {results.length === 0 && query.length >= 3 && !loading && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No se encontraron resultados para "{query}"
                </div>
              )}
              
              {query.length < 3 && history.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Escribe al menos 3 caracteres para buscar en el catálogo oficial de {type}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
