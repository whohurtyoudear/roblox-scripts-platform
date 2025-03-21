import { ChangeEvent } from 'react';

interface ScriptSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ScriptSearch = ({ searchQuery, setSearchQuery }: ScriptSearchProps) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div id="scripts" className="container mx-auto max-w-7xl px-4 pt-12">
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-[#1e293b] border border-[#94a3b8] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="Search for scripts..."
          />
          <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-[#94a3b8]"></i>
        </div>
      </div>
    </div>
  );
};

export default ScriptSearch;
