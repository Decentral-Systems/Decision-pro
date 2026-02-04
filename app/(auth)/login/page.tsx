"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema, LoginFormData } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { NetworkStatusIndicator } from "@/components/common/NetworkStatusIndicator";

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Use auth error if available, otherwise use local error
  // CRITICAL FIX: authError has better network error detection
  const displayError = authError?.message || error;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update local error when auth error changes
  useEffect(() => {
    if (authError) {
      setError(authError.message);
    }
  }, [authError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.username, data.password);
      navigateTo("/dashboard");
    } catch (err: any) {
      // CRITICAL FIX: Use error from auth context which has proper network error detection
      // The auth context now provides better error messages for network vs auth errors
      const errorMessage = authError?.message || err?.message || "Login failed";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="h-[500px] w-full max-w-md animate-pulse rounded-2xl border bg-card shadow-xl"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/2 -top-1/2 h-full w-full rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full bg-primary/10 blur-3xl"></div>
      </div>

      <Card className="relative z-10 w-full max-w-md border-border/50 bg-card/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-8">
          {/* Network Status Indicator: browserOnly to avoid false "Offline" when /health fails (CORS, etc.) */}
          <div className="flex justify-end">
            <NetworkStatusIndicator variant="minimal" browserOnly />
          </div>

          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white p-3 shadow-lg">
              <Image
                src="/logo.png"
                alt="Decision PRO"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title Section */}
          <div className="space-y-2 text-center">
            <CardTitle className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold text-transparent">
              Decision PRO
            </CardTitle>
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              AIS Platform
            </p>
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {displayError && (
              <Alert
                variant={
                  authError?.type === "network" ? "default" : "destructive"
                }
                className="animate-in fade-in slide-in-from-top-2"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {displayError}
                  {authError?.retryable && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      You can try again when your connection is restored.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label for="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                {...register("username")}
                disabled={isLoading}
                className="h-11"
              />
              {errors.username && (
                <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                disabled={isLoading}
                className="h-11"
              />
              {errors.password && (
                <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              loading={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>© 2026 Decision PRO. All rights reserved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
