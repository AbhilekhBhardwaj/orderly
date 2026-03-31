import React, { useEffect, useState, useCallback } from 'react';
import { customersAPI, formatApiErrorDetail } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, Users, Phone, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', notes: '', tags: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await customersAPI.list();
      setCustomers(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', phone: '', notes: '', tags: '' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      notes: customer.notes || '',
      tags: (customer.tags || []).join(', '),
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      name: form.name,
      phone: form.phone,
      notes: form.notes,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        await customersAPI.update(editing.id, payload);
      } else {
        await customersAPI.create(payload);
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail));
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await customersAPI.delete(deleting.id);
      setDeleteDialogOpen(false);
      setDeleting(null);
      fetchCustomers();
    } catch {}
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="space-y-6 animate-pulse" data-testid="customers-loading">
      <div className="h-8 bg-slate-200 rounded w-48"></div>
      <div className="h-96 bg-slate-100 rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">{customers.length} total customers</p>
        </div>
        <button
          onClick={openCreate}
          data-testid="add-customer-button"
          className="bg-[#0A2540] text-white hover:bg-[#103154] rounded-lg px-4 py-2.5 font-medium transition-colors focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 border-slate-200"
          data-testid="customer-search-input"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="customers-table-container">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-900">No customers found</p>
            <p className="text-sm text-slate-500 mt-1">
              {search ? 'Try a different search term' : 'Add your first customer to get started'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase">Name</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase">Phone</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase hidden md:table-cell">Notes</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase hidden sm:table-cell">Tags</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/50" data-testid={`customer-row-${customer.id}`}>
                  <TableCell className="font-medium text-slate-900">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {customer.phone || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500 max-w-[200px] truncate">
                    {customer.notes || '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(customer.tags || []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-0">
                          <Tag className="w-3 h-3 mr-1" />{tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(customer)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                        data-testid={`edit-customer-${customer.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setDeleting(customer); setDeleteDialogOpen(true); }}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600"
                        data-testid={`delete-customer-${customer.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              {editing ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update customer information' : 'Add a new customer to your list'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="customer-form">
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="Customer name"
                required
                data-testid="customer-name-input"
                className="border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                placeholder="+91 98765 43210"
                data-testid="customer-phone-input"
                className="border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                placeholder="Any notes about this customer..."
                rows={3}
                data-testid="customer-notes-input"
                className="border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({...form, tags: e.target.value})}
                placeholder="VIP, Instagram, WhatsApp"
                data-testid="customer-tags-input"
                className="border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
              <p className="text-xs text-slate-400">Separate tags with commas</p>
            </div>
            {error && <p className="text-sm text-red-600" data-testid="customer-form-error">{error}</p>}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                data-testid="customer-form-submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#0A2540] rounded-lg hover:bg-[#103154] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This will also delete all their orders and reminders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              data-testid="confirm-delete-customer"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
