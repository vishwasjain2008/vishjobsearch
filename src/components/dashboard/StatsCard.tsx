import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: "primary" | "success" | "warning" | "destructive";
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon: Icon, trend, color = "primary" }) => {
  const colorMap = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-success/10 text-score-high",
    warning: "bg-warning/10 text-score-medium",
    destructive: "bg-destructive/10 text-score-low",
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-black text-foreground mt-1 leading-none">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium",
                trend > 0 ? "text-score-high" : trend < 0 ? "text-score-low" : "text-muted-foreground"
              )}>
                {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {Math.abs(trend)}% vs last week
              </div>
            )}
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
