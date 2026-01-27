"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: "number" | "currency" | "percentage";
}

export function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  format = "number",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Intersection Observer to trigger animation when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  // Animate the counter
  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    const endValue = value;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = startValue + (endValue - startValue) * easeOutQuart;

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, isInView]);

  const formatValue = (val: number): string => {
    const formatted = val.toFixed(decimals);
    
    switch (format) {
      case "currency":
        return `${prefix}$${Number(formatted).toLocaleString()}${suffix}`;
      case "percentage":
        return `${prefix}${formatted}%${suffix}`;
      default:
        return `${prefix}${Number(formatted).toLocaleString()}${suffix}`;
    }
  };

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {formatValue(count)}
    </span>
  );
}

// Animated stat card component
interface AnimatedStatCardProps {
  label: string;
  value: number;
  format?: "number" | "currency" | "percentage";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function AnimatedStatCard({
  label,
  value,
  format = "number",
  trend,
  icon,
  className,
}: AnimatedStatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold">
          <AnimatedCounter value={value} format={format} decimals={format === "percentage" ? 1 : 0} />
        </p>
        {trend && (
          <p className={cn(
            "text-xs font-medium flex items-center gap-1",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <AnimatedCounter value={Math.abs(trend.value)} format="percentage" decimals={1} />
            <span className="text-muted-foreground">from last period</span>
          </p>
        )}
      </div>
    </div>
  );
}
