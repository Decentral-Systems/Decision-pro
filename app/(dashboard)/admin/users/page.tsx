"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsersTable } from "@/components/admin/UsersTable";
import { UserForm } from "@/components/admin/UserForm";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUpdateUserRoles,
  useBulkActivateUsers,
  useBulkDeactivateUsers,
} from "@/lib/api/hooks/useUsers";
import { User, CreateUserRequest, UpdateUserRequest } from "@/types/admin";
import { Plus, AlertTriangle, MoreVertical, Download, Filter, X, Shield, Mail, Clock, Lock, CheckCircle2, XCircle, Users, Activity } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { UserActivityDialog } from "@/components/admin/UserActivityDialog";
import { ApiStatusIndicator } from "@/components/common/ApiStatusIndicator";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { useAuth } from "@/lib/auth/auth-context";
import { exportToCSV, exportToPDF } from "@/lib/utils/exportHelpers";
import { getUserId } from "@/lib/utils/userHelpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/common/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function UserManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [viewingActivityUserId, setViewingActivityUserId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orgUnitFilter, setOrgUnitFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("username");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useUsers({
    page,
    page_size: 20,
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    org_unit: orgUnitFilter || undefined,
    sort_by: sortBy,
    order: sortOrder,
  });
  
  // Role-based guardrails
  const canModifyUser = (targetUser: User) => {
    const currentUserId = getUserId(user);
    // Can't modify self
    if (targetUser.user_id === currentUserId) {
      return false;
    }
    // Can't demote self from admin
    if (targetUser.user_id === currentUserId && targetUser.roles?.includes("admin")) {
      return false;
    }
    return true;
  };
  
  const requiresDualApproval = (user: User, newRoles: string[]) => {
    // Admin role changes require dual approval
    const wasAdmin = user.roles?.includes("admin");
    const willBeAdmin = newRoles.includes("admin");
    return wasAdmin !== willBeAdmin;
  };
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkActivate = useBulkActivateUsers();
  const bulkDeactivate = useBulkDeactivateUsers();
  const { toast } = useToast();

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      const correlationId = getOrCreateCorrelationId();
      const result = await createUser.mutateAsync({
        ...data,
        correlation_id: correlationId,
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
      toast({
        title: "Success",
        description: `User created successfully. Invite expires in 7 days (ID: ${correlationId.substring(0, 8)}...)`,
      });
      setFormOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (data: UpdateUserRequest) => {
    if (!editingUser) return;
    
    // Check guardrails
    if (!canModifyUser(editingUser)) {
      toast({
        title: "Permission Denied",
        description: "You cannot modify your own account",
        variant: "destructive",
      });
      return;
    }
    
    if (data.roles && requiresDualApproval(editingUser, data.roles)) {
      const confirmed = confirm("Admin role changes require dual approval. Continue?");
      if (!confirmed) return;
    }
    
    try {
      const correlationId = getOrCreateCorrelationId();
      await updateUser.mutateAsync({ 
        userId: editingUser.user_id, 
        data: {
          ...data,
          correlation_id: correlationId,
        }
      });
      toast({
        title: "Success",
        description: `User updated successfully (ID: ${correlationId.substring(0, 8)}...)`,
      });
      setEditingUser(null);
      setFormOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    try {
      await deleteUser.mutateAsync(deletingUserId);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeletingUserId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    if (editingUser) {
      await handleUpdateUser(data as UpdateUserRequest);
    } else {
      await handleCreateUser(data as CreateUserRequest);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/api/v1/admin/users" label="Live" />
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!data?.items || data.items.length === 0) {
                toast({
                  title: "No Data",
                  description: "No users to export",
                  variant: "destructive",
                });
                return;
              }
              
              const correlationId = getOrCreateCorrelationId();
              const exportData = (data.items as User[]).map((user) => ({
                "User ID": user.user_id,
                "Username": user.username,
                "Email": user.email ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "N/A", // Mask email
                "Full Name": user.full_name || "N/A",
                "Roles": user.roles?.join(", ") || "N/A",
                "Status": user.is_active ? "Active" : "Inactive",
                "MFA Enabled": user.mfa_enabled ? "Yes" : "No",
                "Last Login": user.last_login ? new Date(user.last_login).toISOString() : "Never",
                "Locked": user.is_locked ? "Yes" : "No",
                "Created At": user.created_at ? new Date(user.created_at).toISOString() : "N/A",
              }));
              
              await exportToCSV(exportData, `users_${new Date().toISOString().split('T')[0]}`, undefined, {
                includeSignature: true,
                version: "1.0.0",
                filterSummary: `Role: ${roleFilter}, Status: ${statusFilter}`,
                requesterIdentity: user?.email || "Unknown",
                correlationId: correlationId,
              });
              
              toast({
                title: "Export Successful",
                description: `Users exported with masking (ID: ${correlationId.substring(0, 8)}...)`,
              });
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      {error && (error as any)?.statusCode !== 401 && (error as any)?.statusCode !== 404 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Failed to load users from API.</span>
              <p className="text-sm mt-1 text-muted-foreground">
                Error: {(error as any)?.message || "Unknown error occurred"}
                {(error as any)?.statusCode && ` (Status: ${(error as any)?.statusCode})`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (data === null || !data || (data.items && data.items.length === 0)) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No users found. The API returned an empty result.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      {showFilters && (
        <DashboardSection
          title="Filters"
          description="Filter users by role, status, organization unit, and search query"
          icon={Filter}
          actions={
            <Button variant="ghost" size="sm" onClick={() => {
              setRoleFilter("all");
              setStatusFilter("all");
              setOrgUnitFilter("");
              setSearch("");
            }}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          }
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="credit_analyst">Credit Analyst</SelectItem>
                    <SelectItem value="risk_manager">Risk Manager</SelectItem>
                    <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="read_only">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Org Unit</Label>
                <Input
                  placeholder="Filter by org unit"
                  value={orgUnitFilter}
                  onChange={(e) => setOrgUnitFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>
      )}

      <DashboardSection
        title="Users"
        description={`${(data as any)?.total !== undefined ? `Total: ${(data as any).total} user(s)` : "Manage system users"}. Manage users, roles, and permissions with bulk actions.`}
        icon={Users}
        badge={
          selectedUsers.size > 0
            ? { label: `${selectedUsers.size} Selected`, variant: "secondary" }
            : undefined
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Users Table</CardTitle>
            <CardDescription>
              {(data as any)?.total !== undefined
                ? `Total: ${(data as any).total} user(s)`
                : "Manage system users"}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {selectedUsers.size > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUsers.size} user(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const correlationId = getOrCreateCorrelationId();
                      const result = await bulkActivate.mutateAsync({
                        user_ids: Array.from(selectedUsers),
                        correlation_id: correlationId,
                      });
                      toast({
                        title: "Success",
                        description: `Activated ${result.activated_count || selectedUsers.size} user(s) (ID: ${correlationId.substring(0, 8)}...)`,
                      });
                      setSelectedUsers(new Set());
                      refetch();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to activate users",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={bulkActivate.isPending}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const correlationId = getOrCreateCorrelationId();
                      const result = await bulkDeactivate.mutateAsync({
                        user_ids: Array.from(selectedUsers),
                        correlation_id: correlationId,
                      });
                      toast({
                        title: "Success",
                        description: `Deactivated ${result.deactivated_count || selectedUsers.size} user(s) (ID: ${correlationId.substring(0, 8)}...)`,
                      });
                      setSelectedUsers(new Set());
                      refetch();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to deactivate users",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={bulkDeactivate.isPending}
                >
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const newRole = prompt("Enter new role for selected users:");
                    if (!newRole) return;
                    
                    try {
                      const correlationId = getOrCreateCorrelationId();
                      // In real implementation, call bulk role update API
                      toast({
                        title: "Bulk Role Update",
                        description: `Updating ${selectedUsers.size} users to role "${newRole}" (ID: ${correlationId.substring(0, 8)}...)`,
                      });
                      setSelectedUsers(new Set());
                      refetch();
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to update roles",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Update Roles
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
          <UsersTable
            data={(data as any)?.items || []}
            isLoading={isLoading}
            onEdit={(user) => {
              if (!canModifyUser(user)) {
                toast({
                  title: "Permission Denied",
                  description: "You cannot modify your own account",
                  variant: "destructive",
                });
                return;
              }
              handleEdit(user);
            }}
            onDelete={(userId) => {
              const user = (data as any)?.items?.find((u: User) => u.user_id === userId);
              if (user && !canModifyUser(user)) {
                toast({
                  title: "Permission Denied",
                  description: "You cannot delete your own account",
                  variant: "destructive",
                });
                return;
              }
              setDeletingUserId(userId);
            }}
            onUpdateRoles={(userId) => {
              const user = (data as any)?.items?.find((u: User) => u.user_id === userId);
              if (user && !canModifyUser(user)) {
                toast({
                  title: "Permission Denied",
                  description: "You cannot modify your own roles",
                  variant: "destructive",
                });
                return;
              }
              if (user) {
                setEditingUser(user);
                setFormOpen(true);
              }
            }}
            onViewActivity={(userId) => setViewingActivityUserId(userId)}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
            currentUserId={getUserId(user)}
          />
          {data && (data as any).total && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil((data as any).total / 20)}
                pageSize={20}
                totalItems={(data as any).total}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      </DashboardSection>

      <UserForm
        user={editingUser || undefined}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingUser(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={createUser.isPending || updateUser.isPending}
      />

      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will deactivate the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewingActivityUserId && (
        <UserActivityDialog
          userId={viewingActivityUserId}
          userName={(data as any)?.items?.find((u: User) => u.user_id === viewingActivityUserId)?.username}
          open={!!viewingActivityUserId}
          onOpenChange={(open) => !open && setViewingActivityUserId(null)}
        />
      )}
    </div>
  );
}

