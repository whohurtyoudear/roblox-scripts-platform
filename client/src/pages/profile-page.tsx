import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User, Mail, MessageSquare, MessagesSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, isLoading, updateProfileMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("profile");
  
  const [profileForm, setProfileForm] = useState({
    bio: "",
    email: "",
    avatarUrl: "",
    discordUsername: ""
  });
  
  useEffect(() => {
    if (user) {
      setProfileForm({
        bio: user.bio || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        discordUsername: user.discordUsername || ""
      });
    }
  }, [user]);
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      bio: profileForm.bio,
      email: profileForm.email || undefined,
      avatarUrl: profileForm.avatarUrl || undefined,
      discordUsername: profileForm.discordUsername || undefined
    });
  };
  
  const getInitials = (username: string) => {
    return username?.slice(0, 2).toUpperCase() || "U";
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
      <Card className="mb-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">User Profile</CardTitle>
            <CardDescription>View and edit your profile information</CardDescription>
          </div>
          <div className="mt-4 md:mt-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="scripts">My Scripts</TabsTrigger>
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
                      onChange={(e) => setProfileForm({...profileForm, avatarUrl: e.target.value})}
                    />
                  </div>
                </div>
                
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
        
        {/* My Scripts Tab */}
        <TabsContent value="scripts">
          <Card>
            <CardHeader>
              <CardTitle>My Scripts</CardTitle>
              <CardDescription>
                View and manage the scripts you've uploaded
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center py-10">
                <MessagesSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Scripts Yet</h3>
                <p className="text-muted-foreground mt-1">
                  You haven't uploaded any scripts yet. Upload your first script to see it here.
                </p>
                <Button className="mt-4">
                  Upload a Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}