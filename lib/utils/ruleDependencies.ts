/**
 * Rule Dependencies Management
 * Handles rule dependencies, validation, and circular dependency detection
 */

import { CustomProductRule, WorkflowRule } from "@/types/rules";

export interface RuleDependency {
  ruleId: number;
  dependsOn: number[];
  dependents: number[];
}

export interface DependencyGraph {
  nodes: Array<{ id: number; name: string; type: "product" | "workflow" | "risk" }>;
  edges: Array<{ from: number; to: number; type: "depends_on" }>;
}

/**
 * Build dependency graph from rules
 */
export function buildDependencyGraph(
  rules: (CustomProductRule | WorkflowRule)[]
): DependencyGraph {
  const nodes = rules.map(rule => ({
    id: rule.id,
    name: rule.rule_name,
    type: "depends_on" in rule ? "product" : "workflow" as "product" | "workflow",
  }));

  const edges: Array<{ from: number; to: number; type: "depends_on" }> = [];

  rules.forEach(rule => {
    const dependsOn = "depends_on" in rule ? rule.depends_on : [];
    if (dependsOn) {
      dependsOn.forEach(depId => {
        edges.push({ from: rule.id, to: depId, type: "depends_on" });
      });
    }
  });

  return { nodes, edges };
}

/**
 * Detect circular dependencies
 */
export function detectCircularDependencies(
  rules: (CustomProductRule | WorkflowRule)[]
): number[][] {
  const cycles: number[][] = [];
  const graph = buildDependencyGraph(rules);
  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  function dfs(nodeId: number, path: number[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const outgoingEdges = graph.edges.filter(e => e.from === nodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.to)) {
        dfs(edge.to, [...path]);
      } else if (recursionStack.has(edge.to)) {
        // Found a cycle
        const cycleStart = path.indexOf(edge.to);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), edge.to]);
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return cycles;
}

/**
 * Validate dependencies exist
 */
export function validateDependencies(
  rule: CustomProductRule | WorkflowRule,
  allRules: (CustomProductRule | WorkflowRule)[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dependsOn = "depends_on" in rule ? rule.depends_on : [];

  if (dependsOn && dependsOn.length > 0) {
    dependsOn.forEach(depId => {
      const exists = allRules.some(r => r.id === depId);
      if (!exists) {
        errors.push(`Dependency rule #${depId} does not exist`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get rules that depend on a given rule
 */
export function getDependentRules(
  ruleId: number,
  allRules: (CustomProductRule | WorkflowRule)[]
): (CustomProductRule | WorkflowRule)[] {
  return allRules.filter(rule => {
    const dependsOn = "depends_on" in rule ? rule.depends_on : [];
    return dependsOn && dependsOn.includes(ruleId);
  });
}

/**
 * Check if deleting a rule would break dependencies
 */
export function checkDeletionImpact(
  ruleId: number,
  allRules: (CustomProductRule | WorkflowRule)[]
): { canDelete: boolean; dependentRules: (CustomProductRule | WorkflowRule)[] } {
  const dependentRules = getDependentRules(ruleId, allRules);
  return {
    canDelete: dependentRules.length === 0,
    dependentRules,
  };
}

/**
 * Get dependency chain (all rules in dependency path)
 */
export function getDependencyChain(
  ruleId: number,
  allRules: (CustomProductRule | WorkflowRule)[]
): number[] {
  const chain: number[] = [];
  const visited = new Set<number>();

  function traverse(id: number): void {
    if (visited.has(id)) return;
    visited.add(id);
    chain.push(id);

    const rule = allRules.find(r => r.id === id);
    if (rule) {
      const dependsOn = "depends_on" in rule ? rule.depends_on : [];
      if (dependsOn) {
        dependsOn.forEach(depId => traverse(depId));
      }
    }
  }

  traverse(ruleId);
  return chain;
}

