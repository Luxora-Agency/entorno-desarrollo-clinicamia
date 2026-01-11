import React, { useState, useEffect } from 'react';
import { apiGet } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', resource: '', userId: '' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Clean filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const query = new URLSearchParams(cleanFilters).toString();
      const response = await apiGet(`/audit?${query}`);
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error('Error fetching audit logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>Track all system changes and user activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input 
              placeholder="Filter by Action" 
              value={filters.action}
              onChange={e => setFilters({...filters, action: e.target.value})}
              className="max-w-xs"
            />
            <Input 
              placeholder="Filter by Resource" 
              value={filters.resource}
              onChange={e => setFilters({...filters, resource: e.target.value})}
              className="max-w-xs"
            />
            <Button onClick={fetchLogs}>
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No logs found</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                      <TableCell>{log.user ? `${log.user.nombre} ${log.user.apellido}` : 'System'}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource} ({log.resourceId})</TableCell>
                      <TableCell className="max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                        {JSON.stringify(log.details)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
