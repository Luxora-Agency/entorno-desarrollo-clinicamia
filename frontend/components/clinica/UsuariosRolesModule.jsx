'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleManagement from './admin/RoleManagement';
import AuditLog from './admin/AuditLog';
import UserManagement from './admin/UserManagement';

export default function UsuariosRolesModule() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Usuarios y Roles</h1>
        <p className="text-gray-600 mt-1">Gestión avanzada de usuarios, roles, permisos y auditoría</p>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles y Permisos</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-6">
           <UserManagement />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RoleManagement />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
