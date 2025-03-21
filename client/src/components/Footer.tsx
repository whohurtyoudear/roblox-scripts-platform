import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-[#111827] bg-opacity-80 mt-12 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex gap-6 mb-4 md:mb-0">
            <Link href="/" className="text-[#94a3b8] hover:text-primary transition-colors">Home</Link>
            <a href="#scripts" className="text-[#94a3b8] hover:text-primary transition-colors">Scripts</a>
            <a href="https://discord.gg/devscripts" target="_blank" rel="noopener noreferrer" className="text-[#94a3b8] hover:text-primary transition-colors">Discord</a>
            <a href="#" className="text-[#94a3b8] hover:text-primary transition-colors">Terms</a>
          </div>
          <p className="text-[#94a3b8] text-sm">© {new Date().getFullYear()} DEVSCRIPTS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
