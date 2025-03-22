import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreHorizontal, Ban, Edit, Shield, User, Search, UserPlus, TrashIcon, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { User as UserType } from '@shared/schema';

// Helper function to get role badge styling
const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return <Badge className="bg-red-500">Admin</Badge>;
    case 'moderator':
      return <Badge className="bg-blue-500">Moderator</Badge>;
    default:
      return <Badge variant="outline">User</Badge>;
  }
};

// Get user initials for avatar fallback
const getUserInitials = (username: string) => {
  return username?.slice(0, 2).toUpperCase() || 'U';
};

export default function EnhancedUserManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('7');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [filter, setFilter] = useState('all');
  const perPage = 10;

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/users', filter],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason, duration }: { userId: number, reason: string, duration: string }) => {
      return apiRequest('POST', `/api/admin/users/${userId}/ban`, { reason, duration });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User banned',
        description: `User ${selectedUser?.username} has been banned.`,
      });
      setShowBanDialog(false);
      setBanReason('');
      setBanDuration('7');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to ban user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('POST', `/api/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User unbanned',
        description: `User ${selectedUser?.username} has been unbanned.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to unban user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Change user role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number, role: string }) => {
      return apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Role updated',
        description: `User ${selectedUser?.username}'s role has been changed to ${selectedRole}.`,
      });
      setShowRoleDialog(false);
      setSelectedRole('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update role: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: `User ${selectedUser?.username} has been permanently deleted.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Filter and paginate users
  const filteredUsers = data?.users?.filter((user: UserType) => {
    // First apply role filter
    if (filter !== 'all' && user.role !== filter) return false;
    
    // Then apply search filter if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query))
      );
    }
    return true;
  }) || [];

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Open ban dialog
  const openBanDialog = (user: UserType) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDuration('7');
    setShowBanDialog(true);
  };

  // Open role dialog
  const openRoleDialog = (user: UserType) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowRoleDialog(true);
  };

  // Handle ban user
  const handleBanUser = () => {
    if (!selectedUser || !banReason) return;
    banUserMutation.mutate({
      userId: selectedUser.id,
      reason: banReason,
      duration: banDuration
    });
  };

  // Handle unban user
  const handleUnbanUser = (user: UserType) => {
    setSelectedUser(user);
    unbanUserMutation.mutate(user.id);
  };

  // Handle role change
  const handleRoleChange = () => {
    if (!selectedUser || !selectedRole) return;
    changeRoleMutation.mutate({
      userId: selectedUser.id,
      role: selectedRole
    });
  };

  // Handle delete user
  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    deleteUserMutation.mutate(user.id);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage user accounts, roles, and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="user">Regular Users</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="banned">Banned Users</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="whitespace-nowrap">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the platform
                  </DialogDescription>
                </DialogHeader>
                
                <form className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Enter username" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input id="email" type="email" placeholder="Enter email" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Create strong password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue="user">
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Regular User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </form>
                
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Users table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user: UserType) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                          <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email || 'No email'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {user.isBanned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" /> Banned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openRoleDialog(user)} className="gap-2">
                            <Shield className="h-4 w-4" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isBanned ? (
                            <DropdownMenuItem onClick={() => handleUnbanUser(user)} className="gap-2">
                              <Ban className="h-4 w-4" /> Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => openBanDialog(user)} className="text-red-500 gap-2">
                              <Ban className="h-4 w-4" /> Ban User
                            </DropdownMenuItem>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 gap-2"
                              >
                                <TrashIcon className="h-4 w-4" /> Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the user account and all associated data.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
      
      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Banning a user will prevent them from logging in or using the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedUser?.avatarUrl || undefined} alt={selectedUser?.username} />
                <AvatarFallback>{selectedUser?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedUser?.username}</div>
                <div className="text-xs text-muted-foreground">{selectedUser?.email || 'No email'}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Ban Reason</Label>
              <Textarea 
                id="ban-reason" 
                placeholder="Provide a reason for banning this user"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ban-duration" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Ban Duration
              </Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleBanUser}
              disabled={!banReason || banUserMutation.isPending}
            >
              {banUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role and permissions for this user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedUser?.avatarUrl || undefined} alt={selectedUser?.username} />
                <AvatarFallback>{selectedUser?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedUser?.username}</div>
                <div className="text-xs text-muted-foreground">{selectedUser?.email || 'No email'}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="mt-3 text-sm">
                <p className="font-medium mb-1">Permissions:</p>
                <ul className="space-y-1 text-muted-foreground">
                  {selectedRole === 'admin' && (
                    <>
                      <li>• Full access to all site features</li>
                      <li>• Can manage all users and content</li>
                      <li>• Can configure site settings</li>
                      <li>• Can create moderator accounts</li>
                    </>
                  )}
                  {selectedRole === 'moderator' && (
                    <>
                      <li>• Can review and approve content</li>
                      <li>• Can moderate comments</li>
                      <li>• Can temporarily ban users</li>
                      <li>• Cannot access admin settings</li>
                    </>
                  )}
                  {selectedRole === 'user' && (
                    <>
                      <li>• Can upload scripts</li>
                      <li>• Can comment and rate content</li>
                      <li>• No moderation abilities</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRoleChange}
              disabled={!selectedRole || selectedRole === selectedUser?.role || changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}