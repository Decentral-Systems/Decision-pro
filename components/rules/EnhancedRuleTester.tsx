"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Upload, 
  Download, 
  Save, 
  Trash2, 
  Plus, 
  BarChart3, 
  History, 
  TestTube,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface TestCase {
  id: string;
  name: string;
  description?: string;
  inputData: Record<string, any>;
  expectedOutput?: Record<string, any>;
  tags: string[];
  createdAt: string;
}

interface TestSuite {
  id: string;
  name: string;
  description?: string;
  testCases: TestCase[];
  createdAt: string;
  lastRun?: string;
}

interface TestResult {
  testCaseId: string;
  testCaseName: string;
  status: 'passed' | 'failed' | 'error';
  actualOutput: Record<string, any>;
  expectedOutput?: Record<string, any>;
  executionTime: number;
  error?: string;
  timestamp: string;
}

interface BatchTestResult {
  id: string;
  testSuiteId: string;
  testSuiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorTests: number;
  totalExecutionTime: number;
  results: TestResult[];
  timestamp: string;
}

interface EnhancedRuleTesterProps {
  onClose?: () => void;
}

export function EnhancedRuleTester({ onClose }: EnhancedRuleTesterProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("single");
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedTestSuite, setSelectedTestSuite] = useState<string>("");
  const [testResults, setTestResults] = useState<BatchTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState("");

  // Single test state
  const [singleTestData, setSingleTestData] = useState({
    customer_id: "TEST_001",
    loan_amount: 50000,
    monthly_income: 15000,
    loan_term_months: 24,
    credit_score: 750,
    employment_status: "employed",
    employment_years: 3
  });

  // Test case creation state
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    name: "",
    description: "",
    inputData: {},
    expectedOutput: {},
    tags: []
  });

  // Historical data testing state
  const [historicalDataFile, setHistoricalDataFile] = useState<File | null>(null);
  const [historicalTestProgress, setHistoricalTestProgress] = useState(0);

  useEffect(() => {
    // Load test suites from localStorage
    const savedTestSuites = localStorage.getItem("ais-rule-test-suites");
    if (savedTestSuites) {
      setTestSuites(JSON.parse(savedTestSuites));
    }

    // Load test results from localStorage
    const savedTestResults = localStorage.getItem("ais-rule-test-results");
    if (savedTestResults) {
      setTestResults(JSON.parse(savedTestResults));
    }
  }, []);

  const saveTestSuites = (suites: TestSuite[]) => {
    setTestSuites(suites);
    localStorage.setItem("ais-rule-test-suites", JSON.stringify(suites));
  };

  const saveTestResults = (results: BatchTestResult[]) => {
    setTestResults(results);
    localStorage.setItem("ais-rule-test-results", JSON.stringify(results));
  };

  const runSingleTest = async () => {
    setIsRunning(true);
    setCurrentTest("Single Test");
    
    try {
      // Simulate API call to test rule
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = {
        approved: true,
        credit_score: 750,
        risk_level: "low",
        interest_rate: 15.5,
        max_loan_amount: 200000,
        processing_time: 150
      };

      toast({
        title: "Test Completed",
        description: "Single test executed successfully",
      });

      return result;
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Error executing single test",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  };

  const runBatchTests = async (testSuiteId: string) => {
    const testSuite = testSuites.find(suite => suite.id === testSuiteId);
    if (!testSuite) return;

    setIsRunning(true);
    setProgress(0);
    
    const results: TestResult[] = [];
    const totalTests = testSuite.testCases.length;
    
    for (let i = 0; i < testSuite.testCases.length; i++) {
      const testCase = testSuite.testCases[i];
      setCurrentTest(testCase.name);
      setProgress((i / totalTests) * 100);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const actualOutput = {
          approved: Math.random() > 0.2,
          credit_score: Math.floor(Math.random() * 400) + 600,
          risk_level: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
          interest_rate: Math.random() * 10 + 12,
          processing_time: Math.floor(Math.random() * 200) + 50
        };

        const status = testCase.expectedOutput 
          ? (JSON.stringify(actualOutput) === JSON.stringify(testCase.expectedOutput) ? 'passed' : 'failed')
          : 'passed';

        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          status,
          actualOutput,
          expectedOutput: testCase.expectedOutput,
          executionTime: Math.floor(Math.random() * 200) + 50,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          testCaseName: testCase.name,
          status: 'error',
          actualOutput: {},
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    setProgress(100);
    
    const batchResult: BatchTestResult = {
      id: Date.now().toString(),
      testSuiteId: testSuite.id,
      testSuiteName: testSuite.name,
      totalTests: results.length,
      passedTests: results.filter(r => r.status === 'passed').length,
      failedTests: results.filter(r => r.status === 'failed').length,
      errorTests: results.filter(r => r.status === 'error').length,
      totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
      results,
      timestamp: new Date().toISOString()
    };

    const updatedResults = [batchResult, ...testResults];
    saveTestResults(updatedResults);

    setIsRunning(false);
    setCurrentTest("");
    setProgress(0);

    toast({
      title: "Batch Test Completed",
      description: `${batchResult.passedTests}/${batchResult.totalTests} tests passed`,
    });
  };

  const createTestCase = () => {
    if (!newTestCase.name) {
      toast({
        title: "Error",
        description: "Test case name is required",
        variant: "destructive",
      });
      return;
    }

    const testCase: TestCase = {
      id: Date.now().toString(),
      name: newTestCase.name,
      description: newTestCase.description,
      inputData: newTestCase.inputData || {},
      expectedOutput: newTestCase.expectedOutput,
      tags: newTestCase.tags || [],
      createdAt: new Date().toISOString()
    };

    // Add to default test suite or create new one
    let targetSuite = testSuites.find(suite => suite.name === "Default");
    if (!targetSuite) {
      targetSuite = {
        id: "default",
        name: "Default",
        description: "Default test suite",
        testCases: [],
        createdAt: new Date().toISOString()
      };
      saveTestSuites([targetSuite, ...testSuites]);
    }

    targetSuite.testCases.push(testCase);
    const updatedSuites = testSuites.map(suite => 
      suite.id === targetSuite!.id ? targetSuite! : suite
    );
    saveTestSuites(updatedSuites);

    // Reset form
    setNewTestCase({
      name: "",
      description: "",
      inputData: {},
      expectedOutput: {},
      tags: []
    });

    toast({
      title: "Test Case Created",
      description: `Test case "${testCase.name}" added to ${targetSuite.name}`,
    });
  };

  const runHistoricalDataTest = async () => {
    if (!historicalDataFile) {
      toast({
        title: "Error",
        description: "Please select a historical data file",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setHistoricalTestProgress(0);
    setCurrentTest("Historical Data Analysis");

    try {
      // Simulate processing historical data
      for (let i = 0; i <= 100; i += 10) {
        setHistoricalTestProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: "Historical Test Completed",
        description: "Historical data analysis completed successfully",
      });
    } catch (error) {
      toast({
        title: "Historical Test Failed",
        description: "Error processing historical data",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setHistoricalTestProgress(0);
      setCurrentTest("");
    }
  };

  const exportTestResults = (resultId: string) => {
    const result = testResults.find(r => r.id === resultId);
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `test-results-${result.testSuiteName}-${new Date(result.timestamp).toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="single">Single Test</TabsTrigger>
          <TabsTrigger value="batch">Batch Testing</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="cases">Test Cases</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Single Rule Test
              </CardTitle>
              <CardDescription>
                Test a rule with custom input data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer ID</Label>
                  <Input
                    id="customer_id"
                    value={singleTestData.customer_id}
                    onChange={(e) => setSingleTestData(prev => ({
                      ...prev,
                      customer_id: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan_amount">Loan Amount (ETB)</Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    value={singleTestData.loan_amount}
                    onChange={(e) => setSingleTestData(prev => ({
                      ...prev,
                      loan_amount: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_income">Monthly Income (ETB)</Label>
                  <Input
                    id="monthly_income"
                    type="number"
                    value={singleTestData.monthly_income}
                    onChange={(e) => setSingleTestData(prev => ({
                      ...prev,
                      monthly_income: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan_term_months">Loan Term (Months)</Label>
                  <Input
                    id="loan_term_months"
                    type="number"
                    value={singleTestData.loan_term_months}
                    onChange={(e) => setSingleTestData(prev => ({
                      ...prev,
                      loan_term_months: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_score">Credit Score</Label>
                  <Input
                    id="credit_score"
                    type="number"
                    value={singleTestData.credit_score}
                    onChange={(e) => setSingleTestData(prev => ({
                      ...prev,
                      credit_score: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_status">Employment Status</Label>
                  <Select
                    value={singleTestData.employment_status}
                    onValueChange={(value) => setSingleTestData(prev => ({
                      ...prev,
                      employment_status: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">Self Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                  {isRunning && currentTest === "Single Test" && "Running test..."}
                </div>
                <Button 
                  onClick={runSingleTest} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Batch Testing
              </CardTitle>
              <CardDescription>
                Run multiple test cases against rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="test-suite">Select Test Suite</Label>
                  <Select value={selectedTestSuite} onValueChange={setSelectedTestSuite}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a test suite" />
                    </SelectTrigger>
                    <SelectContent>
                      {testSuites.map((suite) => (
                        <SelectItem key={suite.id} value={suite.id}>
                          {suite.name} ({suite.testCases.length} tests)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => selectedTestSuite && runBatchTests(selectedTestSuite)}
                  disabled={!selectedTestSuite || isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Batch
                </Button>
              </div>

              {isRunning && progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Running: {currentTest}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {testSuites.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test suites available</p>
                  <p className="text-sm">Create test cases to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historical Data Testing
              </CardTitle>
              <CardDescription>
                Test rules against historical loan application data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="historical-file">Upload Historical Data (CSV/JSON)</Label>
                  <Input
                    id="historical-file"
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => setHistoricalDataFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a CSV or JSON file with historical loan application data
                  </p>
                </div>

                {historicalTestProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing historical data...</span>
                      <span>{historicalTestProgress}%</span>
                    </div>
                    <Progress value={historicalTestProgress} />
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {historicalDataFile ? `Selected: ${historicalDataFile.name}` : "No file selected"}
                  </div>
                  <Button 
                    onClick={runHistoricalDataTest}
                    disabled={!historicalDataFile || isRunning}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Analyze Historical Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Test Case Management
              </CardTitle>
              <CardDescription>
                Create and manage test cases for batch testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case-name">Test Case Name</Label>
                  <Input
                    id="case-name"
                    value={newTestCase.name || ""}
                    onChange={(e) => setNewTestCase(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="e.g., High Income Low Risk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-tags">Tags (comma-separated)</Label>
                  <Input
                    id="case-tags"
                    value={newTestCase.tags?.join(", ") || ""}
                    onChange={(e) => setNewTestCase(prev => ({
                      ...prev,
                      tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
                    }))}
                    placeholder="e.g., high-income, low-risk"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-description">Description</Label>
                <Textarea
                  id="case-description"
                  value={newTestCase.description || ""}
                  onChange={(e) => setNewTestCase(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Describe what this test case validates..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-input">Input Data (JSON)</Label>
                <Textarea
                  id="case-input"
                  value={JSON.stringify(newTestCase.inputData, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setNewTestCase(prev => ({
                        ...prev,
                        inputData: parsed
                      }));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"customer_id": "TEST_001", "loan_amount": 50000, ...}'
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-expected">Expected Output (JSON, optional)</Label>
                <Textarea
                  id="case-expected"
                  value={JSON.stringify(newTestCase.expectedOutput, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setNewTestCase(prev => ({
                        ...prev,
                        expectedOutput: parsed
                      }));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"approved": true, "credit_score": 750, ...}'
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={createTestCase} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Test Case
                </Button>
              </div>
            </CardContent>
          </Card>

          {testSuites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Test Suites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testSuites.map((suite) => (
                    <div key={suite.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{suite.name}</h4>
                          {suite.description && (
                            <p className="text-sm text-muted-foreground">{suite.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {suite.testCases.length} tests
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(suite.createdAt).toLocaleDateString()}
                        {suite.lastRun && (
                          <span className="ml-4">
                            Last run: {new Date(suite.lastRun).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Test Results History
              </CardTitle>
              <CardDescription>
                View and analyze test execution results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results available</p>
                  <p className="text-sm">Run some tests to see results here</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {testResults.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{result.testSuiteName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportTestResults(result.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {result.passedTests}
                            </div>
                            <div className="text-xs text-muted-foreground">Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {result.failedTests}
                            </div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {result.errorTests}
                            </div>
                            <div className="text-xs text-muted-foreground">Errors</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {result.totalExecutionTime}ms
                            </div>
                            <div className="text-xs text-muted-foreground">Total Time</div>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Test Case</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Execution Time</TableHead>
                              <TableHead>Result</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.results.slice(0, 5).map((testResult) => (
                              <TableRow key={testResult.testCaseId}>
                                <TableCell>{testResult.testCaseName}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(testResult.status)}
                                    <span className="capitalize">{testResult.status}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{testResult.executionTime}ms</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {testResult.error || JSON.stringify(testResult.actualOutput)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {result.results.length > 5 && (
                          <div className="text-center mt-2 text-sm text-muted-foreground">
                            ... and {result.results.length - 5} more results
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}