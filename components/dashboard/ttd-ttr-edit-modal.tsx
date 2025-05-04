'use client';

import { useState, useEffect } from 'react';
import { useUpdateTtdTtrRecord, useCreateTtdTtrRecord } from '@/lib/api/endpoints/executive-dashboard/ttd-ttr';
import { CombinedTtdTtr, UpdateTtdTtrDto, TtdTtrIndicator } from './ttd-ttr-types'; // Assuming types moved or using page types temporarily
// TODO: Move CombinedTtdTtr interface to a shared types file (e.g., executive-dashboard-types/types.ts or a dedicated one)
// For now, define it here if not moved
interface CombinedTtdTtr {
    id: string; 
    month: string; 
    year: string;
    quarter: number;
    ttdScore: string | null;
    ttrScore: string | null;
    ttdId: string | null;
    ttrId: string | null;
}

import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription, 
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useApiLoading } from '@/lib/utils/api-utils';
import { MONTHS } from '@/lib/constants/months-list';

interface TtdTtrEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CombinedTtdTtr | null; // Updated prop type
  onSuccess?: () => void; 
}

const ttdTtrIndicators: TtdTtrIndicator[] = ['TTD', 'TTR'];

// Extend form data state to hold both scores potentially
interface EditFormData extends Omit<UpdateTtdTtrDto, 'indicator' | 'score'> {
    ttdScore?: string;
    ttrScore?: string;
    month?: string; // Month name string
}

