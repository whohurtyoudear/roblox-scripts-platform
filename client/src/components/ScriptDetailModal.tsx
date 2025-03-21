import React from 'react';
import { Script } from '@shared/schema';
import { useClipboard } from '../hooks/useClipboard';
import { format } from 'date-fns';
import { X, ExternalLink, Copy, MessageSquare } from 'lucide-react';

interface ScriptDetailModalProps {
  script: Script;
  onClose: () => void;
  showNotification: (message: string) => void;
}

const ScriptDetailModal = ({ script, onClose, showNotification }: ScriptDetailModalProps) => {
  const { copyToClipboard } = useClipboard();

  const handleCopy = () => {
    copyToClipboard(script.code);
    showNotification('Code copied to clipboard!');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center overflow-y-auto px-4 py-8"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1e293b] rounded-xl max-w-4xl w-full modal-animation relative">
        <button 
          className="absolute top-4 right-4 text-[#94a3b8] hover:text-white p-1"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            {script.title}
          </h2>
          
          <div className="relative aspect-video mb-6 bg-black rounded-lg overflow-hidden">
            <img 
              src={script.imageUrl} 
              alt="Script Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="text-white mb-6 leading-relaxed">
            <p className="mb-4">{script.description}</p>
            
            <h3 className="font-semibold text-lg mb-2 text-primary">Game Information:</h3>
            <p className="mb-2">Type: {script.gameType}</p>
            {script.gameLink && (
              <div className="mb-4">
                <a 
                  href={script.gameLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 bg-[#253344] text-primary py-2 px-4 rounded-lg hover:bg-[#2A3B4D] transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" /> Play on Roblox
                </a>
              </div>
            )}
            
            <h3 className="font-semibold text-lg mb-2 text-primary">Instructions:</h3>
            <p>Paste the script into your executor and run it. The script will automatically configure itself for the game.</p>
          </div>
          
          <div className="relative mb-6">
            <pre className="script-code bg-[rgba(0,0,0,0.3)] p-4 rounded-lg text-[#a5b4fc] overflow-x-auto text-sm">
              {script.code}
            </pre>
            <button 
              className="absolute top-3 right-3 bg-[rgba(79,70,229,0.2)] text-[#a5b4fc] py-1 px-3 rounded hover:bg-[rgba(79,70,229,0.4)] transition-colors flex items-center gap-1"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" /> Copy Code
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <a 
              href={script.discordLink || "https://discord.gg/devscripts"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 bg-[#5865F2] text-white py-2 px-5 rounded-lg hover:bg-[#4752c4] transition-colors"
            >
              <MessageSquare className="h-4 w-4" /> Join Discord for Support
            </a>
            <span className="text-[#94a3b8] text-sm">
              Last Updated: {format(new Date(script.lastUpdated), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDetailModal;
