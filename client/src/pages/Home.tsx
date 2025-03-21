import { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ScriptSearch from '../components/ScriptSearch';
import ScriptGrid from '../components/ScriptGrid';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { Script } from '@shared/schema';
import { useScripts } from '../hooks/useScripts';

interface HomeProps {
  onScriptDetail: (script: Script) => void;
  showNotification: (message: string) => void;
}

const Home = ({ onScriptDetail, showNotification }: HomeProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { scripts, isLoading, error } = useScripts();

  // Filter scripts based on search query
  const filteredScripts = scripts?.filter(script => 
    script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.gameType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <>
      <Header />
      <Hero />
      <ScriptSearch 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      
      {isLoading ? (
        <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
          <p className="mt-4 text-[#94a3b8]">Loading scripts...</p>
        </div>
      ) : error ? (
        <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="text-red-500">Failed to load scripts. Please try again later.</p>
        </div>
      ) : (
        <ScriptGrid 
          scripts={filteredScripts} 
          onScriptDetail={onScriptDetail}
          showNotification={showNotification}
        />
      )}
      
      <Footer />
      <BackToTop />
    </>
  );
};

export default Home;
