"use client";

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Save, 
  Eye, 
  Plus,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Custom Node Components
import { ConditionNode } from './nodes/ConditionNode';
import { ActionNode } from './nodes/ActionNode';
import { LogicalOperatorNode } from './nodes/LogicalOperatorNode';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';

// Types
export interface RuleCondition {
  field: string;
  operator: string;
  value: any;
  type?: string;
}

export interface RuleAction {
  type: string;
  value?: any;
  calculation?: string;
  multiplier?: number;
  parameters?: Record<string, any>;
}

export interface VisualRule {
  rule_name: string;
  product_type: string;
  rule_description: string;
  rule_definition: {
    rule_type: string;
    conditions: RuleCondition[];
    logical_operator: string;
  };
  rule_actions: RuleAction[];
  evaluation_order: number;
  evaluation_scope: string;
  is_active: boolean;
  is_mandatory: boolean;
}

interface VisualRuleBuilderProps {
  initialRule?: VisualRule | null;
  onSave: (rule: VisualRule) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

// Node Types Configuration
const nodeTypes: NodeTypes = {
  condition: ConditionNode,
  action: ActionNode,
  logicalOperator: LogicalOperatorNode,
  start: StartNode,
  end: EndNode,
};

// Initial nodes for a new rule
const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 500, y: 400 },
    data: { label: 'End' },
  },
];

const initialEdges: Edge[] = [];

