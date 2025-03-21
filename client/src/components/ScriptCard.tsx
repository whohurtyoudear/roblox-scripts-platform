import { Script } from '@shared/schema';
import { useClipboard } from '../hooks/useClipboard';

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

  return (
    <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-lg hover:-translate-y-2 transition-all duration-300 animate-slide-up">
      <img 
        src={script.imageUrl} 
        alt={`${script.title} Script`} 
        className="w-full h-48 object-cover"
      />
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-primary">{script.title}</h3>
        <p className="text-[#94a3b8] mb-6 text-sm line-clamp-3">
          {script.description}
        </p>
        
        <div className="relative mb-6 group">
          <pre className="script-code bg-[rgba(0,0,0,0.3)] p-3 rounded-lg text-[#a5b4fc] text-sm overflow-x-auto max-h-[100px] overflow-y-auto">
            {script.code}
          </pre>
          <button 
            className="copy-btn absolute top-2 right-2 bg-[rgba(79,70,229,0.2)] text-[#a5b4fc] text-xs py-1 px-2 rounded hover:bg-[rgba(79,70,229,0.4)] transition-colors"
            onClick={handleCopy}
          >
            <i className="far fa-copy mr-1"></i> Copy
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <a 
            href={script.discordLink || "https://discord.gg/devscripts"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 bg-[#5865F2] text-white py-2 px-4 rounded-lg text-sm hover:bg-[#4752c4] transition-colors"
          >
            <i className="fab fa-discord"></i> Support
          </a>
          <button 
            className="text-primary hover:text-[#4f46e5] transition-colors"
            onClick={onScriptDetail}
          >
            <i className="fas fa-external-link-alt mr-1"></i> Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptCard;
