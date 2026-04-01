import React, { useEffect, useState, useCallback } from 'react';
import { customersAPI, formatApiErrorDetail } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, Users, Phone, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, PrimaryButton, SecondaryButton, SurfaceCard } from '@/components/app/SaasUI';
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
      <div className="h-8 bg-slate-200 rounded w-56"></div>
      <div className="h-96 bg-slate-100 rounded-2xl"></div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="customers-page">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} total customers`}
        action={(
          <PrimaryButton onClick={openCreate} data-testid="add-customer-button">
            <Plus className="w-4 h-4" /> Add Customer
          </PrimaryButton>
        )}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 rounded-xl border-slate-200 pl-9"
          data-testid="customer-search-input"
        />
      </div>

      {/* Table */}
      <SurfaceCard className="overflow-hidden" data-testid="customers-table-container">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No customers found"
              description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
            />
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
                <TableRow key={customer.id} className="h-16 hover:bg-slate-50/60" data-testid={`customer-row-${customer.id}`}>
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
                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                        data-testid={`edit-customer-${customer.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setDeleting(customer); setDeleteDialogOpen(true); }}
                        className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600"
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
      </SurfaceCard>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
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
                className="h-11 rounded-xl border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                placeholder="+91 98765 43210"
                data-testid="customer-phone-input"
                className="h-11 rounded-xl border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
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
                className="rounded-xl border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({...form, tags: e.target.value})}
                placeholder="VIP, Instagram, WhatsApp"
                data-testid="customer-tags-input"
                className="h-11 rounded-xl border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
              <p className="text-xs text-slate-400">Separate tags with commas</p>
            </div>
            {error && <p className="text-sm text-red-600" data-testid="customer-form-error">{error}</p>}
            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={submitting} data-testid="customer-form-submit">
                {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This will also delete all their orders and reminders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <SecondaryButton onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </SecondaryButton>
            <button
              onClick={handleDelete}
              data-testid="confirm-delete-customer"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
