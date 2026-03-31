import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import { Users, ShoppingBag, Bell, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusStyles = {
  New: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
  Paid: 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]',
  Shipped: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse" data-testid="dashboard-loading">
      <div className="h-8 bg-slate-200 rounded w-48"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
      </div>
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: 'Total Customers', value: data.total_customers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: data.total_orders, icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Revenue', value: `$${data.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
    { label: 'New Orders', value: data.new_orders, icon: TrendingUp, color: 'bg-slate-50 text-slate-600' },
    { label: 'Paid Orders', value: data.paid_orders, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Reminders Today', value: data.reminders_today, icon: Bell, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">{label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tighter text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Bottom Grid: Recent Orders + Today's Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl" data-testid="recent-orders-card">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Orders</h3>
          </div>
          <div className="p-6">
            {data.recent_orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recent_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{order.product_name}</p>
                      <p className="text-xs text-slate-500">{order.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm font-semibold text-slate-900">${order.amount}</span>
                      <Badge className={`${statusStyles[order.status]} border text-xs px-2.5 py-0.5 rounded-full`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Reminders */}
        <div className="bg-white border border-slate-200 rounded-xl" data-testid="today-reminders-card">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Due Today
            </h3>
          </div>
          <div className="p-6">
            {data.today_reminders.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No reminders for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.today_reminders.map((reminder) => (
                  <div key={reminder.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{reminder.note}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{reminder.customer_name}</p>
                        <p className="text-xs text-[#2563EB] mt-1">
                          {new Date(reminder.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
