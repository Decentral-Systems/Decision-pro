"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SearchCondition {
  field: string;
  operator: string;
  value: string;
}

export interface SearchPreset {
  id: string;
  name: string;
  conditions: SearchCondition[];
  logic: "AND" | "OR";
}

interface AdvancedSearchBuilderProps {
  onSearch: (conditions: SearchCondition[], logic: "AND" | "OR") => void;
  onClear?: () => void;
}

const FIELD_OPTIONS = [
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone_number", label: "Phone Number" },
  { value: "customer_id", label: "Customer ID" },
  { value: "region", label: "Region" },
  { value: "credit_score", label: "Credit Score" },
  { value: "risk_level", label: "Risk Level" },
  { value: "status", label: "Status" },
  { value: "employment_status", label: "Employment Status" },
  { value: "created_at", label: "Created Date" },
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "between", label: "Between" },
];

const PRESET_STORAGE_KEY = "customer-search-presets";

export function AdvancedSearchBuilder({ onSearch, onClear }: AdvancedSearchBuilderProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<SearchCondition[]>([
    { field: "full_name", operator: "contains", value: "" },
  ]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [presets, setPresets] = useState<SearchPreset[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(PRESET_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [presetName, setPresetName] = useState("");

  const addCondition = useCallback(() => {
    setConditions([...conditions, { field: "full_name", operator: "contains", value: "" }]);
  }, [conditions]);

  const removeCondition = useCallback(
    (index: number) => {
      setConditions(conditions.filter((_, i) => i !== index));
    },
    [conditions]
  );

  const updateCondition = useCallback(
    (index: number, updates: Partial<SearchCondition>) => {
      const updated = [...conditions];
      updated[index] = { ...updated[index], ...updates };
      setConditions(updated);
    },
    [conditions]
  );

  const handleSearch = useCallback(() => {
    const validConditions = conditions.filter((c) => c.value.trim() !== "");
    if (validConditions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one search condition with a value",
        variant: "destructive",
      });
      return;
    }
    onSearch(validConditions, logic);
    setIsOpen(false);
  }, [conditions, logic, onSearch, toast]);

  const handleClear = useCallback(() => {
    setConditions([{ field: "full_name", operator: "contains", value: "" }]);
    setLogic("AND");
    onClear?.();
    setIsOpen(false);
  }, [onClear]);

  const savePreset = useCallback(() => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the preset",
        variant: "destructive",
      });
      return;
    }

    const validConditions = conditions.filter((c) => c.value.trim() !== "");
    if (validConditions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one search condition with a value",
        variant: "destructive",
      });
      return;
    }

    const newPreset: SearchPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      conditions: validConditions,
      logic,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updatedPresets));
    setPresetName("");
    toast({
      title: "Success",
      description: "Search preset saved successfully",
    });
  }, [presetName, conditions, logic, presets, toast]);

  const loadPreset = useCallback(
    (preset: SearchPreset) => {
      setConditions(preset.conditions);
      setLogic(preset.logic);
      toast({
        title: "Preset Loaded",
        description: `Loaded preset: ${preset.name}`,
      });
    },
    [toast]
  );

  const deletePreset = useCallback(
    (presetId: string) => {
      const updatedPresets = presets.filter((p) => p.id !== presetId);
      setPresets(updatedPresets);
      localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updatedPresets));
      toast({
        title: "Success",
        description: "Preset deleted successfully",
      });
    },
    [presets, toast]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Advanced Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Search Builder</DialogTitle>
          <DialogDescription>
            Build complex search queries with multiple conditions and logic operators
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Logic Operator */}
          <div className="flex items-center gap-4">
            <Label>Match Conditions:</Label>
            <Select value={logic} onValueChange={(value) => setLogic(value as "AND" | "OR")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">All (AND)</SelectItem>
                <SelectItem value="OR">Any (OR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Search Conditions</Label>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            {conditions.map((condition, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4">
                      <Label>Field</Label>
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateCondition(index, { field: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label>Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, { operator: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-4">
                      <Label>Value</Label>
                      <Input
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: e.target.value })}
                        placeholder="Enter value..."
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(index)}
                        disabled={conditions.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Saved Presets */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <Label>Saved Presets</Label>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Badge
                    key={preset.id}
                    variant="secondary"
                    className="cursor-pointer gap-2"
                    onClick={() => loadPreset(preset)}
                  >
                    {preset.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Save Preset */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={savePreset}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

