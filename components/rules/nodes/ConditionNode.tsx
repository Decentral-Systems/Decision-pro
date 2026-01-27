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

interface ConditionNodeData {
  field: string;
  operator: string;
  value: any;
  type: string;
  onDelete?: (nodeId: string) => void;
  onUpdate?: (nodeId: string, data: any) => void;
}

// Available fields for conditions
const AVAILABLE_FIELDS = [
  { value: 'monthly_income', label: 'Monthly Income', type: 'number' },
  { value: 'loan_amount', label: 'Loan Amount', type: 'number' },
  { value: 'credit_score', label: 'Credit Score', type: 'number' },
  { value: 'employment_status', label: 'Employment Status', type: 'string' },
  { value: 'employment_years', label: 'Employment Years', type: 'number' },
  { value: 'debt_to_income_ratio', label: 'Debt to Income Ratio', type: 'number' },
  { value: 'loan_term_months', label: 'Loan Term (Months)', type: 'number' },
  { value: 'age', label: 'Age', type: 'number' },
  { value: 'phone_number', label: 'Phone Number', type: 'string' },
  { value: 'customer_segment', label: 'Customer Segment', type: 'string' },
  { value: 'risk_level', label: 'Risk Level', type: 'string' },
];

// Available operators
const OPERATORS = {
  number: [
    { value: '>=', label: 'Greater than or equal (≥)' },
    { value: '<=', label: 'Less than or equal (≤)' },
    { value: '>', label: 'Greater than (>)' },
    { value: '<', label: 'Less than (<)' },
    { value: '==', label: 'Equal to (=)' },
    { value: '!=', label: 'Not equal to (≠)' },
  ],
  string: [
    { value: '==', label: 'Equal to (=)' },
    { value: '!=', label: 'Not equal to (≠)' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In list' },
    { value: 'not_in', label: 'Not in list' },
    { value: 'regex', label: 'Matches regex' },
  ],
};

export function ConditionNode({ id, data, selected }: NodeProps<ConditionNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(data);

  const handleFieldChange = useCallback((field: string) => {
    const fieldInfo = AVAILABLE_FIELDS.find(f => f.value === field);
    const newData = {
      ...localData,
      field,
      type: fieldInfo?.type || 'string',
      operator: fieldInfo?.type === 'number' ? '>=' : '==',
      value: fieldInfo?.type === 'number' ? 0 : '',
    };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleOperatorChange = useCallback((operator: string) => {
    const newData = { ...localData, operator };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleValueChange = useCallback((value: any) => {
    const newData = { ...localData, value };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleDelete = useCallback(() => {
    data.onDelete?.(id);
  }, [data, id]);

  const getFieldLabel = (fieldValue: string) => {
    return AVAILABLE_FIELDS.find(f => f.value === fieldValue)?.label || fieldValue;
  };

  const getOperatorLabel = (operatorValue: string) => {
    const operators = OPERATORS[localData.type as keyof typeof OPERATORS] || OPERATORS.string;
    return operators.find(op => op.value === operatorValue)?.label || operatorValue;
  };

  const renderValueInput = () => {
    if (localData.type === 'number') {
      return (
        <input
          type="number"
          value={localData.value || 0}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="Enter number"
        />
      );
    }

    if (localData.operator === 'in' || localData.operator === 'not_in') {
      return (
        <input
          type="text"
          value={localData.value || ''}
          onChange={(e) => handleValueChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="value1,value2,value3"
        />
      );
    }

    return (
      <input
        type="text"
        value={localData.value || ''}
        onChange={(e) => handleValueChange(e.target.value)}
        className="w-full px-2 py-1 text-xs border rounded"
        placeholder="Enter value"
      />
    );
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">
            Condition
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
              <label className="text-xs font-medium text-gray-700">Field</label>
              <Select value={localData.field} onValueChange={handleFieldChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FIELDS.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Operator</label>
              <Select value={localData.operator} onValueChange={handleOperatorChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(OPERATORS[localData.type as keyof typeof OPERATORS] || OPERATORS.string).map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Value</label>
              {renderValueInput()}
            </div>

            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setIsEditing(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="text-xs space-y-1">
            <div className="font-medium text-gray-900">
              {getFieldLabel(localData.field)}
            </div>
            <div className="text-gray-600">
              {getOperatorLabel(localData.operator)} {localData.value}
            </div>
            <div className="text-gray-500">
              Type: {localData.type}
            </div>
          </div>
        )}

        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-blue-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-blue-500"
        />
      </CardContent>
    </Card>
  );
}