export function VisualRuleBuilder({ 
  initialRule, 
  onSave, 
  onCancel, 
  mode = 'create' 
}: VisualRuleBuilderProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('condition');
  const [isValidRule, setIsValidRule] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [rulePreview, setRulePreview] = useState<string>('');

  // Rule metadata state
  const [ruleName, setRuleName] = useState(initialRule?.rule_name || '');
  const [productType, setProductType] = useState(initialRule?.product_type || 'personal_loan');
  const [ruleDescription, setRuleDescription] = useState(initialRule?.rule_description || '');
  const [evaluationOrder, setEvaluationOrder] = useState(initialRule?.evaluation_order || 0);
  const [evaluationScope, setEvaluationScope] = useState(initialRule?.evaluation_scope || 'all');
  const [isActive, setIsActive] = useState(initialRule?.is_active ?? true);
  const [isMandatory, setIsMandatory] = useState(initialRule?.is_mandatory ?? false);

  // Load initial rule if provided
  useEffect(() => {
    if (initialRule && mode === 'edit') {
      loadRuleIntoVisualBuilder(initialRule);
    }
  }, [initialRule, mode]);

  // Validate rule whenever nodes or edges change
  useEffect(() => {
    validateRule();
    generateRulePreview();
  }, [nodes, edges, ruleName, productType]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { 
        x: Math.random() * 400 + 200, 
        y: Math.random() * 300 + 200 
      },
      data: getDefaultNodeData(type),
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'end') {
      toast({
        title: "Cannot Delete",
        description: "Start and End nodes cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges, toast]);

  const loadRuleIntoVisualBuilder = (rule: VisualRule) => {
    // Convert JSON rule to visual nodes and edges
    const visualNodes: Node[] = [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: { label: 'Start' },
      }
    ];

    const visualEdges: Edge[] = [];
    let yPosition = 200;
    let lastNodeId = 'start';

    // Add condition nodes
    if (rule.rule_definition.conditions && rule.rule_definition.conditions.length > 0) {
      rule.rule_definition.conditions.forEach((condition, index) => {
        const nodeId = `condition-${index}`;
        visualNodes.push({
          id: nodeId,
          type: 'condition',
          position: { x: 200, y: yPosition },
          data: {
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            type: condition.type || 'string',
          },
        });

        visualEdges.push({
          id: `${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
        });

        lastNodeId = nodeId;
        yPosition += 100;
      });

      // Add logical operator if multiple conditions
      if (rule.rule_definition.conditions.length > 1) {
        const logicalNodeId = 'logical-operator';
        visualNodes.push({
          id: logicalNodeId,
          type: 'logicalOperator',
          position: { x: 350, y: yPosition - 50 },
          data: {
            operator: rule.rule_definition.logical_operator || 'AND',
          },
        });
      }
    }

    // Add action nodes
    if (rule.rule_actions && rule.rule_actions.length > 0) {
      rule.rule_actions.forEach((action, index) => {
        const nodeId = `action-${index}`;
        visualNodes.push({
          id: nodeId,
          type: 'action',
          position: { x: 400, y: yPosition },
          data: {
            actionType: action.type,
            value: action.value,
            calculation: action.calculation,
            multiplier: action.multiplier,
            parameters: action.parameters,
          },
        });

        visualEdges.push({
          id: `${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
        });

        lastNodeId = nodeId;
        yPosition += 100;
      });
    }

    // Add end node
    visualNodes.push({
      id: 'end',
      type: 'end',
      position: { x: 500, y: yPosition },
      data: { label: 'End' },
    });

    visualEdges.push({
      id: `${lastNodeId}-end`,
      source: lastNodeId,
      target: 'end',
    });

    setNodes(visualNodes);
    setEdges(visualEdges);
  };

  const convertVisualRuleToJSON = (): VisualRule => {
    const conditions: RuleCondition[] = [];
    const actions: RuleAction[] = [];

    // Extract conditions from condition nodes
    nodes.forEach((node) => {
      if (node.type === 'condition') {
        conditions.push({
          field: node.data.field || '',
          operator: node.data.operator || '==',
          value: node.data.value || '',
          type: node.data.type || 'string',
        });
      }
    });

    // Extract actions from action nodes
    nodes.forEach((node) => {
      if (node.type === 'action') {
        actions.push({
          type: node.data.actionType || 'set_limit',
          value: node.data.value,
          calculation: node.data.calculation,
          multiplier: node.data.multiplier,
          parameters: node.data.parameters,
        });
      }
    });

    // Get logical operator
    const logicalOperatorNode = nodes.find((node) => node.type === 'logicalOperator');
    const logicalOperator = logicalOperatorNode?.data.operator || 'AND';

    return {
      rule_name: ruleName,
      product_type: productType,
      rule_description: ruleDescription,
      rule_definition: {
        rule_type: 'eligibility', // Default type
        conditions,
        logical_operator: logicalOperator,
      },
      rule_actions: actions,
      evaluation_order: evaluationOrder,
      evaluation_scope: evaluationScope,
      is_active: isActive,
      is_mandatory: isMandatory,
    };
  };

  const validateRule = () => {
    const errors: string[] = [];

    // Basic validation
    if (!ruleName.trim()) {
      errors.push('Rule name is required');
    }

    if (!ruleDescription.trim()) {
      errors.push('Rule description is required');
    }

    // Check for condition nodes
    const conditionNodes = nodes.filter((node) => node.type === 'condition');
    if (conditionNodes.length === 0) {
      errors.push('At least one condition is required');
    }

    // Check for action nodes
    const actionNodes = nodes.filter((node) => node.type === 'action');
    if (actionNodes.length === 0) {
      errors.push('At least one action is required');
    }

    // Validate node connections
    const startNode = nodes.find((node) => node.id === 'start');
    const endNode = nodes.find((node) => node.id === 'end');
    
    if (!startNode || !endNode) {
      errors.push('Start and End nodes are required');
    }

    // Check if all nodes are connected
    const connectedNodes = new Set<string>();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(
      (node) => !connectedNodes.has(node.id) && node.id !== 'start'
    );

    if (disconnectedNodes.length > 0) {
      errors.push(`Disconnected nodes: ${disconnectedNodes.map(n => n.id).join(', ')}`);
    }

    setValidationErrors(errors);
    setIsValidRule(errors.length === 0);
  };

  const generateRulePreview = () => {
    if (!ruleName) {
      setRulePreview('');
      return;
    }

    const conditionNodes = nodes.filter((node) => node.type === 'condition');
    const actionNodes = nodes.filter((node) => node.type === 'action');
    const logicalOperatorNode = nodes.find((node) => node.type === 'logicalOperator');

    let preview = `Rule: ${ruleName}\n`;
    preview += `Product Type: ${productType}\n`;
    preview += `Description: ${ruleDescription}\n\n`;

    if (conditionNodes.length > 0) {
      preview += 'Conditions:\n';
      conditionNodes.forEach((node, index) => {
        const { field, operator, value } = node.data;
        preview += `  ${index + 1}. ${field} ${operator} ${value}\n`;
      });

      if (conditionNodes.length > 1 && logicalOperatorNode) {
        preview += `  Logical Operator: ${logicalOperatorNode.data.operator}\n`;
      }
    }

    if (actionNodes.length > 0) {
      preview += '\nActions:\n';
      actionNodes.forEach((node, index) => {
        const { actionType, value, multiplier } = node.data;
        preview += `  ${index + 1}. ${actionType}`;
        if (value !== undefined) preview += ` = ${value}`;
        if (multiplier !== undefined) preview += ` (×${multiplier})`;
        preview += '\n';
      });
    }

    setRulePreview(preview);
  };

  const handleSave = () => {
    if (!isValidRule) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    const rule = convertVisualRuleToJSON();
    onSave(rule);
  };

  const handleTest = () => {
    if (!isValidRule) {
      toast({
        title: "Cannot Test",
        description: "Please fix all validation errors before testing.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement rule testing functionality
    toast({
      title: "Test Rule",
      description: "Rule testing functionality will be implemented in the next phase.",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit Rule' : 'Create New Rule'} - Visual Builder
          </h2>
          <Badge variant={isValidRule ? "default" : "destructive"}>
            {isValidRule ? "Valid" : "Invalid"}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={!isValidRule}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Rule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValidRule}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 p-4 space-y-4">
          {/* Rule Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Rule Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                  placeholder="Enter rule name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Product Type</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                >
                  <option value="personal_loan">Personal Loan</option>
                  <option value="business_loan">Business Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">Description</label>
                <textarea
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-sm border rounded"
                  rows={3}
                  placeholder="Describe what this rule does"
                />
              </div>
            </CardContent>
          </Card>

          {/* Node Palette */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Nodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('condition')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('action')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Action
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addNode('logicalOperator')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Logical Operator
              </Button>
            </CardContent>
          </Card>

          {/* Validation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                {isValidRule ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                )}
                Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {validationErrors.length === 0 ? (
                <p className="text-sm text-green-600">Rule is valid</p>
              ) : (
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 flex items-start">
                      <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && rulePreview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rule Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <pre className="text-xs whitespace-pre-wrap">{rulePreview}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-right">
              <div className="bg-white p-2 rounded shadow-lg">
                <p className="text-xs text-gray-600">
                  Drag to connect nodes • Right-click to delete
                </p>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// Helper function to get default node data
function getDefaultNodeData(type: string) {
  switch (type) {
    case 'condition':
      return {
        field: 'monthly_income',
        operator: '>=',
        value: 0,
        type: 'number',
      };
    case 'action':
      return {
        actionType: 'set_limit',
        value: 0,
        multiplier: 1,
      };
    case 'logicalOperator':
      return {
        operator: 'AND',
      };
    default:
      return {};
  }
}

// Wrapper component with ReactFlowProvider
export function VisualRuleBuilderWrapper(props: VisualRuleBuilderProps) {
  return (
    <ReactFlowProvider>
      <VisualRuleBuilder {...props} />
    </ReactFlowProvider>
  );
}