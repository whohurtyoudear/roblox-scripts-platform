import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Loader2, 
  MoreHorizontal, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Link as LinkIcon, 
  LineChart as LineChartIcon, 
  BarChart as BarChartIcon, 
  Copy, 
  ExternalLink,
  Globe,
  DollarSign,
  Share2
} from 'lucide-react';
import { AffiliateLink } from '@shared/schema';

interface AffiliateLinkWithStats extends AffiliateLink {
  stats?: {
    clicks: number;
    uniqueClicks: number;
    conversionRate: number;
    revenue: number;
  };
}

// Colors for the charts
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('links');
  const [selectedLink, setSelectedLink] = useState<AffiliateLinkWithStats | null>(null);
  const [isNewLink, setIsNewLink] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [dateRange, setDateRange] = useState('7days');
  const [linkForm, setLinkForm] = useState({
    name: '',
    description: '',
    targetUrl: '',
    code: '',
    commission: '0',
    isActive: true
  });

  // Fetch affiliate links
  const { data: linksData, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['/api/admin/affiliate-links'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/affiliate-stats', dateRange],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Create affiliate link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: any) => {
      return apiRequest('POST', '/api/admin/affiliate-links', linkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-links'] });
      toast({
        title: 'Affiliate link created',
        description: 'The affiliate link has been created successfully.',
      });
      setShowLinkDialog(false);
      clearLinkForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create affiliate link: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update affiliate link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/admin/affiliate-links/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-links'] });
      toast({
        title: 'Affiliate link updated',
        description: 'The affiliate link has been updated successfully.',
      });
      setShowLinkDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update affiliate link: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete affiliate link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/affiliate-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-links'] });
      toast({
        title: 'Affiliate link deleted',
        description: 'The affiliate link has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete affiliate link: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Clear link form
  const clearLinkForm = () => {
    setLinkForm({
      name: '',
      description: '',
      targetUrl: '',
      code: '',
      commission: '0',
      isActive: true
    });
  };

  // Generate random code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Open create link dialog
  const handleCreateLink = () => {
    setSelectedLink(null);
    setIsNewLink(true);
    clearLinkForm();
    setLinkForm(prev => ({ ...prev, code: generateRandomCode() }));
    setShowLinkDialog(true);
  };

  // Open edit link dialog
  const handleEditLink = (link: AffiliateLinkWithStats) => {
    setSelectedLink(link);
    setIsNewLink(false);
    setLinkForm({
      name: link.name,
      description: link.description || '',
      targetUrl: link.targetUrl,
      code: link.code,
      commission: link.commission?.toString() || '0',
      isActive: link.isActive
    });
    setShowLinkDialog(true);
  };

  // Handle link form submit
  const handleLinkSubmit = () => {
    if (isNewLink) {
      createLinkMutation.mutate({
        ...linkForm,
        commission: parseFloat(linkForm.commission)
      });
    } else if (selectedLink) {
      updateLinkMutation.mutate({
        id: selectedLink.id,
        data: {
          ...linkForm,
          commission: parseFloat(linkForm.commission)
        }
      });
    }
  };

  // Handle delete link
  const handleDeleteLink = (link: AffiliateLinkWithStats) => {
    deleteLinkMutation.mutate(link.id);
  };

  // Handle link form change
  const handleLinkFormChange = (field: string, value: any) => {
    setLinkForm(prev => ({ ...prev, [field]: value }));
  };

  // Copy affiliate link to clipboard
  const copyToClipboard = (link: AffiliateLinkWithStats) => {
    const affiliateUrl = `${window.location.origin}/ref/${link.code}`;
    navigator.clipboard.writeText(affiliateUrl);
    toast({
      title: 'Link copied',
      description: 'Affiliate link copied to clipboard.',
    });
  };

  // Generate new code
  const generateNewCode = () => {
    setLinkForm(prev => ({ ...prev, code: generateRandomCode() }));
  };

  // Get full affiliate url
  const getAffiliateUrl = (code: string) => {
    return `${window.location.origin}/ref/${code}`;
  };

  // Extract links from data
  const links: AffiliateLinkWithStats[] = linksData?.links || [];
  const stats = statsData?.stats || {
    overview: {
      totalClicks: 0,
      uniqueClicks: 0,
      averageCommission: 0,
      estimatedRevenue: 0
    },
    clicksByDate: [],
    referrerStats: [],
    linkPerformance: []
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Loading state
  if (isLoadingLinks && activeTab === 'links') {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Affiliate Management
        </CardTitle>
        <CardDescription>
          Create, manage, and track custom affiliate links
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links">Affiliate Links</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>
          
          {/* Links Tab */}
          <TabsContent value="links" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Affiliate Links</h3>
              <Button onClick={handleCreateLink}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Affiliate Link
              </Button>
            </div>
            
            {links.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <LinkIcon className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No affiliate links yet</h3>
                <p className="text-muted-foreground mb-4">Create your first affiliate link to start tracking referrals.</p>
                <Button onClick={handleCreateLink}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Affiliate Link
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Target URL</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{link.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {link.description || 'No description'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <a 
                            href={link.targetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            {(() => {
                              try {
                                return new URL(link.targetUrl).hostname;
                              } catch (e) {
                                return link.targetUrl;
                              }
                            })()}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-secondary px-1 py-0.5 rounded text-xs">
                              {link.code}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(link)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {link.commission ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              {link.commission}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Default</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{link.stats?.clicks || 0}</span>
                              <span className="text-xs text-muted-foreground">clicks</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{formatCurrency(link.stats?.revenue || 0)}</span>
                              <span className="text-xs text-muted-foreground">revenue</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => copyToClipboard(link)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditLink(link)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Link
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setActiveTab('analytics')}
                              >
                                <LineChartIcon className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleLinkFormChange('isActive', !link.isActive)}
                                onSelect={() => updateLinkMutation.mutate({
                                  id: link.id,
                                  data: { isActive: !link.isActive }
                                })}
                              >
                                {link.isActive ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Link
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this affiliate link.
                                      Statistics for this link will be lost.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteLink(link)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-lg font-medium">Affiliate Performance</h3>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.overview?.totalClicks?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Across all affiliate links
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Unique Visitors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.overview?.uniqueClicks?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Unique referrals
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg. Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.overview?.averageCommission?.toFixed(2) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average commission rate
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Estimated Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(stats.overview?.estimatedRevenue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Potential earnings
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Clicks Over Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Clicks Over Time</CardTitle>
                    <CardDescription>Daily affiliate link clicks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.clicksByDate || []} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                          <Line 
                            type="monotone" 
                            dataKey="clicks" 
                            name="Total Clicks"
                            stroke="#6366f1" 
                            strokeWidth={2} 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="uniqueClicks" 
                            name="Unique Clicks"
                            stroke="#f43f5e" 
                            strokeWidth={2} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  {/* Link Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Link Performance</CardTitle>
                      <CardDescription>Clicks by affiliate link</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={stats.linkPerformance || []} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                            <Bar dataKey="clicks" name="Clicks" fill="#6366f1" />
                            <Bar dataKey="uniqueClicks" name="Unique Clicks" fill="#f43f5e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Referrer Sources */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Referrer Sources</CardTitle>
                      <CardDescription>Where your traffic is coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.referrerStats || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {(stats.referrerStats || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Link Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Link Details</CardTitle>
                    <CardDescription>Detailed performance by affiliate link</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Unique Clicks</TableHead>
                            <TableHead>Conversion Rate</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Est. Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(stats.linkPerformance || []).map((link) => (
                            <TableRow key={link.id}>
                              <TableCell>
                                <div className="font-medium">{link.name}</div>
                                <code className="text-xs bg-secondary px-1 py-0.5 rounded">
                                  {link.code}
                                </code>
                              </TableCell>
                              <TableCell>{link.clicks.toLocaleString()}</TableCell>
                              <TableCell>{link.uniqueClicks.toLocaleString()}</TableCell>
                              <TableCell>{link.conversionRate.toFixed(2)}%</TableCell>
                              <TableCell>{link.commission}%</TableCell>
                              <TableCell>{formatCurrency(link.revenue)}</TableCell>
                            </TableRow>
                          ))}
                          {(stats.linkPerformance || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                No performance data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isNewLink ? 'Create Affiliate Link' : 'Edit Affiliate Link'}</DialogTitle>
            <DialogDescription>
              {isNewLink 
                ? 'Create a new affiliate link to track referrals.' 
                : 'Edit your affiliate link details and settings.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="link-name">Link Name</Label>
              <Input 
                id="link-name" 
                placeholder="Enter a name for this link"
                value={linkForm.name}
                onChange={(e) => handleLinkFormChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link-description">Description (optional)</Label>
              <Textarea 
                id="link-description" 
                placeholder="Brief description of this affiliate link"
                value={linkForm.description}
                onChange={(e) => handleLinkFormChange('description', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-url">Target URL</Label>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="target-url" 
                  placeholder="https://example.com/landing-page"
                  value={linkForm.targetUrl}
                  onChange={(e) => handleLinkFormChange('targetUrl', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link-code">Affiliate Code</Label>
              <div className="flex gap-2">
                <div className="flex items-center space-x-2 flex-1">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="link-code" 
                    placeholder="Unique affiliate code"
                    value={linkForm.code}
                    onChange={(e) => handleLinkFormChange('code', e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateNewCode}
                  type="button"
                >
                  Generate
                </Button>
              </div>
              {linkForm.code && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Full URL:</p>
                  <div className="flex items-center gap-2 mt-1 bg-secondary p-2 rounded">
                    <code className="text-xs break-all">
                      {getAffiliateUrl(linkForm.code)}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-auto"
                      onClick={() => {
                        navigator.clipboard.writeText(getAffiliateUrl(linkForm.code));
                        toast({
                          title: 'Copied!',
                          description: 'Affiliate link copied to clipboard.',
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commission">Commission Rate (%)</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="commission" 
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Commission percentage"
                  value={linkForm.commission}
                  onChange={(e) => handleLinkFormChange('commission', e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="link-active" 
                checked={linkForm.isActive}
                onCheckedChange={(checked) => handleLinkFormChange('isActive', checked)}
              />
              <Label htmlFor="link-active">Link Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleLinkSubmit}
              disabled={
                !linkForm.name || 
                !linkForm.targetUrl || 
                !linkForm.code ||
                createLinkMutation.isPending || 
                updateLinkMutation.isPending
              }
            >
              {(createLinkMutation.isPending || updateLinkMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isNewLink ? 'Create Link' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}