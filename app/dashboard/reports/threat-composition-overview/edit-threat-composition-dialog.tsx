'use client';

import React, { useState, useEffect } from 'react';
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
  ReportsThreatCompositionOverview,
  UpdateReportsThreatCompositionOverviewDto,
  ReportsSeverityLevel,
  ReportsThreatType,
  ReportsAttackVector,
  ReportsBusinessUnit,
} from '@/lib/api/reports-types/types';
import {
  useUpdateThreatCompositionOverview,
  THREAT_SEVERITY_LEVELS,
  THREAT_TYPES,
  ATTACK_VECTORS,
  BUSINESS_UNITS_TC,
} from '@/lib/api/endpoints/reports/threat-composition-overview';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditThreatCompositionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  threatComposition: ReportsThreatCompositionOverview | null; // Allow null for initial state
  onSuccess: () => void;
}

export function EditThreatCompositionDialog({
  isOpen,
  onClose,
  threatComposition,
  onSuccess,
}: EditThreatCompositionDialogProps) {
  const [formData, setFormData] = useState<Partial<UpdateReportsThreatCompositionOverviewDto>>({});
  const updateMutation = useUpdateThreatCompositionOverview();

  useEffect(() => {
    if (threatComposition) {
      const { _id, createdAt, updatedAt, ...editableData } = threatComposition;
      setFormData({
        ...editableData,
      });
    } else {
      // Reset form if no threatComposition is provided
      setFormData({});
    }
  }, [threatComposition, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'incidentCount' ? (value === '' ? undefined : Number(value)) : value }));
  };

  const handleSelectChange = (name: keyof UpdateReportsThreatCompositionOverviewDto, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threatComposition) return;

    const updateData: UpdateReportsThreatCompositionOverviewDto = {
      ...formData,
      incidentCount: formData.incidentCount !== undefined ? Number(formData.incidentCount) : undefined,
    };

    // Remove keys with undefined values to prevent sending them in the payload if not changed
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateReportsThreatCompositionOverviewDto] === undefined) {
        delete updateData[key as keyof UpdateReportsThreatCompositionOverviewDto];
      }
    });

    if (Object.keys(updateData).length === 0) {
      toast.info("No changes to save.");
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: threatComposition._id, updatedData: updateData });
      toast.success("Threat Composition Overview updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update Threat Composition Overview:", error);
      toast.error("Failed to update entry. Please try again.");
    }
  };
  
  const handleInteractOutside = (event: Event) => {
    if (updateMutation.isPending) {
      event.preventDefault();
    }
  };

  if (!threatComposition) return null; // Don't render if no data

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]" onInteractOutside={handleInteractOutside}>
        <DialogHeader>
          <DialogTitle>Edit Threat Composition Overview</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {/* Month */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Month
            </Label>
            <Input
              id="month"
              name="month"
              value={formData.month || ''}
              onChange={handleChange}
              className="col-span-3"
              placeholder="e.g., January, February"
            />
          </div>

          {/* Year */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Input
              id="year"
              name="year"
              value={formData.year || ''}
              onChange={handleChange}
              className="col-span-3"
              placeholder="e.g., 2023, 2024"
            />
          </div>

          {/* Severity Level */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="severityLevel" className="text-right">
              Severity Level
            </Label>
            <Select
              value={formData.severityLevel || ''}
              onValueChange={(value) => handleSelectChange('severityLevel', value as ReportsSeverityLevel)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Severity" />
              </SelectTrigger>
              <SelectContent>
                {THREAT_SEVERITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Threat Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="threatType" className="text-right">
              Threat Type
            </Label>
            <Select
              value={formData.threatType || ''}
              onValueChange={(value) => handleSelectChange('threatType', value as ReportsThreatType)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Threat Type" />
              </SelectTrigger>
              <SelectContent>
                {THREAT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attack Vector */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="attackVector" className="text-right">
              Attack Vector
            </Label>
            <Select
              value={formData.attackVector || ''}
              onValueChange={(value) => handleSelectChange('attackVector', value as ReportsAttackVector)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Attack Vector" />
              </SelectTrigger>
              <SelectContent>
                {ATTACK_VECTORS.map((vector) => (
                  <SelectItem key={vector} value={vector}>
                    {vector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Business Unit (bu) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bu" className="text-right">
              Business Unit
            </Label>
            <Select
              value={formData.bu || ''}
              onValueChange={(value) => handleSelectChange('bu', value as ReportsBusinessUnit)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Business Unit" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_UNITS_TC.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Affected Asset */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="affectedAsset" className="text-right">
              Affected Asset
            </Label>
            <Input
              id="affectedAsset"
              name="affectedAsset"
              value={formData.affectedAsset || ''}
              onChange={handleChange}
              className="col-span-3"
              placeholder="e.g., Server XYZ, Workstation 123"
            />
          </div>

          {/* Incident Count */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="incidentCount" className="text-right">
              Incident Count
            </Label>
            <Input
              id="incidentCount"
              name="incidentCount"
              type="number"
              value={formData.incidentCount === undefined ? '' : String(formData.incidentCount)} // Handle undefined for initial empty display
              onChange={handleChange}
              className="col-span-3"
              placeholder="Number of incidents"
            />
          </div>

          <DialogFooter>
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