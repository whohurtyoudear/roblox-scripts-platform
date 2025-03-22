import React, { useState } from 'react';
import { Script } from '@shared/schema';
import { useClipboard } from '../hooks/useClipboard';
import { format } from 'date-fns';
import { X, ExternalLink, Copy, MessageSquare, Trash, Edit, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ScriptDetailModalProps {
  script: Script;
  onClose: () => void;
  showNotification: (message: string) => void;
  onDelete?: () => void;
}

const ScriptDetailModal = ({ script, onClose, showNotification, onDelete }: ScriptDetailModalProps) => {
  const { copyToClipboard } = useClipboard();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Check if this script is favorited by the current user
  const { data: isFavorited = false, isLoading: isFavoriteLoading } = useQuery<boolean>({
    queryKey: [`/api/scripts/${script.id}/favorite/check`],
    queryFn: async () => {
      try {
        if (!user) return false;
        const res = await apiRequest('GET', `/api/scripts/${script.id}/favorite/check`);
        const data = await res.json();
        return data.isFavorite;
      } catch (error) {
        return false;
      }
    },
    enabled: !!user, // Only run if user is logged in
  });
  
  // Mutations for adding/removing favorites
  const addFavorite = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/scripts/${script.id}/favorite`);
      return res.json();
    },
    onSuccess: () => {
      showNotification('Added to favorites!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/scripts/${script.id}/favorite/check`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
    },
    onError: (error: Error) => {
      showNotification(`Error: ${error.message}`);
    },
  });
  
  const removeFavorite = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/api/scripts/${script.id}/favorite`);
      return res.json();
    },
    onSuccess: () => {
      showNotification('Removed from favorites');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/scripts/${script.id}/favorite/check`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/favorites'] });
    },
    onError: (error: Error) => {
      showNotification(`Error: ${error.message}`);
    },
  });

  const deleteScriptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/scripts/${script.id}`);
    },
    onSuccess: () => {
      showNotification("Script deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['/api/scripts'] });
      onClose();
      if (onDelete) onDelete();
    },
    onError: (error: Error) => {
      showNotification(`Error: ${error.message}`);
    }
  });

  const handleCopy = () => {
    copyToClipboard(script.code);
    showNotification('Code copied to clipboard!');
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteScriptMutation.mutate();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Extract game name from the URL if gameLink is provided
  const getGameName = (url: string) => {
    try {
      // Extract the last part of the URL (after the last slash)
      const urlParts = url.split('/');
      let gameName = urlParts[urlParts.length - 1];
      
      // If it contains additional parameters (after a question mark), remove them
      if (gameName.includes('?')) {
        gameName = gameName.split('?')[0];
      }
      
      // Replace hyphens with spaces and decode URI
      return decodeURIComponent(gameName.replace(/-/g, ' '));
    } catch (e) {
      return 'Roblox Game';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center overflow-y-auto px-4 py-8"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1e293b] rounded-xl max-w-4xl w-full modal-animation relative">
        <button 
          className="absolute top-4 right-4 text-[#94a3b8] hover:text-white p-1"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
            {script.title}
          </h2>
          
          <div className="relative aspect-video mb-6 bg-black rounded-lg overflow-hidden">
            <img 
              src={script.imageUrl} 
              alt="Script Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="text-white mb-6 leading-relaxed">
            <p className="mb-4">{script.description}</p>
            
            <h3 className="font-semibold text-lg mb-2 text-primary">Game Information:</h3>
            {script.gameType && <p className="mb-2">Type: {script.gameType}</p>}
            {script.gameLink && (
              <div className="mb-4">
                <a 
                  href={script.gameLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 bg-[#253344] text-primary py-2 px-4 rounded-lg hover:bg-[#2A3B4D] transition-colors text-sm"
                >
                  <ExternalLink className="h-4 w-4" /> Play {getGameName(script.gameLink)}
                </a>
              </div>
            )}
            
            <h3 className="font-semibold text-lg mb-2 text-primary">Instructions:</h3>
            <p>Paste the script into your executor and run it. The script will automatically configure itself for the game.</p>
          </div>
          
          <div className="relative mb-6">
            <pre className="script-code bg-[rgba(0,0,0,0.3)] p-4 rounded-lg text-[#a5b4fc] overflow-x-auto text-sm">
              {script.code}
            </pre>
            <button 
              className="absolute top-3 right-3 bg-[rgba(79,70,229,0.2)] text-[#a5b4fc] py-1 px-3 rounded hover:bg-[rgba(79,70,229,0.4)] transition-colors flex items-center gap-1"
              onClick={handleCopy}
            >
              <Copy className="h-4 w-4" /> Copy Code
            </button>
          </div>
          
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <a 
                href={script.discordLink || "https://discord.gg/zM3V4J98m6"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 bg-[#5865F2] text-white py-2 px-5 rounded-lg hover:bg-[#4752c4] transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Join Discord
              </a>
              
              {/* Favorite button for logged in users */}
              {user && (
                <button 
                  className={`inline-flex items-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                    isFavorited 
                      ? 'bg-pink-500/20 text-pink-500' 
                      : 'bg-slate-700/50 text-white hover:bg-slate-700/70'
                  }`}
                  onClick={() => {
                    if (isFavorited) {
                      removeFavorite.mutate();
                    } else {
                      addFavorite.mutate();
                    }
                  }}
                  disabled={isFavoriteLoading || addFavorite.isPending || removeFavorite.isPending}
                >
                  <Heart 
                    className={`h-4 w-4 ${isFavorited ? 'fill-pink-500' : ''}`} 
                  />
                  {isFavorited ? 'Unfavorite' : 'Add to Favorites'}
                </button>
              )}
              
              {/* Admin/Moderator actions */}
              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <div className="flex items-center gap-2 ml-4">
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
                        disabled={deleteScriptMutation.isPending}
                      >
                        {deleteScriptMutation.isPending ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <Trash className="h-4 w-4" /> Confirm Delete
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="inline-flex items-center gap-1 bg-slate-600 text-white py-2 px-3 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash className="h-4 w-4" /> Delete Script
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <span className="text-[#94a3b8] text-sm">
              Last Updated: {format(new Date(script.lastUpdated), 'MMMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDetailModal;
