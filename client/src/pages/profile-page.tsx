import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Script } from "@shared/schema";
import { 
  Loader2, User, Mail, MessageSquare, MessagesSquare, Upload, Shield, Lock, 
  UserCog, Image, Heart, Calendar, Star, Copy, Eye, Clock, ExternalLink 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import AdminUserManagement from "@/components/AdminUserManagement";
import BannerManagement from "@/components/BannerManagement";
import BackButton from "@/components/BackButton";
import ScriptDetailModal from "@/components/ScriptDetailModal";
import Notification from "@/components/Notification";

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isLoading, updateProfileMutation } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: ""
  });
  
  const [profileForm, setProfileForm] = useState({
    bio: "",
    email: "",
    avatarUrl: "",
    discordUsername: ""
  });
  
  // Script detail modal functions
  const openScriptDetail = (script: Script) => {
    setSelectedScript(script);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeScriptDetail = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const showNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: "" });
    }, 2000);
  };
  
  // Fetch user scripts
  const { 
    data: userScripts, 
    isLoading: isScriptsLoading 
  } = useQuery<Script[]>({
    queryKey: ['/api/user/scripts'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: Boolean(user),
  });
  
  // Fetch user favorites
  const { 
    data: favoriteScripts, 
    isLoading: isFavoritesLoading 
  } = useQuery<Script[]>({
    queryKey: ['/api/user/favorites'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        bio: user.bio || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        discordUsername: user.discordUsername || ""
      });
      
      if (user.avatarUrl) {
        setImagePreview(user.avatarUrl);
      }
    }
  }, [user]);
  
  const validateImageUrl = (url: string) => {
    if (!url) return true; // Empty URL is valid
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
  };
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate image URL
    if (profileForm.avatarUrl && !validateImageUrl(profileForm.avatarUrl)) {
      toast({
        title: "Invalid avatar URL",
        description: "Please provide a valid image URL (ending with jpg, png, gif, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    updateProfileMutation.mutate({
      bio: profileForm.bio,
      email: profileForm.email || undefined,
      avatarUrl: profileForm.avatarUrl || undefined,
      discordUsername: profileForm.discordUsername || undefined
    });
  };
  
  const handleImagePreview = (url: string) => {
    setProfileForm({...profileForm, avatarUrl: url});
    
    if (url && validateImageUrl(url)) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };
  
  const getInitials = (username: string) => {
    return username?.slice(0, 2).toUpperCase() || "U";
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500 text-white">Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500 text-white">Moderator</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>Please log in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4">
        <BackButton />
      </div>
      <Card className="mb-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              {getRoleBadge(user.role)}
            </div>
            <CardDescription className="mt-2">
              {user.bio || "No bio provided yet"}
            </CardDescription>
            <div className="mt-2 text-sm text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Member since {formatDate(user.createdAt)}
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${user.role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} mb-6`}>
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="scripts">My Scripts</TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="mr-2 h-4 w-4" /> Favorites
          </TabsTrigger>
          {user.role === 'admin' && <TabsTrigger value="admin"><Shield className="mr-2 h-4 w-4" /> Admin</TabsTrigger>}
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <form onSubmit={handleProfileUpdate}>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your profile information visible to other users
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex items-center space-x-2 border rounded-md px-3 py-2 bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user.username}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discord">Discord Username</Label>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="discord"
                        placeholder="username#0000"
                        value={profileForm.discordUsername}
                        onChange={(e) => setProfileForm({...profileForm, discordUsername: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      placeholder="https://example.com/avatar.jpg"
                      value={profileForm.avatarUrl}
                      onChange={(e) => handleImagePreview(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">URL must end with .jpg, .png, .gif, or other image formats</p>
                  </div>
                </div>
                
                {imagePreview && (
                  <div className="border rounded-md p-4">
                    <Label className="mb-2 block">Avatar Preview</Label>
                    <div className="flex justify-center">
                      <img 
                        src={imagePreview} 
                        alt="Avatar preview" 
                        className="w-24 h-24 rounded-full object-cover"
                        onError={() => setImagePreview(null)}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <ChangePasswordForm />
        </TabsContent>
        
        {/* My Scripts Tab */}
        <TabsContent value="scripts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Scripts</CardTitle>
                <CardDescription>
                  View and manage the scripts you've uploaded
                </CardDescription>
              </div>
              <Button onClick={() => setLocation("/upload")}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Script
              </Button>
            </CardHeader>
            
            <CardContent>
              {isScriptsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !userScripts || userScripts.length === 0 ? (
                <div className="text-center py-10">
                  <MessagesSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Scripts Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't uploaded any scripts yet. Upload your first script to see it here.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => setLocation("/upload")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload a Script
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Total scripts: {userScripts.length}
                  </div>
                  
                  {userScripts.map((script) => (
                    <Card key={script.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">{script.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {script.description}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openScriptDetail(script)}
                            >
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 mt-4">
                          <div className="flex items-center text-sm">
                            <Eye className="h-4 w-4 mr-1 text-muted-foreground" />
                            {script.views || 0}
                          </div>
                          <div className="flex items-center text-sm">
                            <Copy className="h-4 w-4 mr-1 text-muted-foreground" />
                            {script.copies || 0}
                          </div>
                          <div className="flex items-center text-sm">
                            <Star className="h-4 w-4 mr-1 text-muted-foreground" />
                            {script.avgRating ? script.avgRating.toFixed(1) : "N/A"}
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatDate(script.lastUpdated)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Favorites Tab */}
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Scripts</CardTitle>
              <CardDescription>
                Scripts you've saved as favorites
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isFavoritesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !favoriteScripts || favoriteScripts.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Favorites Yet</h3>
                  <p className="text-muted-foreground mt-1">
                    You haven't added any scripts to your favorites yet. Browse scripts and heart them to add them here.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => setLocation("/")}
                  >
                    Browse Scripts
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteScripts.map((script) => (
                    <Card key={script.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">{script.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {script.description}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openScriptDetail(script)}
                            >
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 mt-4">
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-1 text-muted-foreground" />
                            {(script.userId && script.userId.toString() === user.id.toString()) ? "You" : "Unknown"}
                          </div>
                          <div className="flex items-center text-sm">
                            <Star className="h-4 w-4 mr-1 text-muted-foreground" />
                            {script.avgRating ? script.avgRating.toFixed(1) : "N/A"}
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            {formatDate(script.lastUpdated)}
                          </div>
                          {script.gameLink && (
                            <div className="flex items-center text-sm">
                              <ExternalLink className="h-4 w-4 mr-1 text-muted-foreground" />
                              <a 
                                href={script.gameLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Game Link
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Admin Panel Tab - Only for admin users */}
        {user.role === 'admin' && (
          <TabsContent value="admin">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-primary" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription>
                    Administrator-only functions
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="users">
                    <TabsList className="mb-6">
                      <TabsTrigger value="users">
                        <UserCog className="mr-2 h-4 w-4" />
                        User Management
                      </TabsTrigger>
                      <TabsTrigger value="banners">
                        <Image className="mr-2 h-4 w-4" />
                        Banner Management
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="users">
                      <AdminUserManagement />
                    </TabsContent>
                    
                    <TabsContent value="banners">
                      <BannerManagement />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Script Detail Modal */}
      {isModalOpen && selectedScript && (
        <ScriptDetailModal 
          script={selectedScript} 
          onClose={closeScriptDetail} 
          showNotification={showNotification}
        />
      )}
      
      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
      />
    </div>
  );
}