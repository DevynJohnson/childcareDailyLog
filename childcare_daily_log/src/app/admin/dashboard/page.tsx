"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Baby,
  UserCheck,
  Activity,
  AlertTriangle,
  Mail,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  Settings,
} from "lucide-react";

export default function AdminDashboard() {
  // Mock data - replace with actual API calls
  const [stats, setStats] = useState({
    totalChildren: 24,
    totalCaregivers: 8,
    totalParents: 22,
    pendingInvites: 3,
    todayActivities: 45,
    pendingRegistrations: 5,
    activeAlerts: 2,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      child: "Emma Rodriguez",
      action: "Nap time logged",
      caregiver: "Sarah Johnson",
      time: "2 minutes ago",
      type: "create",
    },
    {
      id: 2,
      child: "Oliver Chen",
      action: "Lunch activity updated",
      caregiver: "Mike Thompson",
      time: "15 minutes ago",
      type: "update",
    },
    {
      id: 3,
      child: "Ava Williams",
      action: "Outdoor play logged",
      caregiver: "Lisa Garcia",
      time: "32 minutes ago",
      type: "create",
    },
    {
      id: 4,
      child: "Noah Davis",
      action: "Diaper change deleted",
      caregiver: "Sarah Johnson",
      time: "1 hour ago",
      type: "delete",
    },
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      message: "Emma Rodriguez has a severe peanut allergy",
      type: "allergy",
      priority: "high",
    },
    {
      id: 2,
      message: "3 parent invitations pending for over 48 hours",
      type: "invite",
      priority: "medium",
    },
  ]);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend = undefined,
    onClick,
    className = "",
  }) => (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
    </div>
  );

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    href,
    color = "indigo",
  }) => {
    const colorClasses = {
      indigo:
        "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
      emerald:
        "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
      amber:
        "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
      purple:
        "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    };

    return (
      <a
        href={href}
        className={`block bg-gradient-to-r ${colorClasses[color]} p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-white group`}
      >
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </a>
    );
  };

  const ActivityItem = ({ activity }) => {
    const actionColors = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
    };

    return (
      <div className="flex items-center gap-4 py-3">
        <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900 truncate">
              {activity.child}
            </p>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                actionColors[activity.type]
              }`}
            >
              {activity.type}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {activity.action} by {activity.caregiver}
          </p>
          <p className="text-xs text-gray-400">{activity.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex-1 text-center items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your childcare center operations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Baby}
            title="Children"
            value={stats.totalChildren}
            subtitle="Active profiles"
            onClick={() => (window.location.href = "/admin/children")}
          />
          <StatCard
            icon={Users}
            title="Caregivers"
            value={stats.totalCaregivers}
            subtitle="Active staff"
            onClick={() => (window.location.href = "/admin/caregivers")}
          />
          <StatCard
            icon={UserCheck}
            title="Parents"
            value={stats.totalParents}
            subtitle="Registered users"
            onClick={() => (window.location.href = "/admin/users")}
          />
          <StatCard
            icon={Mail}
            title="Pending Invites"
            value={stats.pendingInvites}
            subtitle="Awaiting registration"
            className="border-amber-200 bg-amber-50"
            onClick={() => (window.location.href = "/admin/users")}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard
                icon={Plus}
                title="Add New Child"
                description="Create a child profile and invite parents to register"
                href="/admin/children/new"
                color="indigo"
              />
              <QuickActionCard
                icon={UserCheck}
                title="Add Caregiver"
                description="Create caregiver account and send invitation"
                href="/admin/caregivers/new"
                color="emerald"
              />
              <QuickActionCard
                icon={Eye}
                title="View All Users"
                description="Manage parent and caregiver accounts and invitations"
                href="/admin/users"
                color="purple"
              />
              <QuickActionCard
                icon={Activity}
                title="Activity Audit"
                description="Review all logged activities and changes"
                href="/admin/audit"
                color="amber"
              />
            </div>

            {/* Additional Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Today's Activity
                </h3>
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {stats.todayActivities}
                </div>
                <p className="text-gray-600 text-sm">Activities logged today</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  System Status
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    All Systems Operational
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  Last updated: 5 minutes ago
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                <a
                  href="/admin/audit"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              <div className="space-y-1">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a
                  href="/caregiver/dashboard"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                  <span className="text-gray-700 group-hover:text-gray-900">
                    Caregiver View
                  </span>
                </a>
                <a
                  href="/parent/activity-view"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                  <span className="text-gray-700 group-hover:text-gray-900">
                    Parent View
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
