import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertScript, insertScriptSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const gameTypes = [
  "Blade Ball",
  "Blox Fruits",
  "Pet Simulator X",
  "Arsenal",
  "Doors",
  "Brookhaven",
  "Natural Disaster Survival",
  "Adopt Me",
  "Murder Mystery 2",
  "Other"
];

export default function UploadScriptPage() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    code: "",
    gameType: "",
    imageUrl: "",
    discordLink: ""
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const uploadMutation = useMutation({
    mutationFn: async (scriptData: InsertScript) => {
      const res = await apiRequest("POST", "/api/scripts", scriptData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scripts'] });
      toast({
        title: "Script uploaded successfully",
        description: "Your script has been added to the collection",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formState.title?.trim()) {
      errors.title = "Title is required";
    }
    
    if (!formState.description?.trim()) {
      errors.description = "Description is required";
    } else if (formState.description.length < 20) {
      errors.description = "Description must be at least 20 characters";
    }
    
    if (!formState.code?.trim()) {
      errors.code = "Script code is required";
    }
    
    if (!formState.gameType?.trim()) {
      errors.gameType = "Game type is required";
    }
    
    if (!formState.imageUrl?.trim()) {
      errors.imageUrl = "Image URL is required";
    } else if (!formState.imageUrl.match(/^https?:\/\/.+\..+/)) {
      errors.imageUrl = "Please enter a valid image URL";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const scriptData: InsertScript = {
      title: formState.title!,
      description: formState.description!,
      code: formState.code!,
      gameType: formState.gameType!,
      imageUrl: formState.imageUrl!,
      discordLink: formState.discordLink || undefined,
      lastUpdated: new Date().toISOString()
    };
    
    uploadMutation.mutate(scriptData);
  };
  
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>
            You need to be logged in to upload scripts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Script
            </CardTitle>
            <CardDescription>
              Share your Roblox script with the community
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Script Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Ultimate Arsenal Aimbot"
                  value={formState.title}
                  onChange={(e) => setFormState({...formState, title: e.target.value})}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gameType">
                  Game Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="gameType"
                  value={formState.gameType}
                  onChange={(e) => setFormState({...formState, gameType: e.target.value})}
                  className={`w-full h-10 px-3 rounded-md border ${
                    formErrors.gameType ? "border-red-500" : "border-input"
                  } bg-background`}
                >
                  <option value="" disabled>Select a game</option>
                  {gameTypes.map((game) => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
                {formErrors.gameType && (
                  <p className="text-sm text-red-500">{formErrors.gameType}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what your script does, its features, and how to use it"
                rows={3}
                value={formState.description}
                onChange={(e) => setFormState({...formState, description: e.target.value})}
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">
                Script Code <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="code"
                placeholder="Paste your Roblox Lua script here"
                rows={8}
                value={formState.code}
                onChange={(e) => setFormState({...formState, code: e.target.value})}
                className={`font-mono ${formErrors.code ? "border-red-500" : ""}`}
              />
              {formErrors.code && (
                <p className="text-sm text-red-500">{formErrors.code}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">
                  Image URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={formState.imageUrl}
                  onChange={(e) => setFormState({...formState, imageUrl: e.target.value})}
                  className={formErrors.imageUrl ? "border-red-500" : ""}
                />
                {formErrors.imageUrl && (
                  <p className="text-sm text-red-500">{formErrors.imageUrl}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use a direct image URL for the script thumbnail
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discordLink">Discord Link (optional)</Label>
                <Input
                  id="discordLink"
                  placeholder="https://discord.gg/yourdiscord"
                  value={formState.discordLink}
                  onChange={(e) => setFormState({...formState, discordLink: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={uploadMutation.isPending}
              className="w-full md:w-auto"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Script
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}