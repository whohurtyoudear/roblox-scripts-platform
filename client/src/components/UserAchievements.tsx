import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Achievement } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Trophy, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserAchievements() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);

  // Query for user achievements
  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    error: achievementsError,
  } = useQuery<Achievement[]>({
    queryKey: ["/api/user/achievements"],
    enabled: !!user,
  });

  // Query for unseen achievements
  const {
    data: unseenAchievements = [],
    isLoading: isLoadingUnseen,
    refetch: refetchUnseen,
  } = useQuery<Achievement[]>({
    queryKey: ["/api/user/achievements/unseen"],
    enabled: !!user,
  });

  // Mutation to check for new achievements
  const checkAchievementsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/achievements/check");
      return await res.json();
    },
    onSuccess: (newAchievements: Achievement[]) => {
      if (newAchievements.length > 0) {
        toast({
          title: "New achievements unlocked!",
          description: `You've earned ${newAchievements.length} new achievement${
            newAchievements.length > 1 ? "s" : ""
          }`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user/achievements"] });
        refetchUnseen();
      }
    },
    onError: (error: Error) => {
      console.error("Failed to check achievements:", error);
    },
  });

  // Mutation to mark achievement as seen
  const markAchievementSeenMutation = useMutation({
    mutationFn: async (achievementId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/user/achievements/${achievementId}/seen`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/achievements/unseen"] });
    },
    onError: (error: Error) => {
      console.error("Failed to mark achievement as seen:", error);
    },
  });

  // Check for new achievements on component mount
  useEffect(() => {
    if (user) {
      checkAchievementsMutation.mutate();
    }
  }, [user]);

  // Show notification for unseen achievements
  useEffect(() => {
    if (unseenAchievements.length > 0 && !showNotification) {
      setShowNotification(true);
      toast({
        title: "New achievements!",
        description: `You have ${unseenAchievements.length} new achievement${
          unseenAchievements.length > 1 ? "s" : ""
        } to view`,
        action: (
          <button
            onClick={() => {
              unseenAchievements.forEach((achievement) => {
                markAchievementSeenMutation.mutate(achievement.id);
              });
              setShowNotification(false);
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium"
          >
            Mark as seen
          </button>
        ),
      });
    }
  }, [unseenAchievements, showNotification]);

  if (isLoadingAchievements) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your earned achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <Skeleton className="h-16 w-16 rounded-md mb-2" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md mt-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (achievementsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load achievements. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your earned achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              You haven't earned any achievements yet. Keep using the platform to unlock achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Achievements
            </CardTitle>
            <CardDescription>Your earned achievements</CardDescription>
          </div>
          {unseenAchievements.length > 0 && (
            <Badge variant="destructive">
              {unseenAchievements.length} New
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const isUnseen = unseenAchievements.some(
              (a) => a.id === achievement.id
            );
            
            return (
              <TooltipProvider key={achievement.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`flex flex-col items-center p-3 rounded-lg border ${
                        isUnseen ? "border-primary ring-2 ring-primary" : "border-border"
                      } hover:bg-accent transition-colors cursor-pointer`}
                      onClick={() => {
                        if (isUnseen) {
                          markAchievementSeenMutation.mutate(achievement.id);
                        }
                      }}
                    >
                      <img
                        src={achievement.imageUrl}
                        alt={achievement.name}
                        className="h-16 w-16 mb-2 rounded"
                      />
                      <span className="font-medium text-sm text-center">{achievement.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {achievement.points} points
                      </span>
                      {isUnseen && (
                        <Badge variant="secondary" className="mt-2">
                          New!
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="max-w-xs">
                      <p className="font-semibold">{achievement.name}</p>
                      <p>{achievement.description}</p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        <strong>Criteria:</strong> {achievement.criteria}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}