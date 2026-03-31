import React, { useEffect, useState, useCallback } from 'react';
import { ordersAPI, customersAPI, formatApiErrorDetail } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

const statusStyles = {
  New: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
  Paid: 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]',
  Shipped: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ customer_id: '', product_name: '', amount: '', status: 'New' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        ordersAPI.list(),
        customersAPI.list(),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ customer_id: '', product_name: '', amount: '', status: 'New' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (order) => {
    setEditing(order);
    setForm({
      customer_id: order.customer_id,
      product_name: order.product_name,
      amount: String(order.amount),
      status: order.status,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      customer_id: form.customer_id,
      product_name: form.product_name,
      amount: parseFloat(form.amount),
      status: form.status,
    };
    try {
      if (editing) {
        await ordersAPI.update(editing.id, { product_name: payload.product_name, amount: payload.amount, status: payload.status });
      } else {
        await ordersAPI.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail));
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await ordersAPI.delete(deleting.id);
      setDeleteDialogOpen(false);
      setDeleting(null);
      fetchData();
    } catch {}
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="space-y-6 animate-pulse" data-testid="orders-loading">
      <div className="h-8 bg-slate-200 rounded w-48"></div>
      <div className="h-96 bg-slate-100 rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="orders-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">{orders.length} total orders</p>
        </div>
        <button
          onClick={openCreate}
          data-testid="add-order-button"
          className="bg-[#0A2540] text-white hover:bg-[#103154] rounded-lg px-4 py-2.5 font-medium transition-colors focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-slate-200"
            data-testid="order-search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10 border-slate-200" data-testid="order-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="orders-table-container">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-900">No orders found</p>
            <p className="text-sm text-slate-500 mt-1">
              {search || statusFilter !== 'all' ? 'Try different filters' : 'Create your first order to get started'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase">Product</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase">Customer</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase">Amount</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase">Status</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase hidden sm:table-cell">Date</TableHead>
                <TableHead className="font-semibold text-slate-500 text-xs tracking-wider uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50" data-testid={`order-row-${order.id}`}>
                  <TableCell className="font-medium text-slate-900">{order.product_name}</TableCell>
                  <TableCell className="text-sm text-slate-600">{order.customer_name}</TableCell>
                  <TableCell className="text-sm font-semibold text-slate-900">${order.amount}</TableCell>
                  <TableCell>
                    <Badge className={`${statusStyles[order.status]} border text-xs px-2.5 py-0.5 rounded-full`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(order)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                        data-testid={`edit-order-${order.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setDeleting(order); setDeleteDialogOpen(true); }}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600"
                        data-testid={`delete-order-${order.id}`}
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
              {editing ? 'Edit Order' : 'Create Order'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update order details' : 'Add a new order for a customer'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="order-form">
            {!editing && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Customer *</Label>
                <Select value={form.customer_id} onValueChange={(val) => setForm({...form, customer_id: val})}>
                  <SelectTrigger data-testid="order-customer-select" className="border-slate-200">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Product Name *</Label>
              <Input
                value={form.product_name}
                onChange={(e) => setForm({...form, product_name: e.target.value})}
                placeholder="e.g. Silk Saree - Blue"
                required
                data-testid="order-product-input"
                className="border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({...form, amount: e.target.value})}
                placeholder="0.00"
                required
                data-testid="order-amount-input"
                className="border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm({...form, status: val})}>
                <SelectTrigger data-testid="order-status-select" className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600" data-testid="order-form-error">{error}</p>}
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
                disabled={submitting || (!editing && !form.customer_id)}
                data-testid="order-form-submit"
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
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the order for <strong>{deleting?.product_name}</strong>?
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
              data-testid="confirm-delete-order"
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
