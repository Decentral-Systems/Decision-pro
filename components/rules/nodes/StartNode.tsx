"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface StartNodeData {
  label: string;
}

export function StartNode({ data, selected }: NodeProps<StartNodeData>) {
  return (
    <Card className={`min-w-[150px] border-green-500 bg-green-50 ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
            <Play className="h-4 w-4" />
          </div>
          <div className="text-center">
            <Badge variant="default" className="text-xs bg-green-500 mb-1">
              Start
            </Badge>
            <div className="text-sm font-medium text-green-800">
              Rule Evaluation
            </div>
            <div className="text-xs text-green-600">
              Begin processing
            </div>
          </div>
        </div>

        {/* Only source handle for start node */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-green-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
}