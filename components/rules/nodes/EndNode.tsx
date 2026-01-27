"use client";

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Square } from "lucide-react";

interface EndNodeData {
  label: string;
}

export function EndNode({ data, selected }: NodeProps<EndNodeData>) {
  return (
    <Card className={`min-w-[150px] border-red-500 bg-red-50 ${selected ? 'ring-2 ring-red-500' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white">
            <Square className="h-4 w-4" />
          </div>
          <div className="text-center">
            <Badge variant="destructive" className="text-xs mb-1">
              End
            </Badge>
            <div className="text-sm font-medium text-red-800">
              Rule Complete
            </div>
            <div className="text-xs text-red-600">
              Return result
            </div>
          </div>
        </div>

        {/* Only target handle for end node */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-red-500 border-2 border-white"
        />
      </CardContent>
    </Card>
  );
}