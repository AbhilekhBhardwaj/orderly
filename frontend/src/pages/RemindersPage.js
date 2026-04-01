import React, { useEffect, useState, useCallback } from 'react';
import { remindersAPI, customersAPI, formatApiErrorDetail } from '@/lib/api';
import { Plus, Trash2, Bell, Clock, CalendarDays, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { EmptyState, PageHeader, PrimaryButton, SecondaryButton, SurfaceCard } from '@/components/app/SaasUI';

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ customer_id: '', date: null, time: '10:00', note: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [remindersRes, customersRes] = await Promise.all([
        remindersAPI.list(filter === 'today'),
        customersAPI.list(),
      ]);
      setReminders(remindersRes.data);
      setCustomers(customersRes.data);
    } catch {} finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ customer_id: '', date: null, time: '10:00', note: '' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (reminder) => {
    setEditing(reminder);
    const dt = new Date(reminder.date_time);
    setForm({
      customer_id: reminder.customer_id,
      date: dt,
      time: format(dt, 'HH:mm'),
      note: reminder.note,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.date) {
      setError('Please select a date');
      return;
    }
    setSubmitting(true);
    const dateStr = format(form.date, 'yyyy-MM-dd');
    const dateTime = `${dateStr}T${form.time}:00`;
    try {
      if (editing) {
        await remindersAPI.update(editing.id, { date_time: dateTime, note: form.note });
      } else {
        await remindersAPI.create({ customer_id: form.customer_id, date_time: dateTime, note: form.note });
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
      await remindersAPI.delete(deleting.id);
      setDeleteDialogOpen(false);
      setDeleting(null);
      fetchData();
    } catch {}
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const d = new Date(dateStr);
    return d.toDateString() === today.toDateString();
  };

  const isPast = (dateStr) => {
    return new Date(dateStr) < new Date();
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse" data-testid="reminders-loading">
      <div className="h-8 bg-slate-200 rounded w-48"></div>
      <div className="h-96 bg-slate-100 rounded-2xl"></div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="reminders-page">
      <PageHeader
        title="Reminders"
        subtitle={`${reminders.length} ${filter === 'today' ? 'due today' : 'total reminders'}`}
        action={(
          <PrimaryButton onClick={openCreate} data-testid="add-reminder-button">
            <Plus className="w-4 h-4" /> Add Reminder
          </PrimaryButton>
        )}
      />

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          data-testid="filter-all-reminders"
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-[#0A2540] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('today')}
          data-testid="filter-today-reminders"
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'today' ? 'bg-[#0A2540] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Due Today
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3" data-testid="reminders-list">
        {reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No reminders found"
            description={filter === 'today' ? 'No reminders due today.' : 'Create your first reminder.'}
          />
        ) : (
          reminders.map((reminder) => (
            <SurfaceCard
              key={reminder.id}
              className={`p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${
                isToday(reminder.date_time) ? 'ring-2 ring-blue-200 ring-offset-1' : ''
              } ${isPast(reminder.date_time) && !isToday(reminder.date_time) ? 'opacity-60' : ''}`}
              data-testid={`reminder-card-${reminder.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isToday(reminder.date_time) ? 'bg-blue-50 text-[#2563EB]' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{reminder.note}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(reminder.date_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <span className="text-xs text-slate-500">
                        {reminder.customer_name}
                      </span>
                      {isToday(reminder.date_time) && (
                        <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Due Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(reminder)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                    data-testid={`edit-reminder-${reminder.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleting(reminder); setDeleteDialogOpen(true); }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-500 hover:text-red-600"
                    data-testid={`delete-reminder-${reminder.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </SurfaceCard>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              {editing ? 'Edit Reminder' : 'Create Reminder'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update reminder details' : 'Set a follow-up reminder for a customer'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="reminder-form">
            {!editing && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Customer *</Label>
                <Select value={form.customer_id} onValueChange={(val) => setForm({...form, customer_id: val})}>
                  <SelectTrigger data-testid="reminder-customer-select" className="h-11 rounded-xl border-slate-200">
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
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Date *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="reminder-date-picker"
                    className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 px-3 text-left text-sm transition-colors hover:bg-slate-50"
                  >
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {form.date ? format(form.date, 'PPP') : <span className="text-slate-400">Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(date) => { setForm({...form, date}); setCalendarOpen(false); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Time *</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({...form, time: e.target.value})}
                required
                data-testid="reminder-time-input"
                className="h-11 rounded-xl border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">Note *</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({...form, note: e.target.value})}
                placeholder="What do you need to follow up on?"
                rows={3}
                required
                data-testid="reminder-note-input"
                className="rounded-xl border-slate-200 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] resize-none"
              />
            </div>
            {error && <p className="text-sm text-red-600" data-testid="reminder-form-error">{error}</p>}
            <DialogFooter>
              <SecondaryButton type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                disabled={submitting || (!editing && !form.customer_id)}
                data-testid="reminder-form-submit"
              >
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
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Delete Reminder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reminder?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <SecondaryButton onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </SecondaryButton>
            <button
              onClick={handleDelete}
              data-testid="confirm-delete-reminder"
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
