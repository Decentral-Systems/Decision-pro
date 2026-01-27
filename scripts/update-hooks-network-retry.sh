#!/bin/bash
# Script to update all React Query hooks to use network-aware retry
# This ensures all hooks check network state before retrying

HOOKS_DIR="lib/api/hooks"

# List of hooks that need updating (found via grep)
HOOKS=(
  "useModelVersionHistory.ts"
  "useDefaultPredictionHistory.ts"
  "useML.ts"
  "useCustomerCommunications.ts"
  "useCreditScoringHistory.ts"
  "useFeatureImportance.ts"
  "useAuditLogs.ts"
  "useCompliance.ts"
  "useCustomerJourney.ts"
  "useUsers.ts"
  "useRiskAlerts.ts"
  "useCustomerDocuments.ts"
  "useCustomerIntelligence.ts"
  "useSettings.ts"
)

echo "Updating hooks to use network-aware retry..."

for hook in "${HOOKS[@]}"; do
  echo "Processing $hook..."
  # This would need manual updates - script is for reference
done

echo "Done!"
