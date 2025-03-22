import { Script } from '@shared/schema';
import { useClipboard } from '../hooks/useClipboard';
import { ExternalLink, Copy, MessageSquare } from 'lucide-react';

interface ScriptCardProps {
  script: Script;
  onScriptDetail: () => void;
  showNotification: (message: string) => void;
}

const ScriptCard = ({ script, onScriptDetail, showNotification }: ScriptCardProps) => {
  const { copyToClipboard } = useClipboard();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(script.code);
    showNotification('Code copied to clipboard!');
  };
  
  // Extract game name from the URL if gameLink is provided
  const getGameName = (url: string) => {
    try {
      // Extract the last part of the URL (after the last slash)
      const urlParts = url.split('/');
      let gameName = urlParts[urlParts.length - 1];
      
      // If it contains additional parameters (after a question mark), remove them
      if (gameName.includes('?')) {
        gameName = gameName.split('?')[0];
      }
      
      // Replace hyphens with spaces and decode URI
      return decodeURIComponent(gameName.replace(/-/g, ' '));
    } catch (e) {
      return 'Roblox Game';
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-lg hover:-translate-y-2 transition-all duration-300 animate-slide-up">
      <img 
        src={script.imageUrl} 
        alt={`${script.title} Script`} 
        className="w-full h-48 object-cover"
      />
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-primary">{script.title}</h3>
        
        {/* Game Type or Link Display */}
        <div className="flex items-center mb-2">
          <span className="text-xs font-medium text-muted-foreground mr-2">Game:</span>
          {script.gameLink ? (
            <a 
              href={script.gameLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {getGameName(script.gameLink)} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-white bg-primary/20 px-2 py-0.5 rounded-full">
              {script.gameType}
            </span>
          )}
        </div>
        
        <p className="text-[#94a3b8] mb-6 text-sm line-clamp-3">
          {script.description}
        </p>
        
        <div className="relative mb-6 group">
          <pre className="script-code bg-[rgba(0,0,0,0.3)] p-3 rounded-lg text-[#a5b4fc] text-sm overflow-x-auto max-h-[100px] overflow-y-auto">
            {script.code}
          </pre>
          <button 
            className="copy-btn absolute top-2 right-2 bg-[rgba(79,70,229,0.2)] text-[#a5b4fc] text-xs py-1 px-2 rounded hover:bg-[rgba(79,70,229,0.4)] transition-colors flex items-center gap-1"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <a 
            href={script.discordLink || "https://discord.gg/zM3V4J98m6"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 bg-[#5865F2] text-white py-2 px-4 rounded-lg text-sm hover:bg-[#4752c4] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare className="h-4 w-4" /> Join Discord
          </a>
          <button 
            className="text-primary hover:text-[#4f46e5] transition-colors inline-flex items-center gap-1"
            onClick={onScriptDetail}
          >
            <ExternalLink className="h-4 w-4" /> Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptCard;
