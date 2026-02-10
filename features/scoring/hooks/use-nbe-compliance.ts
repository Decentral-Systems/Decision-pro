import { useMemo } from "react";
import { nbeComplianceValidator } from "../utils/nbe-compliance";
import type { NBEComplianceResult } from "../utils/nbe-compliance";

interface UseNbeComplianceArgs {
  loanAmount: string | number | undefined;
  monthlyIncome: string | number | undefined;
  loanTermMonths: string | number | undefined;
  overrideApproved?: boolean;
}

interface UseNbeComplianceResult {
  nbeCompliance: NBEComplianceResult | null;
  canSubmit: boolean;
}

export function useNbeCompliance({
  loanAmount,
  monthlyIncome,
  loanTermMonths,
  overrideApproved = false,
}: UseNbeComplianceArgs): UseNbeComplianceResult {
  const nbeCompliance = useMemo<NBEComplianceResult | null>(() => {
    const amount = Number(loanAmount);
    const income = Number(monthlyIncome);
    const term = Number(loanTermMonths);
    if (
      Number.isFinite(amount) &&
      Number.isFinite(income) &&
      Number.isFinite(term) &&
      term > 0
    ) {
      return nbeComplianceValidator.validateLoanCompliance(amount, income, term);
    }
    return null;
  }, [loanAmount, monthlyIncome, loanTermMonths]);

  const canSubmit = useMemo(() => {
    if (nbeCompliance == null) return true;
    if (nbeCompliance.compliant) return true;
    return overrideApproved;
  }, [nbeCompliance, overrideApproved]);

  return { nbeCompliance, canSubmit };
}
