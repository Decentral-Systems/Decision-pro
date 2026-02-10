import {
  IconActivity,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";

import { ModelVersionInfo } from "../types/scoring.type";

export const getVersionStatus = (version: ModelVersionInfo) => {
  if (version.is_beta)
    return {
      label: "Beta",
      color: "bg-yellow-100 text-yellow-800",
      icon: IconAlertTriangle,
    };
  if (version.is_deployed && version.is_active)
    return {
      label: "Active",
      color: "bg-green-100 text-green-800",
      icon: IconCircleCheck,
    };
  if (version.is_deployed)
    return {
      label: "Deployed",
      color: "bg-blue-100 text-blue-800",
      icon: IconActivity,
    };
  return {
    label: "Archived",
    color: "bg-gray-100 text-gray-800",
    icon: IconClock,
  };
};
