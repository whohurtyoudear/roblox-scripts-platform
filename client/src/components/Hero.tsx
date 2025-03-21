import { Link } from 'wouter';

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-[#1e1b4b] to-[#312e81] py-16 text-center px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#a5b4fc] to-[#818cf8] text-transparent bg-clip-text">
          Premium Roblox Scripts
        </h1>
        <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto mb-8">
          Access the best collection of scripts for all your favorite Roblox games. 
          Elevate your gameplay with our high-quality, regularly updated resources.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="#scripts" 
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#4f46e5] text-white py-3 px-6 rounded-lg font-medium transition-all hover:-translate-y-1 shadow-lg"
          >
            <i className="fas fa-search"></i>
            Browse Scripts
          </a>
          <a 
            href="https://discord.gg/devscripts" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-[#94a3b8] py-3 px-6 rounded-lg font-medium transition-all hover:-translate-y-1 hover:border-primary hover:text-primary"
          >
            <i className="fab fa-discord"></i>
            Join Discord
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
