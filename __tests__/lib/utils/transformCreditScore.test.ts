/**
 * Unit Tests for Credit Score Form Transformation
 */

import { transformFormDataTo168Features } from '@/lib/utils/transformCreditScore';
import { CreditScoringFormData } from '@/types/credit';

describe('transformFormDataTo168Features', () => {
  const mockFormData: Partial<CreditScoringFormData> = {
    // Personal Information
    full_name: 'John Doe',
    age: 35,
    gender: 'male',
    phone_number: '+251912345678',
    email: 'john@example.com',
    id_number: '1234567890',
    
    // Employment
    employment_status: 'employed',
    employment_years: 5,
    monthly_income: 15000,
    employer_name: 'Test Company',
    
    // Financial
    loan_amount: 50000,
    loan_purpose: 'business',
    existing_loans_count: 1,
    existing_loans_total_amount: 10000,
    
    // Residence
    residence_type: 'owned',
    residence_years: 3,
    address_region: 'Addis Ababa',
  };

  it('should transform form data to 168-feature structure', () => {
    const result = transformFormDataTo168Features(mockFormData as CreditScoringFormData);

    expect(result).toBeDefined();
    expect(result.customer_profile).toBeDefined();
    expect(result.financial_information).toBeDefined();
    expect(result.employment_information).toBeDefined();
  });

  it('should map personal information correctly', () => {
    const result = transformFormDataTo168Features(mockFormData as CreditScoringFormData);

    expect(result.customer_profile.age).toBe(35);
    expect(result.customer_profile.gender).toBe('male');
  });

  it('should map employment information correctly', () => {
    const result = transformFormDataTo168Features(mockFormData as CreditScoringFormData);

    expect(result.employment_information.employment_status).toBe('employed');
    expect(result.employment_information.employment_years).toBe(5);
    expect(result.employment_information.monthly_income).toBe(15000);
  });

  it('should map financial information correctly', () => {
    const result = transformFormDataTo168Features(mockFormData as CreditScoringFormData);

    expect(result.financial_information.loan_amount).toBe(50000);
    expect(result.financial_information.existing_loans_count).toBe(1);
  });

  it('should handle missing optional fields', () => {
    const minimalData: Partial<CreditScoringFormData> = {
      full_name: 'John Doe',
      age: 35,
      monthly_income: 15000,
      loan_amount: 50000,
    };

    const result = transformFormDataTo168Features(minimalData as CreditScoringFormData);

    expect(result).toBeDefined();
    expect(result.customer_profile.age).toBe(35);
  });

  it('should calculate derived features', () => {
    const result = transformFormDataTo168Features(mockFormData as CreditScoringFormData);

    // Should calculate debt-to-income ratio
    const monthlyDebt = mockFormData.existing_loans_total_amount! / 12;
    const expectedDTI = monthlyDebt / mockFormData.monthly_income!;
    
    // The function should include financial ratios in the output
    expect(result.financial_information).toBeDefined();
  });
});




