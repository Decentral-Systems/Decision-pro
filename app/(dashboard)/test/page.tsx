"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  testDashboardSections,
  testIconsDisplay,
  testResponsiveDesign,
  measurePagePerformance,
  testKeyboardNavigation,
  validateSpacing,
  runPageTest,
} from "@/lib/utils/test-helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [responsiveInfo, setResponsiveInfo] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    // Get responsive info
    setResponsiveInfo(testResponsiveDesign());
    
    // Measure performance
    const perf = measurePagePerformance();
    setPerformanceData(perf);
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runPageTest(window.location.pathname);
      setTestResults(results);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const functionalTests = {
    sectionsRender: testDashboardSections(),
    iconsDisplay: testIconsDisplay(),
    keyboardNavigation: testKeyboardNavigation(),
  };

  const visualTests = validateSpacing();

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testing & Validation</h1>
          <p className="text-muted-foreground">
            Comprehensive testing dashboard for UI/UX enhancements
          </p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            "Run All Tests"
          )}
        </Button>
      </div>

      <Tabs defaultValue="functional" className="space-y-4">
        <TabsList>
          <TabsTrigger value="functional">Functional Tests</TabsTrigger>
          <TabsTrigger value="visual">Visual Tests</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="responsive">Responsive Design</TabsTrigger>
        </TabsList>

        <TabsContent value="functional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Functional Tests</CardTitle>
              <CardDescription>Test core functionality across pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Dashboard Sections</p>
                    <p className="text-sm text-muted-foreground">
                      All sections render correctly
                    </p>
                  </div>
                  {functionalTests.sectionsRender ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Icons Display</p>
                    <p className="text-sm text-muted-foreground">
                      All icons render correctly
                    </p>
                  </div>
                  {functionalTests.iconsDisplay ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Keyboard Navigation</p>
                    <p className="text-sm text-muted-foreground">
                      Keyboard navigation works
                    </p>
                  </div>
                  {functionalTests.keyboardNavigation ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual Consistency Tests</CardTitle>
              <CardDescription>Check visual design consistency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Spacing Consistency</p>
                  <p className="text-sm text-muted-foreground">
                    All sections have consistent spacing
                  </p>
                  {visualTests.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {visualTests.issues.map((issue: string, i: number) => (
                        <p key={i} className="text-xs text-yellow-600">
                          {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                {visualTests.consistent ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Page load and render performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceData && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Load Time</p>
                    <p className="text-2xl font-bold">
                      {(performanceData.loadTime / 1000).toFixed(2)}s
                    </p>
                    {performanceData.loadTime < 3000 ? (
                      <Badge variant="default" className="mt-2">Good</Badge>
                    ) : (
                      <Badge variant="destructive" className="mt-2">Slow</Badge>
                    )}
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Render Time</p>
                    <p className="text-2xl font-bold">
                      {(performanceData.renderTime / 1000).toFixed(2)}s
                    </p>
                    {performanceData.renderTime < 2000 ? (
                      <Badge variant="default" className="mt-2">Good</Badge>
                    ) : (
                      <Badge variant="destructive" className="mt-2">Slow</Badge>
                    )}
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">DOM Ready</p>
                    <p className="text-2xl font-bold">
                      {(performanceData.domContentLoaded / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responsive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Design</CardTitle>
              <CardDescription>Current viewport information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {responsiveInfo && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Mobile</p>
                    <p className="text-2xl font-bold">
                      {responsiveInfo.mobile ? "Yes" : "No"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      &lt; 768px
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Tablet</p>
                    <p className="text-2xl font-bold">
                      {responsiveInfo.tablet ? "Yes" : "No"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      768px - 1024px
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Desktop</p>
                    <p className="text-2xl font-bold">
                      {responsiveInfo.desktop ? "Yes" : "No"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      &gt; 1024px
                    </p>
                  </div>
                </div>
              )}
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Current Viewport</p>
                <p className="text-xs text-muted-foreground">
                  Width: {typeof window !== 'undefined' ? window.innerWidth : 0}px
                </p>
                <p className="text-xs text-muted-foreground">
                  Height: {typeof window !== 'undefined' ? window.innerHeight : 0}px
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Detailed test results for current page</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
