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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ReportNonComplianceGapsOverview,
  UpdateReportNonComplianceGapsOverviewDto,
  NonComplianceGapDetailItem,
  useUpdateReportNonComplianceGapsOverview,
  COMPLIANCE_TYPES,
  PRIORITY_LEVELS,
  STATUS_TYPES,
  ComplianceType,
  PriorityLevel,
  StatusType
} from '@/lib/api/endpoints/reports/non-compliance-gaps-overview';
import { toast } from 'sonner';
import { Loader2, PlusCircle, XCircle, Sparkles } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { MONTHS } from '@/lib/constants/months-list';
import { ChatService } from '@/lib/api/chat-service';

interface NonComplianceGapsOverviewEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportToEdit: ReportNonComplianceGapsOverview | null;
  onSuccess: () => void;
}

const defaultDetailItem: Omit<NonComplianceGapDetailItem, '_id'> = {
  quarter: 1,
  issueName: '',
  relatedStandard: '',
  priorityLevel: PRIORITY_LEVELS[0],
  recommendation: '',
  status: STATUS_TYPES[0],
  responsiblePerson: '',
  user: '',
  bu: '',
};

export function NonComplianceGapsOverviewEditDialog({
  isOpen,
  onClose,
  reportToEdit,
  onSuccess,
}: NonComplianceGapsOverviewEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Omit<UpdateReportNonComplianceGapsOverviewDto, 'details'>>>({});
  const [details, setDetails] = useState<NonComplianceGapDetailItem[]>([]);
  const updateMutation = useUpdateReportNonComplianceGapsOverview();

  // State for AI Chatbot Interaction
  const [isAiResponseDialogOpen, setIsAiResponseDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<{ summary: string; recommendations: string[] } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (reportToEdit) {
      const { _id, createdAt, updatedAt, details: reportDetails, ...editableData } = reportToEdit;
      setFormData(editableData);
      setDetails(reportDetails.map(d => ({ ...d }))); // Deep copy for editing
    } else {
      setFormData({});
      setDetails([]);
    }
  }, [reportToEdit, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Omit<UpdateReportNonComplianceGapsOverviewDto, 'details'>, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (
    index: number,
    field: keyof NonComplianceGapDetailItem,
    value: string | number
  ) => {
    const newDetails = [...details];
    if (field === 'quarter') {
      newDetails[index].quarter = value === '' ? undefined : Number(value);
    } else {
      (newDetails[index] as any)[field] = value;
    }
    setDetails(newDetails);
  };
  
  const handleDetailPriorityChange = (index: number, value: PriorityLevel) => {
    const newDetails = [...details];
    newDetails[index].priorityLevel = value;
    setDetails(newDetails);
  };

  const handleDetailStatusChange = (index: number, value: StatusType) => {
    const newDetails = [...details];
    newDetails[index].status = value;
    setDetails(newDetails);
  };

  const addDetailItem = () => {
    setDetails([...details, { ...defaultDetailItem }]);
  };

  const removeDetailItem = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportToEdit) return;

    // Basic Validation
    if (!formData.year || !formData.month || !formData.compliance || !formData.score) {
        toast.error("Year, Month, Compliance, and Score are required.");
        return;
    }
    for (const detail of details) {
        if (!detail.issueName || !detail.priorityLevel || !detail.status) {
            toast.error("For each detail: Issue Name, Priority, and Status are required.");
            return;
        }
    }

    const updateData: UpdateReportNonComplianceGapsOverviewDto = {
      ...formData,
      year: formData.year || reportToEdit.year,
      month: formData.month || reportToEdit.month,
      compliance: formData.compliance || reportToEdit.compliance,
      score: formData.score || reportToEdit.score,
      details: details.map(({ _id, ...item }) => item), // Send without _id if not needed by backend for sub-item updates
    };

    try {
      await updateMutation.mutateAsync({ id: reportToEdit._id, updatedData: updateData });
      toast.success("Non-Compliance Gap record updated successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update record:", error);
      // Error toast is handled by the mutation hook itself
    }
  };

  const handleAskAi = async () => {
    if (!reportToEdit && Object.keys(formData).length === 0 && details.length === 0) {
      toast.error("No data to analyze. Please fill in some report details first.");
      return;
    }
    
    setIsAiLoading(true);
    const currentReportData = {
      ...reportToEdit,
      ...formData,
      details: details.map(({ _id, ...item }) => item),
    };

    try {
      const rawResponseString = await ChatService.sendPrompt(currentReportData);
      let parsedAiResponse: { summary: string; recommendations: string[] } | null = null;

      if (typeof rawResponseString === 'string') {
        try {
          parsedAiResponse = JSON.parse(rawResponseString);
        } catch (parseError) {
          console.error("AI response JSON parsing error:", parseError, "Raw response:", rawResponseString);
          toast.error("Failed to parse AI assistant's response.");
          setAiResponse({ summary: "Could not understand the AI's response. It was not valid JSON.", recommendations: [] });
          setIsAiResponseDialogOpen(true);
          setIsAiLoading(false); // Ensure loading is stopped
          return; // Exit if parsing fails
        }
      } else if (typeof rawResponseString === 'object' && rawResponseString !== null && typeof (rawResponseString as any).summary === 'string' && Array.isArray((rawResponseString as any).recommendations)){
        // Fallback if it was already an object (less likely based on the error, but safe to check)
        parsedAiResponse = rawResponseString as { summary: string; recommendations: string[] };
      } else {
        // If it's neither a string nor the expected object structure directly
        console.error("AI response was not a string or a valid object:", rawResponseString);
        toast.error("Received an invalid response type from the AI assistant.");
        setAiResponse({ summary: "The AI assistant provided a response in an unknown format.", recommendations: [] });
        setIsAiResponseDialogOpen(true);
        setIsAiLoading(false); // Ensure loading is stopped
        return;
      }

      if (parsedAiResponse && typeof parsedAiResponse.summary === 'string' && Array.isArray(parsedAiResponse.recommendations)) {
        setAiResponse(parsedAiResponse);
        setIsAiResponseDialogOpen(true);
      } else {
        console.error("Parsed AI response format unexpected:", parsedAiResponse, "Original raw string:", rawResponseString);
        toast.error("Received an unexpected response structure from the AI assistant after parsing.");
        setAiResponse({ summary: "Could not retrieve a valid analysis. The response data structure was unexpected.", recommendations: [] });
        setIsAiResponseDialogOpen(true);
      }
    } catch (error) {
      console.error("Error asking AI:", error);
      let errorMessage = "Failed to get insights from Haktrak AI.";
      if (error instanceof Error && error.message.includes("User not authenticated")) {
        errorMessage = "Authentication error. Please log in again to use the AI assistant.";
      } else if (error instanceof Error && error.message.includes("Chat service is not configured")) {
         errorMessage = "AI assistant is not configured. Please contact support.";
      }
      toast.error(errorMessage);
      // Optionally, set a specific error message in aiResponse to display in the dialog
      setAiResponse({ summary: errorMessage, recommendations: ["Please check your connection or try again later."] });
      setIsAiResponseDialogOpen(true); 
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleInteractOutside = (event: Event) => {
    if (updateMutation.isPending || isAiLoading) { // Prevent closing if AI is also loading
      event.preventDefault();
    }
  };

  if (!reportToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl" onInteractOutside={handleInteractOutside}>
        <DialogHeader>
          <DialogTitle>Edit Non-Compliance Gaps Overview</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
        <ScrollArea className="max-h-[75vh] p-1 pr-3">
          <div className="grid gap-4 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" value={formData.year || ''} onChange={handleInputChange} placeholder="e.g., 2024" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select value={formData.month || ''} onValueChange={(value) => handleSelectChange('month', value)} required>
                        <SelectTrigger id="month"><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="compliance">Compliance Standard</Label>
                    <Select value={formData.compliance || ''} onValueChange={(value) => handleSelectChange('compliance', value as ComplianceType)} required>
                        <SelectTrigger id="compliance"><SelectValue placeholder="Select Compliance" /></SelectTrigger>
                        <SelectContent>
                        {COMPLIANCE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="score">Overall Score</Label>
                    <Input id="score" name="score" value={formData.score || ''} onChange={handleInputChange} placeholder="e.g., 85%" required />
                </div>
            </div>

            <div className="my-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-lg font-semibold">Gap Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetailItem}> <PlusCircle className="mr-2 h-4 w-4" /> Add Detail</Button>
              </div>
              {details.map((detail, index) => (
                <div key={index} className="border p-4 rounded-md mb-4 space-y-3 bg-muted/20">
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDetailItem(index)} className="text-destructive hover:text-destructive-hover">
                        <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`detail-issueName-${index}`}>Issue Name</Label>
                      <Input id={`detail-issueName-${index}`} value={detail.issueName || ''} onChange={(e) => handleDetailChange(index, 'issueName', e.target.value)} required placeholder="e.g., Unpatched Server"/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`detail-quarter-${index}`}>Quarter</Label>
                      <Input id={`detail-quarter-${index}`} type="number" value={detail.quarter === undefined ? '' : detail.quarter} onChange={(e) => handleDetailChange(index, 'quarter', e.target.value)} placeholder="e.g., 1, 2, 3, 4"/>
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor={`detail-priority-${index}`}>Priority Level</Label>
                      <Select 
                        value={detail.priorityLevel || ''} 
                        onValueChange={(value) => handleDetailPriorityChange(index, value as PriorityLevel)} 
                        required
                      >
                        <SelectTrigger id={`detail-priority-${index}`}><SelectValue placeholder="Select Priority" /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_LEVELS.map(level => <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`detail-status-${index}`}>Status</Label>
                      <Select 
                        value={detail.status || ''} 
                        onValueChange={(value) => handleDetailStatusChange(index, value as StatusType)} 
                        required
                      >
                        <SelectTrigger id={`detail-status-${index}`}><SelectValue placeholder="Select Status" /></SelectTrigger>
                        <SelectContent>
                          {STATUS_TYPES.map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`detail-relatedStandard-${index}`}>Related Standard/Control</Label>
                      <Input id={`detail-relatedStandard-${index}`} value={detail.relatedStandard || ''} onChange={(e) => handleDetailChange(index, 'relatedStandard', e.target.value)} placeholder="e.g., NIST AC-1"/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`detail-responsiblePerson-${index}`}>Responsible Person</Label>
                      <Input id={`detail-responsiblePerson-${index}`} value={detail.responsiblePerson || ''} onChange={(e) => handleDetailChange(index, 'responsiblePerson', e.target.value)} placeholder="e.g., John Doe"/>
                    </div>
                     <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <Label htmlFor={`detail-recommendation-${index}`}>Recommendation</Label>
                      <Textarea id={`detail-recommendation-${index}`} value={detail.recommendation || ''} onChange={(e) => handleDetailChange(index, 'recommendation', e.target.value)} placeholder="Detailed recommendation..."/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`detail-user-${index}`}>User (Optional)</Label>
                      <Input id={`detail-user-${index}`} value={detail.user || ''} onChange={(e) => handleDetailChange(index, 'user', e.target.value)} placeholder="e.g., System Admin"/>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`detail-bu-${index}`}>Business Unit (Optional)</Label>
                      <Input id={`detail-bu-${index}`} value={detail.bu || ''} onChange={(e) => handleDetailChange(index, 'bu', e.target.value)} placeholder="e.g., IT Department"/>
                    </div>
                  </div>
                </div>
              ))}
              {details.length === 0 && <p className='text-sm text-muted-foreground text-center py-4'>No gap details added yet. Click "Add Detail" to start.</p>}
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t mt-2">
            <Button type="button" variant="outline" onClick={handleAskAi} disabled={updateMutation.isPending || isAiLoading}>
              {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Ask Haktrak AI
            </Button>
            <div className="flex-grow" /> {/* Spacer */}
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={updateMutation.isPending || isAiLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMutation.isPending || isAiLoading}>
              {(updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      {/* AI Response Dialog */}
      {isAiResponseDialogOpen && (
        <Dialog open={isAiResponseDialogOpen} onOpenChange={setIsAiResponseDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>AI Assistant Insights</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-3">
              <div className="py-4 pr-2 space-y-4">
                {aiResponse ? (
                  <>
                    <div>
                      <h4 className="font-semibold mb-1 text-foreground">Summary:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResponse.summary}</p>
                    </div>
                    {aiResponse.recommendations && aiResponse.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1 text-foreground">Recommendations:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          {aiResponse.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(aiResponse.recommendations?.length === 0 && !aiResponse.summary.startsWith("Failed") && !aiResponse.summary.startsWith("Could not")) && (
                       <p className="text-sm text-muted-foreground">No specific recommendations provided for this analysis.</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading insights...</p>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button onClick={() => setIsAiResponseDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
