import { Script } from '@shared/schema';
import ScriptCard from './ScriptCard';

interface ScriptGridProps {
  scripts: Script[];
  onScriptDetail: (script: Script) => void;
  showNotification: (message: string) => void;
}

const ScriptGrid = ({ scripts, onScriptDetail, showNotification }: ScriptGridProps) => {
  return (
    <div className="container mx-auto max-w-7xl px-4 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {scripts.map((script) => (
          <ScriptCard 
            key={script.id}
            script={script}
            onScriptDetail={() => onScriptDetail(script)}
            showNotification={showNotification}
          />
        ))}

        {scripts.length === 0 && (
          <div className="col-span-full text-center py-10">
            <i className="fas fa-search text-4xl text-[#94a3b8] mb-4"></i>
            <p className="text-[#94a3b8] text-lg">No scripts found. Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptGrid;
