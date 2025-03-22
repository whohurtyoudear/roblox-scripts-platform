import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Upload, Menu, X, LayoutDashboard } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [_, setLocation] = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLogin = () => {
    setLocation('/auth');
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-opacity-80 backdrop-blur-md bg-[#111827] shadow-md">
      <div className="container mx-auto max-w-7xl px-4">
        <nav className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <span>DEVSCRIPTS</span>
          </Link>
          
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/" className="font-medium hover:text-primary transition-colors">Home</Link>
            <a href="#scripts" className="font-medium hover:text-primary transition-colors">Scripts</a>
            <a href="https://discord.gg/zM3V4J98m6" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors">Join Discord</a>
            <a href="#" className="font-medium hover:text-primary transition-colors">About</a>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || "No email provided"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Upload Script</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLogin} size="sm">
                Sign In
              </Button>
            )}
          </div>
          
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </nav>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <div className="flex flex-col gap-4 pb-4">
              <Link href="/" className="font-medium hover:text-primary transition-colors">Home</Link>
              <a href="#scripts" className="font-medium hover:text-primary transition-colors">Scripts</a>
              <a href="https://discord.gg/zM3V4J98m6" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors">Join Discord</a>
              <a href="#" className="font-medium hover:text-primary transition-colors">About</a>
              
              {user ? (
                <>
                  <div className="pt-2 pb-1 border-t border-gray-700">
                    <div className="flex items-center gap-2 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 font-medium hover:text-primary transition-colors">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <Link href="/upload" className="flex items-center gap-2 font-medium hover:text-primary transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload Script</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 font-medium hover:text-primary transition-colors">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 font-medium text-red-500 hover:text-red-400 transition-colors mt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <Button onClick={handleLogin} className="mt-2">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
