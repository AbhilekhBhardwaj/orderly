import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import { Users, ShoppingBag, Bell, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { EmptyState, PageHeader, SectionCard, StatusBadge, SurfaceCard } from '@/components/app/SaasUI';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" data-testid="dashboard-loading">
        <div className="h-8 w-56 rounded bg-slate-200"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: 'Total Customers', value: data.total_customers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: data.total_orders, icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Revenue', value: `$${data.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'New Orders', value: data.new_orders, icon: TrendingUp, color: 'bg-slate-50 text-slate-600' },
    { label: 'Paid Orders', value: data.paid_orders, icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Reminders Today', value: data.reminders_today, icon: Bell, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <PageHeader title="Dashboard" subtitle="Overview of your business performance and daily operations." />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <SurfaceCard
            key={label}
            className="group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          </SurfaceCard>
        ))}
      </div>

      {/* Bottom Grid: Recent Orders + Today's Reminders */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent Orders */}
        <SectionCard title="Recent Orders" subtitle="Latest customer activity" className="xl:col-span-2" data-testid="recent-orders-card">
            {data.recent_orders.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No orders yet" description="Orders will appear here once you start selling." />
            ) : (
              <div className="space-y-2">
                {data.recent_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{order.product_name}</p>
                      <p className="text-xs text-slate-500">{order.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm font-semibold text-slate-900">${order.amount}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </SectionCard>

        {/* Today's Reminders */}
        <SectionCard title="Due Today" subtitle="Follow-ups that need attention" data-testid="today-reminders-card">
            {data.today_reminders.length === 0 ? (
              <EmptyState icon={Bell} title="No reminders today" description="You're all caught up for now." />
            ) : (
              <div className="space-y-2">
                {data.today_reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
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
        </SectionCard>
      </div>
    </div>
  );
}
