"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, CreateUserRequest, UpdateUserRequest } from "@/types/admin";
import { UserRole } from "@/types/user";

const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  full_name: z.string().optional(),
  roles: z.array(z.nativeEnum(UserRole)).min(1, "At least one role is required"),
  is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  isLoading?: boolean;
}

export function UserForm({ user, open, onOpenChange, onSubmit, isLoading }: UserFormProps) {
  const isEditMode = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
          username: user.username,
          email: user.email,
          full_name: user.full_name || "",
          roles: user.roles,
          is_active: user.is_active,
        }
      : {
          roles: [],
          is_active: true,
        },
    values: user
      ? {
          username: user.username,
          email: user.email,
          full_name: user.full_name || "",
          roles: user.roles,
          is_active: user.is_active,
        }
      : undefined,
  });

  const selectedRoles = watch("roles");

  const handleRoleToggle = (role: UserRole) => {
    const currentRoles = selectedRoles || [];
    if (currentRoles.includes(role)) {
      setValue("roles", currentRoles.filter((r) => r !== role));
    } else {
      setValue("roles", [...currentRoles, role]);
    }
  };

  const onFormSubmit = async (data: UserFormData) => {
    if (isEditMode) {
      const updateData: UpdateUserRequest = {
        email: data.email,
        full_name: data.full_name,
        roles: data.roles,
        is_active: data.is_active,
      };
      await onSubmit(updateData);
    } else {
      if (!data.password) {
        return; // Should not happen due to schema validation
      }
      const createData: CreateUserRequest = {
        username: data.username,
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        roles: data.roles,
      };
      await onSubmit(createData);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update user information and roles."
              : "Create a new user account with roles and permissions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                {...register("username")}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register("full_name")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Roles *</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(UserRole).map((role) => (
                <div
                  key={role}
                  className={`flex items-center space-x-2 p-2 border rounded cursor-pointer ${
                    selectedRoles?.includes(role)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => handleRoleToggle(role)}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles?.includes(role) || false}
                    onChange={() => handleRoleToggle(role)}
                    className="cursor-pointer"
                  />
                  <label className="cursor-pointer text-sm font-medium capitalize">
                    {role.replace("_", " ")}
                  </label>
                </div>
              ))}
            </div>
            {errors.roles && (
              <p className="text-sm text-destructive">{errors.roles.message}</p>
            )}
          </div>

          {isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={watch("is_active") ? "active" : "inactive"}
                onValueChange={(value) => setValue("is_active", value === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditMode ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


