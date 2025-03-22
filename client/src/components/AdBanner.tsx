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
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

export default function AdBanner({ imageUrl, linkUrl, altText }: AdBannerProps) {
  return (
    <div className="relative ad-banner w-full h-[90px] overflow-hidden rounded-md shadow-md mb-4 border border-[#2a3542]">
      <a 
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full h-full group"
      >
        <img 
          src={imageUrl} 
          alt={altText} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 right-0 bg-[#1e293b]/75 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
          <ExternalLink className="h-3 w-3 mr-1" /> Sponsored
        </div>
      </a>
    </div>
  );
}