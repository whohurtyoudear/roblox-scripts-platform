import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, Users, FileText, Eye, Copy, UserPlus, UserMinus } from 'lucide-react';

// Define our stat card component
const StatCard = ({ title, value, icon, description, trend = null }: { 
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: { value: number; isPositive: boolean } | null;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend ? (
        <p className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'} flex items-center gap-1 mt-1`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
          <TrendingUp className={`h-3 w-3 ${trend.isPositive ? '' : 'transform rotate-180'}`} />
          <span className="text-muted-foreground">{description}</span>
        </p>
      ) : (
        description && <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

// Data colors
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('week');
  
  // Fetch analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics', dateRange],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100/10 rounded-md">
        Error loading analytics: {error.message}
      </div>
    );
  }

  const analytics = data || {
    // Default structure if no data is returned
    overview: { 
      totalUsers: 0, totalScripts: 0, totalViews: 0, totalCopies: 0,
      newUsers: { count: 0, trend: 0 },
      activeScripts: { count: 0, trend: 0 }
    },
    userActivity: [],
    scriptPopularity: [],
    categoryDistribution: [],
    dailyVisits: []
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        
        <Tabs defaultValue={dateRange} onValueChange={setDateRange}>
          <TabsList>
            <TabsTrigger value="week">7 Days</TabsTrigger>
            <TabsTrigger value="month">30 Days</TabsTrigger>
            <TabsTrigger value="quarter">3 Months</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={analytics.overview.totalUsers} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
          description="Overall registered users"
        />
        <StatCard 
          title="New Users" 
          value={analytics.overview.newUsers.count} 
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
          trend={{ 
            value: analytics.overview.newUsers.trend,
            isPositive: analytics.overview.newUsers.trend >= 0
          }}
          description="Since last period"
        />
        <StatCard 
          title="Total Scripts" 
          value={analytics.overview.totalScripts} 
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="Available scripts"
        />
        <StatCard 
          title="Active Scripts" 
          value={analytics.overview.activeScripts.count} 
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={{ 
            value: analytics.overview.activeScripts.trend,
            isPositive: analytics.overview.activeScripts.trend >= 0
          }}
          description="Used in past 24h"
        />
        <StatCard 
          title="Total Views" 
          value={analytics.overview.totalViews} 
          icon={<Eye className="h-4 w-4 text-muted-foreground" />}
          description="Cumulative script views"
        />
        <StatCard 
          title="Total Copies" 
          value={analytics.overview.totalCopies} 
          icon={<Copy className="h-4 w-4 text-muted-foreground" />}
          description="Scripts copied to clipboard"
        />
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Daily Visits Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Script views and copies over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyVisits} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="copies" stroke="#f43f5e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Active users by time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.userActivity} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Bar dataKey="users" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Popular Scripts */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Scripts</CardTitle>
            <CardDescription>Most viewed and copied scripts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={analytics.scriptPopularity} 
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Bar dataKey="views" fill="#6366f1" name="Views" />
                  <Bar dataKey="copies" fill="#f43f5e" name="Copies" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Scripts by category</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-[300px] w-full max-w-lg">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}