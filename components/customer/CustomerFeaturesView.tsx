"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeatureImportanceChart } from "@/components/charts/FeatureImportanceChart";
import { extractCustomerFeatures } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { Search } from "lucide-react";

interface CustomerFeaturesViewProps {
  data: Customer360Data;
}

export function CustomerFeaturesView({ data }: CustomerFeaturesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const featureCategories = useMemo(() => extractCustomerFeatures(data), [data]);
  
  // Flatten all features for search
  const allFeatures = useMemo(() => {
    return featureCategories.flatMap((category) =>
      category.features.map((feature) => ({
        ...feature,
        category: category.name,
      }))
    );
  }, [featureCategories]);

  // Filter features based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm && !selectedCategory) return featureCategories;

    return featureCategories
      .filter((category) => !selectedCategory || category.name === selectedCategory)
      .map((category) => ({
        ...category,
        features: category.features.filter((feature) =>
          feature.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((category) => category.features.length > 0);
  }, [featureCategories, searchTerm, selectedCategory]);

  // Prepare feature importance data for chart
  const importanceData = useMemo(() => {
    return allFeatures
      .filter((f) => f.importance !== undefined && f.importance > 0)
      .map((f) => ({
        feature_name: f.name,
        importance_score: f.importance || 0,
      }))
      .sort((a, b) => b.importance_score - a.importance_score)
      .slice(0, 20);
  }, [allFeatures]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") {
      if (value > 1000000) return `${(value / 1000000).toFixed(2)}M`;
      if (value > 1000) return `${(value / 1000).toFixed(2)}K`;
      return value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Feature Importance Chart */}
      {importanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Feature Importance</CardTitle>
            <CardDescription>Most important features for credit scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <FeatureImportanceChart data={importanceData} maxItems={20} />
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>All Customer Features</CardTitle>
          <CardDescription>
            Complete list of {allFeatures.length} features organized by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Badge>
              {featureCategories.map((category) => (
                <Badge
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name} ({category.features.length})
                </Badge>
              ))}
            </div>

            {/* Features by Category */}
            {filteredCategories.map((category) => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.features.length} features</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature Name</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        {category.features.some((f) => f.importance) && (
                          <TableHead className="text-right">Importance</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.features.map((feature, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {feature.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatValue(feature.value)}
                          </TableCell>
                          {category.features.some((f) => f.importance) && (
                            <TableCell className="text-right">
                              {feature.importance ? (
                                <Badge variant="outline">{feature.importance.toFixed(3)}</Badge>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No features found matching your search criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



