import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", email: "" });
  const [_, setLocation] = useLocation();
  
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginForm.username,
      password: loginForm.password
    });
  };
  
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email || undefined
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">DEVSCRIPTS</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to access premium scripts
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        placeholder="Your username" 
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-2"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input 
                        id="reg-username" 
                        placeholder="Choose a username" 
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="reg-email">Email (optional)</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        placeholder="your.email@example.com" 
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input 
                        id="reg-password" 
                        type="password" 
                        placeholder="Choose a strong password" 
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-2"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>By signing in, you agree to our Terms of Service</p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Hero Side */}
      <div className="flex-1 bg-gradient-to-b from-[#1e1b4b] to-[#312e81] p-10 flex items-center justify-center hidden md:flex">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#a5b4fc] to-[#818cf8] text-transparent bg-clip-text mb-4">
            Unleash the Power of Roblox
          </h1>
          <p className="text-[#94a3b8] mb-6">
            Join our community to access premium scripts and elevate your Roblox experience. 
            Share your own creations and connect with fellow developers.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-opacity-10 bg-white rounded-lg">
              <h3 className="text-primary font-semibold mb-1">Premium Scripts</h3>
              <p className="text-xs text-[#94a3b8]">Access to high-quality, regularly updated scripts</p>
            </div>
            <div className="p-4 bg-opacity-10 bg-white rounded-lg">
              <h3 className="text-primary font-semibold mb-1">Upload Scripts</h3>
              <p className="text-xs text-[#94a3b8]">Share your creations with the community</p>
            </div>
            <div className="p-4 bg-opacity-10 bg-white rounded-lg">
              <h3 className="text-primary font-semibold mb-1">Community</h3>
              <p className="text-xs text-[#94a3b8]">Connect with fellow Roblox developers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}