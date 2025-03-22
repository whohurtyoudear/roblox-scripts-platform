import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Users, 
  PieChart, 
  BarChart3, 
  Settings, 
  Link, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import EnhancedUserManagement from '@/components/EnhancedUserManagement';
import AdCampaignManagement from '@/components/AdCampaignManagement';
import AffiliateDashboard from '@/components/AffiliateDashboard';
import BannerManagement from '@/components/BannerManagement';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if user is not logged in or not an admin
  if (!user || user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div className="flex">
        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-[#1e293b] bg-[#0f172a] transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0 w-64' : 'translate-x-[-100%] w-0'
          } lg:relative lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}`}
        >
          <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-2 border-b border-[#1e293b] bg-[#0f172a] px-4">
            <h1 className={`text-primary font-bold text-lg transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
              Admin Panel
            </h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="flex flex-col gap-1 px-2">
              <li>
                <Button 
                  variant={activeTab === 'overview' ? 'secondary' : 'ghost'} 
                  className={`w-full justify-start ${!sidebarOpen && 'lg:justify-center'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>Dashboard</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant={activeTab === 'users' ? 'secondary' : 'ghost'} 
                  className={`w-full justify-start ${!sidebarOpen && 'lg:justify-center'}`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-5 w-5 mr-2" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>User Management</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant={activeTab === 'ads' ? 'secondary' : 'ghost'} 
                  className={`w-full justify-start ${!sidebarOpen && 'lg:justify-center'}`}
                  onClick={() => setActiveTab('ads')}
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>Ad Campaigns</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant={activeTab === 'banners' ? 'secondary' : 'ghost'} 
                  className={`w-full justify-start ${!sidebarOpen && 'lg:justify-center'}`}
                  onClick={() => setActiveTab('banners')}
                >
                  <PieChart className="h-5 w-5 mr-2" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>Banner Management</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant={activeTab === 'affiliate' ? 'secondary' : 'ghost'} 
                  className={`w-full justify-start ${!sidebarOpen && 'lg:justify-center'}`}
                  onClick={() => setActiveTab('affiliate')}
                >
                  <Link className="h-5 w-5 mr-2" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>Affiliate System</span>
                </Button>
              </li>
              <li>
                <Button 
                  variant={activeTab === 'settings' ? 'secondary' : 'ghost'} 
                  className={`w-full justify-start ${!sidebarOpen && 'lg:justify-center'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  <span className={`${!sidebarOpen && 'lg:hidden'}`}>Site Settings</span>
                </Button>
              </li>
            </ul>
          </nav>
          <div className="flex flex-col gap-1 border-t border-[#1e293b] p-4">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center'}`}>
              <div className="flex-shrink-0">
                <img 
                  src={user.avatarUrl || "/images/default-avatar.png"} 
                  alt={user.username}
                  className="h-8 w-8 rounded-full object-cover" 
                />
              </div>
              <div className={`overflow-hidden ${!sidebarOpen && 'lg:hidden'}`}>
                <p className="truncate text-sm font-medium">{user.username}</p>
                <p className="truncate text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className={`flex-1 min-h-screen ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} transition-all duration-300`}>
          <main className="container mx-auto py-6 px-4 max-w-7xl">
            <div className="md:hidden flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <LayoutDashboard className="h-5 w-5" />
              </Button>
            </div>

            {/* Tab content */}
            <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <p className="text-muted-foreground">Welcome back, {user.username}. Here's what's happening with your site.</p>
              </div>
              <AnalyticsDashboard />
            </div>

            <div className={activeTab === 'users' ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
              </div>
              <EnhancedUserManagement />
            </div>

            <div className={activeTab === 'ads' ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Ad Campaign Management</h1>
                <p className="text-muted-foreground">Create and manage advertising campaigns.</p>
              </div>
              <AdCampaignManagement />
            </div>

            <div className={activeTab === 'banners' ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Banner Management</h1>
                <p className="text-muted-foreground">Customize the ad banners displayed on your site.</p>
              </div>
              <BannerManagement />
            </div>

            <div className={activeTab === 'affiliate' ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Affiliate System</h1>
                <p className="text-muted-foreground">Manage affiliate links and track referrals.</p>
              </div>
              <AffiliateDashboard />
            </div>

            <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Site Settings</h1>
                <p className="text-muted-foreground">Configure global settings for your website.</p>
              </div>
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-medium">General Settings</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">This section will be implemented soon.</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}