import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { adBannerData } from '@/components/AdBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Link as LinkIcon, Save } from 'lucide-react';

interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

interface StoredBanners {
  banners: Banner[];
}

export default function BannerManagement() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeTab, setActiveTab] = useState('banner1');

  // Initialize banners from localStorage on component mount
  useEffect(() => {
    const storedBannersJSON = localStorage.getItem('adBanners');
    if (storedBannersJSON) {
      try {
        const storedBanners: StoredBanners = JSON.parse(storedBannersJSON);
        setBanners(storedBanners.banners);
      } catch (e) {
        console.error('Error parsing stored banners:', e);
        // Fallback to default banners if parsing fails
        setBanners(adBannerData);
      }
    } else {
      // If nothing in localStorage, use the default banners
      setBanners(adBannerData);
    }
  }, []);

  // Save banners to localStorage whenever they change
  const saveBanners = (updatedBanners: Banner[]) => {
    try {
      localStorage.setItem('adBanners', JSON.stringify({ banners: updatedBanners }));
      setBanners(updatedBanners);
      toast({
        title: 'Banners saved',
        description: 'Ad banners have been updated successfully',
      });
      
      // Invalidate any queries that might be using the banner data
      queryClient.invalidateQueries({ queryKey: ['adBanners'] });
    } catch (e) {
      console.error('Error saving banners:', e);
      toast({
        title: 'Error',
        description: 'Failed to save banner settings',
        variant: 'destructive',
      });
    }
  };

  const handleBannerUpdate = (id: number, field: keyof Banner, value: string) => {
    const updatedBanners = banners.map(banner => 
      banner.id === id ? { ...banner, [field]: value } : banner
    );
    setBanners(updatedBanners);
  };

  const handleSaveBanner = (id: number) => {
    saveBanners(banners);
  };

  // Preview component for banners
  const BannerPreview = ({ banner }: { banner: Banner }) => (
    <div className="mt-4 border rounded-md p-2 bg-black/20">
      <h4 className="text-sm font-medium mb-2">Preview:</h4>
      <div className="relative w-full h-[90px] overflow-hidden rounded-md shadow-sm border border-gray-700">
        <a 
          href={banner.linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full h-full group"
          onClick={(e) => e.preventDefault()}
        >
          <img 
            src={banner.imageUrl} 
            alt={banner.altText} 
            className="w-full h-[90px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/720x90/374151/FFFFFF?text=Preview+Unavailable';
            }}
          />
          <div className="absolute top-0 right-0 bg-black/60 text-white text-xs px-2 py-1 flex items-center">
            <LinkIcon className="h-3 w-3 mr-1" /> Sponsored
          </div>
        </a>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Click Save to apply changes to the website
      </p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="mr-2 h-5 w-5" />
          Banner Management
        </CardTitle>
        <CardDescription>
          Configure ad banners displayed on the website
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="banner1">Banner 1</TabsTrigger>
            <TabsTrigger value="banner2">Banner 2</TabsTrigger>
          </TabsList>
          
          {banners.map((banner, index) => (
            <TabsContent key={banner.id} value={`banner${index + 1}`}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`image-url-${banner.id}`}>Banner Image URL</Label>
                    <div className="flex items-center space-x-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`image-url-${banner.id}`}
                        placeholder="https://example.com/banner.jpg"
                        value={banner.imageUrl}
                        onChange={(e) => handleBannerUpdate(banner.id, 'imageUrl', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Recommended size: 720×90px</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`link-url-${banner.id}`}>Destination URL</Label>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id={`link-url-${banner.id}`}
                        placeholder="https://example.com/sponsor"
                        value={banner.linkUrl}
                        onChange={(e) => handleBannerUpdate(banner.id, 'linkUrl', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`alt-text-${banner.id}`}>Alt Text</Label>
                    <Input
                      id={`alt-text-${banner.id}`}
                      placeholder="Sponsor Banner"
                      value={banner.altText}
                      onChange={(e) => handleBannerUpdate(banner.id, 'altText', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">For accessibility and SEO</p>
                  </div>
                </div>
                
                <BannerPreview banner={banner} />
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={() => handleSaveBanner(banner.id)}
                  className="w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" /> Save Banner {index + 1}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}