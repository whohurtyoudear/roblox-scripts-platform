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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  Loader2, 
  MoreHorizontal, 
  PlusCircle, 
  Edit, 
  Trash2, 
  ImageIcon, 
  Link, 
  LineChart as LineChartIcon, 
  Ban, 
  BarChart as BarChartIcon, 
  Calendar,
  Image,
  ExternalLink
} from 'lucide-react';
import { AdCampaign, AdBanner } from '@shared/schema';

// Campaign Type
interface CampaignWithStats extends AdCampaign {
  stats?: {
    impressions: number;
    clicks: number;
    ctr: number;
    banners: number;
  };
}

// Banner Type
interface BannerWithStats extends AdBanner {
  stats?: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
}

export default function AdCampaignManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithStats | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<BannerWithStats | null>(null);
  const [isNewCampaign, setIsNewCampaign] = useState(false);
  const [isNewBanner, setIsNewBanner] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  const [bannerForm, setBannerForm] = useState({
    name: '',
    imageUrl: '',
    linkUrl: '',
    altText: '',
    position: 'top',
    campaignId: 0,
    isActive: true
  });
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [dateRange, setDateRange] = useState('7days');
  const [selectedCampaignForStats, setSelectedCampaignForStats] = useState<number | 'all'>('all');

  // Fetch campaigns
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['/api/admin/ad-campaigns'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch banners
  const { data: bannersData, isLoading: isLoadingBanners } = useQuery({
    queryKey: ['/api/admin/ad-banners'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/ad-stats', dateRange, selectedCampaignForStats],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return apiRequest('POST', '/api/admin/ad-campaigns', campaignData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-campaigns'] });
      toast({
        title: 'Campaign created',
        description: 'The ad campaign has been created successfully.',
      });
      setShowCampaignDialog(false);
      clearCampaignForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create campaign: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/admin/ad-campaigns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-campaigns'] });
      toast({
        title: 'Campaign updated',
        description: 'The ad campaign has been updated successfully.',
      });
      setShowCampaignDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update campaign: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/ad-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-campaigns'] });
      toast({
        title: 'Campaign deleted',
        description: 'The ad campaign has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete campaign: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: any) => {
      return apiRequest('POST', '/api/admin/ad-banners', bannerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-banners'] });
      toast({
        title: 'Banner created',
        description: 'The ad banner has been created successfully.',
      });
      setShowBannerDialog(false);
      clearBannerForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create banner: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/admin/ad-banners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-banners'] });
      toast({
        title: 'Banner updated',
        description: 'The ad banner has been updated successfully.',
      });
      setShowBannerDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update banner: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/ad-banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ad-banners'] });
      toast({
        title: 'Banner deleted',
        description: 'The ad banner has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete banner: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Clear campaign form
  const clearCampaignForm = () => {
    setCampaignForm({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
  };

  // Clear banner form
  const clearBannerForm = () => {
    setBannerForm({
      name: '',
      imageUrl: '',
      linkUrl: '',
      altText: '',
      position: 'top',
      campaignId: 0,
      isActive: true
    });
  };

  // Open create campaign dialog
  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    setIsNewCampaign(true);
    clearCampaignForm();
    setShowCampaignDialog(true);
  };

  // Open edit campaign dialog
  const handleEditCampaign = (campaign: CampaignWithStats) => {
    setSelectedCampaign(campaign);
    setIsNewCampaign(false);
    setCampaignForm({
      name: campaign.name,
      description: campaign.description || '',
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      isActive: campaign.isActive
    });
    setShowCampaignDialog(true);
  };

  // Open create banner dialog
  const handleCreateBanner = (campaignId?: number) => {
    setSelectedBanner(null);
    setIsNewBanner(true);
    clearBannerForm();
    if (campaignId) {
      setBannerForm(prev => ({ ...prev, campaignId }));
    }
    setShowBannerDialog(true);
  };

  // Open edit banner dialog
  const handleEditBanner = (banner: BannerWithStats) => {
    setSelectedBanner(banner);
    setIsNewBanner(false);
    setBannerForm({
      name: banner.name,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      altText: banner.altText || '',
      position: banner.position || 'top',
      campaignId: banner.campaignId,
      isActive: banner.isActive
    });
    setShowBannerDialog(true);
  };

  // Handle campaign form submit
  const handleCampaignSubmit = () => {
    if (isNewCampaign) {
      createCampaignMutation.mutate(campaignForm);
    } else if (selectedCampaign) {
      updateCampaignMutation.mutate({
        id: selectedCampaign.id,
        data: campaignForm
      });
    }
  };

  // Handle banner form submit
  const handleBannerSubmit = () => {
    if (isNewBanner) {
      createBannerMutation.mutate(bannerForm);
    } else if (selectedBanner) {
      updateBannerMutation.mutate({
        id: selectedBanner.id,
        data: bannerForm
      });
    }
  };

  // Handle delete campaign
  const handleDeleteCampaign = (campaign: CampaignWithStats) => {
    deleteCampaignMutation.mutate(campaign.id);
  };

  // Handle delete banner
  const handleDeleteBanner = (banner: BannerWithStats) => {
    deleteBannerMutation.mutate(banner.id);
  };

  // Handle campaign form change
  const handleCampaignFormChange = (field: string, value: any) => {
    setCampaignForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle banner form change
  const handleBannerFormChange = (field: string, value: any) => {
    setBannerForm(prev => ({ ...prev, [field]: value }));
  };

  // Extract campaigns from data
  const campaigns: CampaignWithStats[] = campaignsData?.campaigns || [];
  const banners: BannerWithStats[] = bannersData?.banners || [];
  const stats = statsData?.stats || {
    dailyStats: [],
    campaignStats: [],
    bannerStats: []
  };

  // Campaign status badge
  const getCampaignStatusBadge = (campaign: CampaignWithStats) => {
    if (!campaign.isActive) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-400">Inactive</Badge>;
    }
    
    const now = new Date();
    const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
    
    if (startDate && now < startDate) {
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Scheduled</Badge>;
    } else if (endDate && now > endDate) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-500">Expired</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>;
    }
  };

  // Banner status badge
  const getBannerStatusBadge = (banner: BannerWithStats) => {
    if (!banner.isActive) {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-400">Inactive</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>;
    }
  };

  // Banner preview
  const BannerPreview = ({ banner }: { banner: Partial<BannerWithStats> }) => (
    <div className="mt-4 border rounded-md p-2 bg-black/20">
      <h4 className="text-sm font-medium mb-2">Preview:</h4>
      <div className="relative w-full h-[90px] overflow-hidden rounded-md shadow-sm border border-gray-700">
        {banner.imageUrl ? (
          <a 
            href={banner.linkUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.preventDefault()}
            className="block w-full h-full"
          >
            <img 
              src={banner.imageUrl} 
              alt={banner.altText || "Banner preview"} 
              className="w-full h-[90px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/720x90/374151/FFFFFF?text=Preview+Unavailable';
              }}
            />
          </a>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
            <Image className="h-6 w-6 mr-2" />
            <span>Banner preview will appear here</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Recommended size: 720×90px
      </p>
    </div>
  );

  // Loading state
  if (isLoadingCampaigns && activeTab === 'campaigns') {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoadingBanners && activeTab === 'banners') {
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
          <BarChartIcon className="h-5 w-5" />
          Ad Campaign Management
        </CardTitle>
        <CardDescription>
          Create, manage, and track advertising campaigns and banners
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Ad Campaigns</h3>
              <Button onClick={handleCreateCampaign}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
            
            {campaigns.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">Create your first ad campaign to start promoting content.</p>
                <Button onClick={handleCreateCampaign}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {campaign.description || 'No description'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.startDate && campaign.endDate ? (
                            <div className="text-sm">
                              <span>{formatDate(campaign.startDate)}</span> - <span>{formatDate(campaign.endDate)}</span>
                            </div>
                          ) : campaign.startDate ? (
                            <div className="text-sm">
                              From <span>{formatDate(campaign.startDate)}</span>
                            </div>
                          ) : campaign.endDate ? (
                            <div className="text-sm">
                              Until <span>{formatDate(campaign.endDate)}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No date range set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getCampaignStatusBadge(campaign)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{campaign.stats?.impressions || 0}</span>
                              <span className="text-xs text-muted-foreground">impressions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{campaign.stats?.clicks || 0}</span>
                              <span className="text-xs text-muted-foreground">clicks</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{campaign.stats?.ctr || 0}%</span>
                              <span className="text-xs text-muted-foreground">CTR</span>
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
                              <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateBanner(campaign.id)}>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Add Banner
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setActiveTab('analytics')}
                                onSelect={() => setSelectedCampaignForStats(campaign.id)}
                              >
                                <LineChartIcon className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Campaign
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the campaign and all associated banners.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCampaign(campaign)}
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
          
          {/* Banners Tab */}
          <TabsContent value="banners" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Ad Banners</h3>
              <Button onClick={() => handleCreateBanner()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Banner
              </Button>
            </div>
            
            {banners.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No banners yet</h3>
                <p className="text-muted-foreground mb-4">Create banners to display on your website.</p>
                <Button onClick={() => handleCreateBanner()}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Banner
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banner</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => {
                      const campaign = campaigns.find(c => c.id === banner.campaignId);
                      return (
                        <TableRow key={banner.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-20 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                <img 
                                  src={banner.imageUrl} 
                                  alt={banner.altText || banner.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/720x90/374151/FFFFFF?text=Banner';
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-medium">{banner.name}</div>
                                <a 
                                  href={banner.linkUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {new URL(banner.linkUrl).hostname}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {campaign ? (
                              <div className="font-medium">{campaign.name}</div>
                            ) : (
                              <span className="text-muted-foreground">No campaign</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {banner.position === 'top' ? 'Top' : 
                               banner.position === 'bottom' ? 'Bottom' : 
                               banner.position === 'sidebar' ? 'Sidebar' : 'Custom'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getBannerStatusBadge(banner)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{banner.stats?.impressions || 0}</span>
                                <span className="text-xs text-muted-foreground">views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{banner.stats?.clicks || 0}</span>
                                <span className="text-xs text-muted-foreground">clicks</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{banner.stats?.ctr || 0}%</span>
                                <span className="text-xs text-muted-foreground">CTR</span>
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
                                <DropdownMenuItem onClick={() => handleEditBanner(banner)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Banner
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleBannerFormChange('isActive', !banner.isActive)}
                                  onSelect={() => updateBannerMutation.mutate({
                                    id: banner.id,
                                    data: { isActive: !banner.isActive }
                                  })}
                                >
                                  {banner.isActive ? (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Banner
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this banner.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteBanner(banner)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-lg font-medium">Ad Performance Analytics</h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select 
                  value={selectedCampaignForStats.toString()} 
                  onValueChange={(value) => setSelectedCampaignForStats(value === 'all' ? 'all' : parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full sm:w-36">
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
            </div>
            
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Impressions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.overview?.totalImpressions?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Across all campaigns
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Clicks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.overview?.totalClicks?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Across all campaigns
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average CTR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.overview?.averageCtr?.toFixed(2) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click-through rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Daily Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Performance</CardTitle>
                    <CardDescription>Impressions and clicks over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.dailyStats || []} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                          <Line 
                            type="monotone" 
                            dataKey="impressions" 
                            name="Impressions"
                            stroke="#6366f1" 
                            strokeWidth={2} 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="clicks" 
                            name="Clicks"
                            stroke="#f43f5e" 
                            strokeWidth={2} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Campaign Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Comparing all campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={stats.campaignStats || []} 
                          margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e3a4f" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={150} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                          <Bar dataKey="impressions" name="Impressions" fill="#6366f1" />
                          <Bar dataKey="clicks" name="Clicks" fill="#f43f5e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Banner Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Banners</CardTitle>
                    <CardDescription>By click-through rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Banner</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Impressions</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>CTR</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(stats.bannerStats || []).map((banner: any) => (
                            <TableRow key={banner.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-16 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                    <img 
                                      src={banner.imageUrl} 
                                      alt={banner.name} 
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/720x90/374151/FFFFFF?text=Banner';
                                      }}
                                    />
                                  </div>
                                  <div className="font-medium">{banner.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>{banner.campaignName}</TableCell>
                              <TableCell>{banner.impressions.toLocaleString()}</TableCell>
                              <TableCell>{banner.clicks.toLocaleString()}</TableCell>
                              <TableCell>{banner.ctr.toFixed(2)}%</TableCell>
                            </TableRow>
                          ))}
                          {(stats.bannerStats || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No banner data available
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
      
      {/* Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isNewCampaign ? 'Create Campaign' : 'Edit Campaign'}</DialogTitle>
            <DialogDescription>
              {isNewCampaign 
                ? 'Create a new advertising campaign to promote your content.' 
                : 'Edit your campaign details and settings.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input 
                id="campaign-name" 
                placeholder="Enter campaign name"
                value={campaignForm.name}
                onChange={(e) => handleCampaignFormChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description (optional)</Label>
              <Textarea 
                id="campaign-description" 
                placeholder="Brief description of this campaign"
                value={campaignForm.description}
                onChange={(e) => handleCampaignFormChange('description', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date (optional)</Label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input 
                    id="start-date" 
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => handleCampaignFormChange('startDate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (optional)</Label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input 
                    id="end-date" 
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => handleCampaignFormChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="campaign-active" 
                checked={campaignForm.isActive}
                onCheckedChange={(checked) => handleCampaignFormChange('isActive', checked)}
              />
              <Label htmlFor="campaign-active">Campaign Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCampaignSubmit}
              disabled={!campaignForm.name || createCampaignMutation.isPending || updateCampaignMutation.isPending}
            >
              {(createCampaignMutation.isPending || updateCampaignMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isNewCampaign ? 'Create Campaign' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Banner Dialog */}
      <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isNewBanner ? 'Create Banner' : 'Edit Banner'}</DialogTitle>
            <DialogDescription>
              {isNewBanner 
                ? 'Create a new ad banner to display on the website.' 
                : 'Edit your banner details and settings.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="banner-name">Banner Name</Label>
              <Input 
                id="banner-name" 
                placeholder="Enter banner name"
                value={bannerForm.name}
                onChange={(e) => handleBannerFormChange('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-campaign">Campaign</Label>
              <Select 
                value={bannerForm.campaignId ? bannerForm.campaignId.toString() : ''}
                onValueChange={(value) => handleBannerFormChange('campaignId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-image">Banner Image URL</Label>
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="banner-image" 
                  placeholder="https://example.com/banner.jpg"
                  value={bannerForm.imageUrl}
                  onChange={(e) => handleBannerFormChange('imageUrl', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-link">Destination URL</Label>
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="banner-link" 
                  placeholder="https://example.com/landing-page"
                  value={bannerForm.linkUrl}
                  onChange={(e) => handleBannerFormChange('linkUrl', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-alt">Alt Text</Label>
              <Input 
                id="banner-alt" 
                placeholder="Banner ad for Product X"
                value={bannerForm.altText}
                onChange={(e) => handleBannerFormChange('altText', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner-position">Position</Label>
              <Select 
                value={bannerForm.position}
                onValueChange={(value) => handleBannerFormChange('position', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="banner-active" 
                checked={bannerForm.isActive}
                onCheckedChange={(checked) => handleBannerFormChange('isActive', checked)}
              />
              <Label htmlFor="banner-active">Banner Active</Label>
            </div>
            
            <BannerPreview banner={bannerForm} />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBannerDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleBannerSubmit}
              disabled={
                !bannerForm.name || 
                !bannerForm.imageUrl || 
                !bannerForm.linkUrl || 
                !bannerForm.campaignId ||
                createBannerMutation.isPending || 
                updateBannerMutation.isPending
              }
            >
              {(createBannerMutation.isPending || updateBannerMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isNewBanner ? 'Create Banner' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}