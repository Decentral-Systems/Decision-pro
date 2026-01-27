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

interface ActionNodeData {
  actionType: string;
  value?: any;
  calculation?: string;
  multiplier?: number;
  parameters?: Record<string, any>;
  onDelete?: (nodeId: string) => void;
  onUpdate?: (nodeId: string, data: any) => void;
}

// Available action types
const ACTION_TYPES = [
  { value: 'set_limit', label: 'Set Loan Limit', hasValue: true, hasMultiplier: false },
  { value: 'adjust_interest_rate', label: 'Adjust Interest Rate', hasValue: true, hasMultiplier: false },
  { value: 'approve', label: 'Auto Approve', hasValue: false, hasMultiplier: false },
  { value: 'reject', label: 'Auto Reject', hasValue: false, hasMultiplier: false },
  { value: 'require_review', label: 'Require Manual Review', hasValue: false, hasMultiplier: false },
  { value: 'set_approval_level', label: 'Set Approval Level', hasValue: true, hasMultiplier: false },
  { value: 'multiply_limit', label: 'Multiply Loan Limit', hasValue: false, hasMultiplier: true },
  { value: 'add_fee', label: 'Add Processing Fee', hasValue: true, hasMultiplier: false },
  { value: 'set_priority', label: 'Set Processing Priority', hasValue: true, hasMultiplier: false },
  { value: 'flag_for_verification', label: 'Flag for Verification', hasValue: false, hasMultiplier: false },
];

export function ActionNode({ id, data, selected }: NodeProps<ActionNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(data);

  const handleActionTypeChange = useCallback((actionType: string) => {
    const actionInfo = ACTION_TYPES.find(a => a.value === actionType);
    const newData = {
      ...localData,
      actionType,
      value: actionInfo?.hasValue ? (localData.value || 0) : undefined,
      multiplier: actionInfo?.hasMultiplier ? (localData.multiplier || 1) : undefined,
    };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleValueChange = useCallback((value: any) => {
    const newData = { ...localData, value };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleMultiplierChange = useCallback((multiplier: number) => {
    const newData = { ...localData, multiplier };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleCalculationChange = useCallback((calculation: string) => {
    const newData = { ...localData, calculation };
    setLocalData(newData);
    data.onUpdate?.(id, newData);
  }, [localData, data, id]);

  const handleDelete = useCallback(() => {
    data.onDelete?.(id);
  }, [data, id]);

  const getActionTypeLabel = (actionValue: string) => {
    return ACTION_TYPES.find(a => a.value === actionValue)?.label || actionValue;
  };

  const getCurrentActionInfo = () => {
    return ACTION_TYPES.find(a => a.value === localData.actionType);
  };

  const renderValueInput = () => {
    const actionInfo = getCurrentActionInfo();
    if (!actionInfo?.hasValue) return null;

    // Special handling for different action types
    if (localData.actionType === 'adjust_interest_rate') {
      return (
        <div>
          <label className="text-xs font-medium text-gray-700">Rate Adjustment (%)</label>
          <input
            type="number"
            step="0.01"
            value={localData.value || 0}
            onChange={(e) => handleValueChange(Number(e.target.value))}
            className="w-full px-2 py-1 text-xs border rounded"
            placeholder="e.g., -0.02 for -2%"
          />
        </div>
      );
    }

    if (localData.actionType === 'set_approval_level') {
      return (
        <div>
          <label className="text-xs font-medium text-gray-700">Approval Level</label>
          <Select 
            value={String(localData.value || 1)} 
            onValueChange={(value) => handleValueChange(Number(value))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1 - Junior Analyst</SelectItem>
              <SelectItem value="2">Level 2 - Senior Analyst</SelectItem>
              <SelectItem value="3">Level 3 - Manager</SelectItem>
              <SelectItem value="4">Level 4 - Senior Manager</SelectItem>
              <SelectItem value="5">Level 5 - Executive Committee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (localData.actionType === 'set_priority') {
      return (
        <div>
          <label className="text-xs font-medium text-gray-700">Priority</label>
          <Select 
            value={String(localData.value || 'normal')} 
            onValueChange={(value) => handleValueChange(value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="normal">Normal Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="urgent">Urgent Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Default numeric input
    return (
      <div>
        <label className="text-xs font-medium text-gray-700">Value</label>
        <input
          type="number"
          value={localData.value || 0}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="Enter value"
        />
      </div>
    );
  };

  const renderMultiplierInput = () => {
    const actionInfo = getCurrentActionInfo();
    if (!actionInfo?.hasMultiplier) return null;

    return (
      <div>
        <label className="text-xs font-medium text-gray-700">Multiplier</label>
        <input
          type="number"
          step="0.1"
          value={localData.multiplier || 1}
          onChange={(e) => handleMultiplierChange(Number(e.target.value))}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="e.g., 1.5"
        />
      </div>
    );
  };

  const getActionSummary = () => {
    const actionInfo = getCurrentActionInfo();
    if (!actionInfo) return 'Unknown Action';

    let summary = actionInfo.label;
    
    if (actionInfo.hasValue && localData.value !== undefined) {
      if (localData.actionType === 'adjust_interest_rate') {
        summary += `: ${localData.value > 0 ? '+' : ''}${localData.value}%`;
      } else if (localData.actionType === 'set_approval_level') {
        summary += `: Level ${localData.value}`;
      } else if (localData.actionType === 'set_priority') {
        summary += `: ${localData.value}`;
      } else {
        summary += `: ${localData.value}`;
      }
    }
    
    if (actionInfo.hasMultiplier && localData.multiplier !== undefined) {
      summary += ` (×${localData.multiplier})`;
    }

    return summary;
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="default" className="text-xs bg-green-500">
            Action
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
              <label className="text-xs font-medium text-gray-700">Action Type</label>
              <Select value={localData.actionType} onValueChange={handleActionTypeChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderValueInput()}
            {renderMultiplierInput()}

            <div>
              <label className="text-xs font-medium text-gray-700">Calculation (Optional)</label>
              <input
                type="text"
                value={localData.calculation || ''}
                onChange={(e) => handleCalculationChange(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="e.g., monthly_income * 12 * 5"
              />
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
              {getActionSummary()}
            </div>
            {localData.calculation && (
              <div className="text-gray-600">
                Formula: {localData.calculation}
              </div>
            )}
            <div className="text-gray-500">
              Type: {localData.actionType}
            </div>
          </div>
        )}

        {/* Connection handles */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-green-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-green-500"
        />
      </CardContent>
    </Card>
  );
}