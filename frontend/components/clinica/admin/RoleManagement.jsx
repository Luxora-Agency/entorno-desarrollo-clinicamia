import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit, ChevronRight, ChevronDown, Shield, Check } from "lucide-react";
import { toast } from "sonner";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [roleForm, setRoleForm] = useState({ name: '', description: '', parentId: null, permissions: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        apiGet('/roles'),
        apiGet('/permissions')
      ]);
      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);
    } catch (error) {
      toast.error('Error fetching data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setRoleForm({ name: '', description: '', parentId: null, permissions: [] });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditRole = (role) => {
    setRoleForm({
      name: role.name,
      description: role.description,
      parentId: role.parentId,
      permissions: role.permissions.map(p => p.permission.id)
    });
    setSelectedRole(role);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await apiDelete(`/roles/${roleId}`);
      toast.success('Role deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Error deleting role: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await apiPut(`/roles/${selectedRole.id}`, roleForm);
        toast.success('Role updated successfully');
      } else {
        await apiPost('/roles', roleForm);
        toast.success('Role created successfully');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error saving role: ' + error.message);
    }
  };

  const togglePermission = (permId) => {
    setRoleForm(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Render tree item
  const renderRoleItem = (role, level = 0) => {
    const hasChildren = roles.some(r => r.parentId === role.id);
    const children = roles.filter(r => r.parentId === role.id);

    return (
      <div key={role.id} className="mb-2">
        <div 
          className={`flex items-center justify-between p-3 rounded-lg border ${selectedRole?.id === role.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium">{role.name}</p>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </div>
            {role.isSystem && <Badge variant="secondary" className="ml-2">System</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
              <Edit className="h-4 w-4" />
            </Button>
            {!role.isSystem && (
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteRole(role.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {children.map(child => renderRoleItem(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Roles & Permissions</h2>
        <Button onClick={handleCreateRole}>
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Role Hierarchy</CardTitle>
            <CardDescription>Manage roles and their permissions hierarchy</CardDescription>
          </CardHeader>
          <CardContent>
            {roles.filter(r => !r.parentId).map(role => renderRoleItem(role))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>Configure role details and permissions.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input 
                  value={roleForm.name} 
                  onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                  placeholder="e.g. Senior Doctor"
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Role (Optional)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={roleForm.parentId || ''}
                  onChange={e => setRoleForm({...roleForm, parentId: e.target.value || null})}
                >
                  <option value="">None (Top Level)</option>
                  {roles.filter(r => r.id !== selectedRole?.id).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={roleForm.description} 
                onChange={e => setRoleForm({...roleForm, description: e.target.value})}
                placeholder="Role description"
              />
            </div>

            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="font-medium">Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <Card key={module} className="border shadow-sm">
                    <CardHeader className="p-3 bg-muted/50">
                      <CardTitle className="text-sm font-medium capitalize">{module.replace('_', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      {perms.map(perm => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={perm.id} 
                            checked={roleForm.permissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <label 
                            htmlFor={perm.id} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.description || perm.name}
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
