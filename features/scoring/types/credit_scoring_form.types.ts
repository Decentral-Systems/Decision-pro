import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { CreditScoringFormData } from "@/lib/utils/validation";

export interface CreditScoringSectionProps {
  register: UseFormRegister<CreditScoringFormData>;
  control: Control<CreditScoringFormData>;
  errors: FieldErrors<CreditScoringFormData>;
  watch: UseFormWatch<CreditScoringFormData>;
  setValue: UseFormSetValue<CreditScoringFormData>;
  customerType?: "new" | "existing";
  selectedCustomerId?: string;
  isAutoFilled?: (field: string) => boolean;
  getFieldInfo?: (field: string) => { dataSource?: unknown } | undefined;
  markAsManuallyEdited?: (field: string) => void;
  phoneNumber?: string;
  idNumber?: string;
  phoneValidation?: {
    isValidating: boolean;
    valid: boolean;
    error?: string;
  };
  idValidation?: {
    isValidating: boolean;
    valid: boolean;
    error?: string;
  };
}
