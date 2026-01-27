/**
 * Form Templates Utility
 * Manages saving and loading form templates/presets
 */

import { CreditScoringFormData } from "@/lib/utils/validation";

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  formData: Partial<CreditScoringFormData>;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isDefault?: boolean;
}

const TEMPLATES_STORAGE_KEY = "credit_scoring_templates";
const MAX_TEMPLATES = 50;

/**
 * Get all saved templates
 */
export function getAllTemplates(): FormTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!stored) return getDefaultTemplates();
    
    const templates = JSON.parse(stored) as FormTemplate[];
    return [...getDefaultTemplates(), ...templates.filter(t => !t.isDefault)];
  } catch (error) {
    console.error("Error loading templates:", error);
    return getDefaultTemplates();
  }
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): FormTemplate | null {
  const templates = getAllTemplates();
  return templates.find(t => t.id === id) || null;
}

/**
 * Save a new template
 */
export function saveTemplate(
  name: string,
  formData: Partial<CreditScoringFormData>,
  description?: string,
  category?: string,
  tags?: string[]
): FormTemplate {
  const templates = getAllTemplates().filter(t => !t.isDefault);
  
  // Check if we're at max capacity
  if (templates.length >= MAX_TEMPLATES) {
    throw new Error(`Maximum ${MAX_TEMPLATES} templates allowed. Please delete some templates first.`);
  }

  const template: FormTemplate = {
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    category: category || "Custom",
    formData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: tags || [],
    isDefault: false,
  };

  templates.push(template);
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  
  return template;
}

/**
 * Update an existing template
 */
export function updateTemplate(
  id: string,
  updates: Partial<Pick<FormTemplate, "name" | "description" | "category" | "formData" | "tags">>
): FormTemplate {
  const templates = getAllTemplates().filter(t => !t.isDefault);
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error(`Template with ID ${id} not found`);
  }

  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  return templates[index];
}

/**
 * Delete a template
 */
export function deleteTemplate(id: string): void {
  const templates = getAllTemplates().filter(t => !t.isDefault);
  const filtered = templates.filter(t => t.id !== id);
  
  if (filtered.length === templates.length) {
    throw new Error(`Template with ID ${id} not found`);
  }

  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): FormTemplate[] {
  return getAllTemplates().filter(t => t.category === category);
}

/**
 * Search templates by name or tags
 */
export function searchTemplates(query: string): FormTemplate[] {
  const lowerQuery = query.toLowerCase();
  return getAllTemplates().filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery) ||
    t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get default templates
 */
function getDefaultTemplates(): FormTemplate[] {
  return [
    {
      id: "default_personal_loan",
      name: "Personal Loan - Standard",
      description: "Standard template for personal loan applications",
      category: "Personal Loans",
      isDefault: true,
      formData: {
        loan_product_type: "PersonalLoan",
        employment_status: "employed",
        urban_rural: "urban",
        loan_term_months: 24,
      },
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      tags: ["personal", "standard", "default"],
    },
    {
      id: "default_business_loan",
      name: "Business Loan - Standard",
      description: "Standard template for business loan applications",
      category: "Business Loans",
      isDefault: true,
      formData: {
        loan_product_type: "BusinessLoan",
        employment_status: "self_employed",
        loan_term_months: 36,
      },
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      tags: ["business", "standard", "default"],
    },
    {
      id: "default_agriculture_loan",
      name: "Agriculture Loan - Standard",
      description: "Standard template for agriculture loan applications",
      category: "Agriculture Loans",
      isDefault: true,
      formData: {
        loan_product_type: "AgricultureLoan",
        employment_status: "self_employed",
        loan_term_months: 48,
      },
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      tags: ["agriculture", "standard", "default"],
    },
    {
      id: "default_high_risk",
      name: "High Risk - Review Required",
      description: "Template for high-risk applications requiring manual review",
      category: "Risk Templates",
      isDefault: true,
      formData: {
        loan_product_type: "PersonalLoan",
        credit_utilization_ratio: 80,
        payment_history_score: 50,
      },
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
      tags: ["high-risk", "review", "default"],
    },
  ];
}

/**
 * Export template to JSON
 */
export function exportTemplate(template: FormTemplate): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Import template from JSON
 */
export function importTemplate(json: string): FormTemplate {
  try {
    const template = JSON.parse(json) as FormTemplate;
    
    // Validate template structure
    if (!template.name || !template.formData) {
      throw new Error("Invalid template format");
    }

    // Generate new ID and timestamps
    template.id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    template.createdAt = new Date().toISOString();
    template.updatedAt = new Date().toISOString();
    template.isDefault = false;

    return saveTemplate(
      template.name,
      template.formData,
      template.description,
      template.category,
      template.tags
    );
  } catch (error) {
    throw new Error(`Failed to import template: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get template categories
 */
export function getTemplateCategories(): string[] {
  const templates = getAllTemplates();
  const categories = new Set(templates.map(t => t.category || "Uncategorized"));
  return Array.from(categories).sort();
}