export const TtdTtrEditModal: React.FC<TtdTtrEditModalProps> = ({ 
  isOpen, 
  onClose, 
  record, 
  onSuccess 
}) => {
  const updateRecordMutation = useUpdateTtdTtrRecord();
  const createRecordMutation = useCreateTtdTtrRecord();
  const { withLoading, loading } = useApiLoading(); // Use generic loading state for now
  const [formData, setFormData] = useState<EditFormData>({});

  useEffect(() => {
    if (record) {
       // Convert month number string (e.g., "7") to month name string ("July")
       const monthIndex = parseInt(record.month, 10) - 1;
       const monthName = (monthIndex >= 0 && monthIndex < 12) ? MONTHS[monthIndex] : undefined;

      setFormData({
        ttdScore: record.ttdScore ?? '', // Use ?? '' to handle null
        ttrScore: record.ttrScore ?? '', // Use ?? '' to handle null
        month: monthName, // Store month name
        year: String(record.year),   
        quarter: record.quarter ? Number(record.quarter) : undefined,
      });
    } else {
      setFormData({});
    }
  }, [record]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
     // Ensure score inputs handle empty string correctly (don't send undefined immediately)
     if ((name === 'ttdScore' || name === 'ttrScore') && value === '') {
         setFormData(prev => ({ ...prev, [name]: '' }));
     } else {
        setFormData(prev => ({ ...prev, [name]: value }));
     }
  };

  const handleSelectChange = (name: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    const quarterNum = Number(formData.quarter);
    const ttdScoreNum = formData.ttdScore ? Number(formData.ttdScore) : NaN; // Use NaN if empty/undefined
    const ttrScoreNum = formData.ttrScore ? Number(formData.ttrScore) : NaN; // Use NaN if empty/undefined

    // --- Validation ---
    if (!formData.month || !MONTHS.includes(formData.month)){
        toast.error('Invalid Month selected.');
        return;
    }
    if (formData.quarter !== undefined && (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4)) {
        toast.error('Invalid Quarter. Must be a number between 1 and 4.');
        return;
    }
     // Validate TTD score only if the original record had one
     if (record.ttdId && formData.ttdScore !== undefined && formData.ttdScore !== '' && isNaN(ttdScoreNum)) {
        toast.error('Invalid TTD Score. Must be a number.');
        return;
    }
    // Validate TTR score only if the original record had one
    if (record.ttrId && formData.ttrScore !== undefined && formData.ttrScore !== '' && isNaN(ttrScoreNum)) {
        toast.error('Invalid TTR Score. Must be a number.');
        return;
    }
    // Check if at least one score is provided if editing
    if (record.ttdId && (formData.ttdScore === undefined || formData.ttdScore === '') && 
        record.ttrId && (formData.ttrScore === undefined || formData.ttrScore === '')){
         toast.error('At least one score (TTD or TTR) must be provided.');
         return;
    }
    // --- End Validation ---

    try {
      await withLoading(async () => {
        const updatePromises: Promise<any>[] = [];
        const commonPayload: Omit<UpdateTtdTtrDto, 'indicator' | 'score'> = {
            month: formData.month, // Send month name string
            year: formData.year ? String(formData.year) : undefined,
            quarter: formData.quarter ? Number(formData.quarter) : undefined,
        };
         // Filter undefined common fields
         Object.keys(commonPayload).forEach(key => commonPayload[key as keyof typeof commonPayload] === undefined && delete commonPayload[key as keyof typeof commonPayload]);

        // Prepare TTD update if ID exists and score is potentially changed
        if (record.ttdId && formData.ttdScore !== undefined) {
             const ttdPayload: UpdateTtdTtrDto & { id: string } = {
                id: record.ttdId,
                indicator: 'TTD',
                score: String(formData.ttdScore ?? ''), // Ensure score is explicitly string, even if empty
                ...commonPayload,
             };
            updatePromises.push(updateRecordMutation.mutateAsync(ttdPayload));
        }

        // Prepare TTR update if ID exists and score is potentially changed
        if (record.ttrId && formData.ttrScore !== undefined) {
             const ttrPayload: UpdateTtdTtrDto & { id: string } = {
                id: record.ttrId,
                indicator: 'TTR',
                score: String(formData.ttrScore ?? ''), // Ensure score is explicitly string, even if empty
                ...commonPayload,
             };
            updatePromises.push(updateRecordMutation.mutateAsync(ttrPayload));
        }
        
        if (updatePromises.length === 0) {
            toast.info("No changes detected to save.");
            onClose();
            return;
        }

        await Promise.all(updatePromises);
        toast.success('TTD/TTR record(s) updated successfully');
        onSuccess?.(); 
        onClose(); 
      });
    } catch (error) {
      console.error('Failed to update record(s): ', error);
      const message = (error as any)?.response?.data?.message || 'Failed to update record(s)';
      toast.error(message);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit TTD/TTR for {record.year}-{record.month}</DialogTitle> {/* Updated Title */}
          <DialogDescription>
            Update TTD and/or TTR scores for this period.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
             <div className="grid gap-4 py-4">
                 {/* TTD Score Input (Always shown) */}
                 <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="ttdScore" className="text-right">TTD Score (hrs)</Label>
                     <Input
                         id="ttdScore"
                         name="ttdScore"
                         type="number"
                         step="any"
                         value={formData.ttdScore || ''}
                         onChange={handleInputChange}
                         placeholder="Enter TTD score"
                         className="col-span-3"
                     />
                 </div>
                 {/* TTR Score Input (Always shown) */}
                 <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="ttrScore" className="text-right">TTR Score (hrs)</Label>
                     <Input
                         id="ttrScore"
                         name="ttrScore"
                         type="number"
                         step="any"
                         value={formData.ttrScore || ''}
                         onChange={handleInputChange}
                         placeholder="Enter TTR score"
                         className="col-span-3"
                     />
                 </div>
                 {/* Month Select - Using Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="month" className="text-right">Month</Label>
                   <Select 
                        value={formData.month || ''} // Value is month name
                        onValueChange={(value) => handleSelectChange('month', value)} // Store month name
                        required
                    >
                        <SelectTrigger id="month" className="col-span-3">
                        <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                        {MONTHS.map((monthName) => (
                            <SelectItem key={monthName} value={monthName}> 
                                {monthName}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                {/* Year Input */}
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">Year</Label>
                  <Input 
                    id="year" 
                    name="year"
                    type="number" 
                    value={formData.year || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g., 2024" 
                    className="col-span-3"
                    required 
                    />
                </div>
                {/* Quarter Input */}
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quarter" className="text-right">Quarter</Label>
                  <Input 
                    id="quarter" 
                    name="quarter"
                    type="number" 
                    min="1" 
                    max="4" 
                    value={formData.quarter || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g., 3" 
                    className="col-span-3"
                    required 
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                     <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                {/* Use generic loading state or mutation pending state */}
                <Button type="submit" disabled={loading || updateRecordMutation.isPending}>
                    {loading || updateRecordMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 