'use client';

import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function FolderTree({
  folders = [],
  selectedFolderId,
  onSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  showActions = true,
  level = 0,
}) {
  return (
    <div className="space-y-1">
      {level === 0 && (
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100',
            selectedFolderId === null && 'bg-blue-50 text-blue-700'
          )}
          onClick={() => onSelect(null)}
        >
          <Folder className="w-4 h-4" />
          <span className="text-sm font-medium">Raíz</span>
        </div>
      )}
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelect={onSelect}
          onCreateFolder={onCreateFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          showActions={showActions}
          level={level}
        />
      ))}
      {level === 0 && showActions && onCreateFolder && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-gray-700"
          onClick={() => onCreateFolder(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva carpeta
        </Button>
      )}
    </div>
  );
}

function FolderItem({
  folder,
  selectedFolderId,
  onSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  showActions,
  level,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 group',
          isSelected && 'bg-blue-50 text-blue-700'
        )}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <div
          className="flex items-center gap-2 flex-1"
          onClick={() => onSelect(folder.id)}
        >
          {isExpanded && hasChildren ? (
            <FolderOpen className="w-4 h-4 text-yellow-600" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-600" />
          )}
          <span className="text-sm truncate">{folder.nombre}</span>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onCreateFolder && (
                <DropdownMenuItem onClick={() => onCreateFolder(folder.id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva subcarpeta
                </DropdownMenuItem>
              )}
              {onEditFolder && (
                <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDeleteFolder && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDeleteFolder(folder.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {hasChildren && isExpanded && (
        <FolderTree
          folders={folder.children}
          selectedFolderId={selectedFolderId}
          onSelect={onSelect}
          onCreateFolder={onCreateFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          showActions={showActions}
          level={level + 1}
        />
      )}
    </div>
  );
}
