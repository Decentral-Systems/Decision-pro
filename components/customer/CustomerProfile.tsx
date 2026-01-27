"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, getCustomerProfile } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { Mail, Phone, MapPin, Briefcase, Calendar, User } from "lucide-react";
import { DataCompletenessIndicator } from "./DataCompletenessIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMissingDataMessage, getMissingDataTooltip } from "@/lib/utils/missingDataMessages";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomerProfileProps {
  data: Customer360Data;
}

interface CustomerProfileProps {
  data: Customer360Data;
  onEditClick?: () => void;
}

export function CustomerProfile({ data, onEditClick }: CustomerProfileProps) {
  const profile = getCustomerProfile(data);

  // Calculate profile completeness
  const requiredFields = [
    "full_name",
    "email",
    "phone_number",
    "monthly_income",
    "employment_status",
    "region",
  ];
  const completedFields = requiredFields.filter((field) => {
    const value = profile[field as keyof typeof profile];
    return value !== undefined && value !== null && value !== "" && value !== 0;
  });
  const completeness = (completedFields.length / requiredFields.length) * 100;

  return (
    <div className="space-y-6">
      {/* Data Completeness Indicator */}
      <DataCompletenessIndicator data={data} onEditClick={onEditClick} />

      <Tabs defaultValue="personal" className="w-full">
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 mt-6">
          {/* Personal Information */}
          <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </p>
                <p className="text-lg mt-1">
                  {profile.full_name || (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground italic">
                            {getMissingDataMessage({ field: 'full_name', category: 'personal', isRequired: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getMissingDataTooltip({ field: 'full_name', category: 'personal', isRequired: true })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </p>
                <p className="text-lg mt-1">{formatDate(profile.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p className="text-lg mt-1">
                  {profile.age || (
                    <span className="text-muted-foreground italic">
                      {getMissingDataMessage({ field: 'age', category: 'personal' })}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="text-lg mt-1 capitalize">
                  {profile.gender || (
                    <span className="text-muted-foreground italic">
                      {getMissingDataMessage({ field: 'gender', category: 'personal' })}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                <p className="text-lg mt-1 capitalize">
                  {profile.marital_status || (
                    <span className="text-muted-foreground italic">
                      {getMissingDataMessage({ field: 'marital_status', category: 'personal' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="text-lg mt-1">
                  {profile.email || (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground italic">
                            {getMissingDataMessage({ field: 'email', category: 'personal' })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getMissingDataTooltip({ field: 'email', category: 'personal' })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </p>
                <p className="text-lg mt-1">
                  {profile.phone_number || (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground italic">
                            {getMissingDataMessage({ field: 'phone_number', category: 'personal', isRequired: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getMissingDataTooltip({ field: 'phone_number', category: 'personal', isRequired: true })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                <p className="text-lg mt-1">
                  {profile.id_number || (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground italic">
                            {getMissingDataMessage({ field: 'id_number', category: 'personal', isRequired: true })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getMissingDataTooltip({ field: 'id_number', category: 'personal', isRequired: true })}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Region
                </p>
                <p className="text-lg mt-1">
                  {profile.region || (
                    <span className="text-muted-foreground italic">
                      {getMissingDataMessage({ field: 'region', category: 'personal', isRequired: true })}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location Type</p>
                <p className="text-lg mt-1 capitalize">
                  {profile.urban_rural || (
                    <span className="text-muted-foreground italic">
                      {getMissingDataMessage({ field: 'address', category: 'personal' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="employment" className="space-y-4 mt-6">
          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Employment Status
                  </p>
                  <p className="text-lg mt-1 capitalize">
                    {profile.employment_status || (
                      <span className="text-muted-foreground italic">
                        {getMissingDataMessage({ field: 'employment_status', category: 'employment', isRequired: true })}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Years Employed</p>
                  <p className="text-lg mt-1">{profile.years_employed || 0} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employer Name</p>
                  <p className="text-lg mt-1">
                    {profile.employer_name || (
                      <span className="text-muted-foreground italic">
                        {getMissingDataMessage({ field: 'employer_name', category: 'employment' })}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Sector</p>
                  <p className="text-lg mt-1">
                    {profile.business_sector || (
                      <span className="text-muted-foreground italic">
                        {getMissingDataMessage({ field: 'business_sector', category: 'employment' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4 mt-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(profile.monthly_income)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(profile.monthly_expenses)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Savings Balance</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(profile.savings_balance)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Checking Balance</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(profile.checking_balance)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Debt</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(profile.total_debt)}</p>
                </div>
                {profile.monthly_income && profile.total_debt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Debt-to-Income Ratio</p>
                    <p className="text-2xl font-bold mt-1">
                      {((profile.total_debt / profile.monthly_income) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {profile.monthly_income && profile.monthly_expenses && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expense-to-Income Ratio</p>
                    <p className="text-2xl font-bold mt-1">
                      {((profile.monthly_expenses / profile.monthly_income) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                  <Badge className="mt-1" variant={profile.status === "active" ? "default" : "secondary"}>
                    {profile.status || "Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Since */}
      {profile.created_at && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Since</p>
              <p className="text-lg mt-1">{formatDate(profile.created_at)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



