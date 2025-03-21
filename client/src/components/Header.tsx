import { useState } from 'react';
import { Link } from 'wouter';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-opacity-80 backdrop-blur-md bg-[#111827] shadow-md">
      <div className="container mx-auto max-w-7xl px-4">
        <nav className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <i className="fas fa-code"></i>
            <span>DEVSCRIPTS</span>
          </Link>
          
          <div className="hidden md:flex gap-6">
            <Link href="/" className="font-medium hover:text-primary transition-colors">Home</Link>
            <a href="#scripts" className="font-medium hover:text-primary transition-colors">Scripts</a>
            <a href="https://discord.gg/devscripts" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors">Discord</a>
            <a href="#" className="font-medium hover:text-primary transition-colors">About</a>
          </div>
          
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </nav>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4 pb-4">
              <Link href="/" className="font-medium hover:text-primary transition-colors">Home</Link>
              <a href="#scripts" className="font-medium hover:text-primary transition-colors">Scripts</a>
              <a href="https://discord.gg/devscripts" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors">Discord</a>
              <a href="#" className="font-medium hover:text-primary transition-colors">About</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
