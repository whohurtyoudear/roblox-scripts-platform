import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

// Default banner data - this can be easily modified
export const adBannerData = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1634942536790-22507f3f5e6d?w=720&h=90&fit=crop",
    linkUrl: "https://example.com/sponsor1",
    altText: "Sponsor Banner 1"
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=720&h=90&fit=crop",
    linkUrl: "https://example.com/sponsor2",
    altText: "Sponsor Banner 2"
  },
];

interface AdBannerProps {
  bannerId?: number;
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
}

export default function AdBanner({ bannerId = 1, imageUrl, linkUrl, altText }: AdBannerProps) {
  const [bannerData, setBannerData] = useState({
    imageUrl: imageUrl || adBannerData[bannerId - 1]?.imageUrl || adBannerData[0].imageUrl,
    linkUrl: linkUrl || adBannerData[bannerId - 1]?.linkUrl || adBannerData[0].linkUrl,
    altText: altText || adBannerData[bannerId - 1]?.altText || adBannerData[0].altText
  });

  // Load banner data from localStorage if available
  useEffect(() => {
    try {
      const storedBannersJSON = localStorage.getItem('adBanners');
      if (storedBannersJSON) {
        const storedBanners = JSON.parse(storedBannersJSON);
        if (storedBanners && storedBanners.banners && storedBanners.banners[bannerId - 1]) {
          const banner = storedBanners.banners[bannerId - 1];
          setBannerData({
            imageUrl: imageUrl || banner.imageUrl,
            linkUrl: linkUrl || banner.linkUrl,
            altText: altText || banner.altText
          });
        }
      }
    } catch (error) {
      console.error("Error loading banner data:", error);
    }
  }, [bannerId, imageUrl, linkUrl, altText]);
  return (
    <div className="relative ad-banner w-full h-[90px] overflow-hidden rounded-md shadow-md mb-4 border border-[#2a3542]">
      <a 
        href={bannerData.linkUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full h-full group"
      >
        <img 
          src={bannerData.imageUrl} 
          alt={bannerData.altText} 
          className="w-full h-[90px] object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/720x90/374151/FFFFFF?text=Ad+Banner';
          }}
        />
        <div className="absolute top-0 right-0 bg-[#1e293b]/75 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
          <ExternalLink className="h-3 w-3 mr-1" /> Sponsored
        </div>
      </a>
    </div>
  );
}