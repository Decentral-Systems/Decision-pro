"use client";

import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogicalOperatorNodeData {
  operator: string;
  onDelete?: (nodeId: string) => void;
  onUpdate?: (nodeId: string, data: any) => void;
}

// Available logical operators
const LOGICAL_OPERATORS = [
  { value: 'AND', label: 'AND', description: 'All conditions must be true' },
  { value: 'OR', label: 'OR', description: 'At least one condition must be true' },
  { value: 'NOT', label: 'NOT', description: 'Negate the result' },
  { value: 'XOR', label: 'XOR', description: 'Exactly one condition must be true' },
];

export function LogicalOperatorNode({ id, data, selected }: NodeProps<LogicalOperatorNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(data);

  const handleOperatorChange = useCallback((operator: string) => {
    const newData = { ...localData, operator };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleDelete = useCallback(() => {
    data.onDelete?.(id);
  }, [data, id]);

  const getOperatorInfo = (operatorValue: string) => {
    return LOGICAL_OPERATORS.find(op => op.value === operatorValue);
  };

  const getOperatorSymbol = (operatorValue: string) => {
    switch (operatorValue) {
      case 'AND':
        return '∧';
      case 'OR':
        return '∨';
      case 'NOT':
        return '¬';
      case 'XOR':
        return '⊕';
      default:
        return operatorValue;
    }
  };

  const getOperatorColor = (operatorValue: string) => {
    switch (operatorValue) {
      case 'AND':
        return 'bg-blue-500';
      case 'OR':
        return 'bg-orange-500';
      case 'NOT':
        return 'bg-red-500';
      case 'XOR':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const operatorInfo = getOperatorInfo(localData.operator);

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            Logic
          </Badge>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Logical Operator</label>
              <Select value={localData.operator} onValueChange={handleOperatorChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGICAL_OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{getOperatorSymbol(op.value)}</span>
                        <span>{op.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {operatorInfo && (
              <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                {operatorInfo.description}
              </div>
            )}

            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setIsEditing(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-lg ${getOperatorColor(localData.operator)}`}>
              {getOperatorSymbol(localData.operator)}
            </div>
            <div className="mt-2 text-xs font-medium text-gray-900">
              {localData.operator}
            </div>
            {operatorInfo && (
              <div className="text-xs text-gray-600 mt-1">
                {operatorInfo.description}
              </div>
            )}
          </div>
        )}

        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-purple-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-purple-500"
        />
        
        {/* Additional handles for multiple inputs */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-purple-500"
          id="top"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          className="w-3 h-3 !bg-purple-500"
          id="bottom"
        />
      </CardContent>
    </Card>
  );
}