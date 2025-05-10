'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ReportsSecurityBreachIndicators,
  UpdateReportsSecurityBreachIndicatorsDto,
  SecurityBreachIndicatorItem,
  SecurityBreachIndicatorName,
  SECURITY_BREACH_INDICATOR_NAMES,
  useUpdateReportsSecurityBreachIndicator,
} from '@/lib/api/endpoints/reports/security-breach-indicators';
import { toast } from 'sonner';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';

interface SecurityBreachIndicatorsEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportsSecurityBreachIndicators | null;
  onSuccess: () => void;
}

export function SecurityBreachIndicatorsEditDialog({
  isOpen,
  onClose,
  report,
  onSuccess,
}: SecurityBreachIndicatorsEditDialogProps) {
  const [formData, setFormData] = useState<Partial<UpdateReportsSecurityBreachIndicatorsDto>>({});
  const [indicators, setIndicators] = useState<SecurityBreachIndicatorItem[]>([]);
  const updateMutation = useUpdateReportsSecurityBreachIndicator();

  useEffect(() => {
    if (report) {
      const { _id, createdAt, updatedAt, indicators: reportIndicators, ...editableData } = report;
      setFormData(editableData);
      setIndicators(reportIndicators.map(ind => ({ ...ind }))); // Deep copy for editing
    } else {
      setFormData({});
      setIndicators([]);
    }
  }, [report, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIndicatorChange = (
    index: number,
    field: keyof SecurityBreachIndicatorItem,
    value: string | SecurityBreachIndicatorName
  ) => {
    const newIndicators = [...indicators];
    // Type assertion needed as field can be 'indicatorName' or 'score'
    (newIndicators[index] as any)[field] = value;
    setIndicators(newIndicators);
  };

  const addIndicator = () => {
    // Add a default or empty indicator. User must select a name.
    setIndicators([...indicators, { indicatorName: SECURITY_BREACH_INDICATOR_NAMES[0], score: '' }]);
  };

  const removeIndicator = (index: number) => {
    setIndicators(indicators.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    // Validate indicators: ensure all have names and scores
    for (const indicator of indicators) {
      if (!indicator.indicatorName || indicator.score.trim() === '') {
        toast.error("All indicators must have a name and a score.");
        return;
      }
    }

    const updateData: UpdateReportsSecurityBreachIndicatorsDto = {
      ...formData,
      month: formData.month || report.month, // Ensure month/year are not accidentally cleared if not touched
      year: formData.year || report.year,
      indicators: indicators.map(({ _id, ...item }) => item), // Send without _id for sub-items, or include if backend handles it for update
    };
    
    // Remove fields that haven't changed to send a partial update if desired
    // For simplicity, we'll send the whole object. Backend should handle partial updates.

    try {
      await updateMutation.mutateAsync({ id: report._id, updatedData: updateData });
      toast.success("Security Breach Indicator report updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update report:", error);
      toast.error("Failed to update report. Please try again.");
    }
  };

  const handleInteractOutside = (event: Event) => {
    if (updateMutation.isPending) {
      event.preventDefault();
    }
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={handleInteractOutside}>
        <DialogHeader>
          <DialogTitle>Edit Security Breach Indicators</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Month
            </Label>
            <Input
              id="month"
              name="month"
              value={formData.month || ''}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="e.g., January"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Input
              id="year"
              name="year"
              value={formData.year || ''}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="e.g., 2024"
              required
            />
          </div>

          <div className="col-span-4">
            <Label className="text-base font-medium">Indicators</Label>
            {indicators.map((indicator, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2 my-2 p-2 border rounded-md">
                <div className="col-span-5">
                  <Select
                    value={indicator.indicatorName}
                    onValueChange={(value) => handleIndicatorChange(index, 'indicatorName', value as SecurityBreachIndicatorName)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_BREACH_INDICATOR_NAMES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-5">
                  <Input
                    type="text" // Schema has score as String
                    placeholder="Score"
                    value={indicator.score}
                    onChange={(e) => handleIndicatorChange(index, 'score', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeIndicator(index)} className="text-destructive hover:text-destructive-hover">
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addIndicator} className="mt-2">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Indicator
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updateMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
