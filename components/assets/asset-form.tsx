'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash, Upload } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { createAsset, updateAsset } from '@/lib/api/endpoints/assets-inventory';
import { IAssetInventory, AssetInventoryPayload, IMachine, IServer } from '@/lib/api/types';

// Define the form schema with zod
const machineSchema = z.object({
  Name: z.string().min(1, { message: "Name is required" }),
  IP: z.string().min(1, { message: "IP is required" }),
  User: z.string().min(1, { message: "User is required" }),
  Notes: z.string().min(1, { message: "Notes is required" }),
  operatingSystem: z.string().optional(),
});

const serverSchema = z.object({
  Name: z.string().optional(),
  IP: z.string().optional(),
  User: z.string().optional(),
  Notes: z.string().optional(),
  operatingSystem: z.string().optional(),
});

const formSchema = z.object({
  BU: z.string().min(1, 'Business Unit is required'),
  Function: z.string().min(1, 'Function is required'),
  Location: z.string().min(1, 'Location is required'),
  Server: z.boolean(),
  Ecommerce: z.boolean(),
  SecuritySolutions: z.string().optional(),
  NetworkInfrastructure: z.string().optional(),
  Notes: z.string().optional(),
  machines: z.array(machineSchema),
  servers: z.array(serverSchema),
});

export type AssetFormValues = z.infer<typeof formSchema>;

interface AssetFormProps {
  asset?: IAssetInventory;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AssetForm = ({ asset, onSuccess, onCancel }: AssetFormProps) => {
  const [loading, setLoading] = useState(false);
  const isEditing = !!asset;
  const [activeTab, setActiveTab] = useState<'machines' | 'servers'>('machines');
  const [bulkMode, setBulkMode] = useState<'manual' | 'csv'>('manual');
  
  // Initialize form with default values or the asset data if editing
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: asset ? {
      ...asset,
    } : {
      BU: '',
      Function: '',
      Location: '',
      Server: false,
      Ecommerce: false,
      SecuritySolutions: '',
      NetworkInfrastructure: '',
      Notes: '',
      machines: [{ Name: '', IP: '', User: '', Notes: '', operatingSystem: '' }],
      servers: [],
    },
  });
  
  // Use field arrays for dynamic machines and servers
  const { 
    fields: machineFields, 
    append: appendMachine, 
    remove: removeMachine,
    replace: replaceMachines
  } = useFieldArray({
    control: form.control,
    name: "machines",
  });
  
  const { 
    fields: serverFields, 
    append: appendServer, 
    remove: removeServer,
    replace: replaceServers
  } = useFieldArray({
    control: form.control,
    name: "servers",
  });
  
  // Validate machine data from CSV
  const validateMachineRow = (row: any) => {
    if (!row.Name || !row.IP || !row.User || !row.Notes) {
      return {
        isValid: false,
        error: `Required fields missing in row: ${JSON.stringify(row)}`
      };
    }
    return { isValid: true };
  };
  
  // Validate server data from CSV
  const validateServerRow = (row: any) => {
    return { isValid: true }; // Servers have optional fields so validation is simpler
  };
  
  // Table data hook for machines
  const machineTableData = useTableData<IMachine>({
    requiredFields: ['Name', 'IP', 'User', 'Notes'],
    validateRow: validateMachineRow,
  });
  
  // Table data hook for servers
  const serverTableData = useTableData<IServer>({
    requiredFields: ['Name', 'IP', 'User', 'Notes'],
    validateRow: validateServerRow,
  });
  
  // Submit handler
  const onSubmit = async (data: AssetFormValues) => {
    setLoading(true);
    
    try {
      if (isEditing && asset) {
        // Update existing asset
        await updateAsset(asset._id, data);
        toast.success('Asset updated successfully');
      } else {
        // Create new asset
        await createAsset(data);
        toast.success('Asset created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while saving the asset');
    } finally {
      setLoading(false);
    }
  };
  
  // Add bulk items
  const handleApplyBulkMachines = () => {
    replaceMachines([...form.getValues().machines, ...machineTableData.data]);
    machineTableData.resetData();
    setBulkMode('manual');
    toast.success(`Added ${machineTableData.data.length} machines to the form`);
  };
  
  const handleApplyBulkServers = () => {
    replaceServers([...form.getValues().servers, ...serverTableData.data]);
    serverTableData.resetData();
    setBulkMode('manual');
    toast.success(`Added ${serverTableData.data.length} servers to the form`);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <FormField
            control={form.control}
            name="BU"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Unit *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter business unit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="Function"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Function *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter function" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="Location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Switches */}
          <div className="flex flex-row items-center gap-6">
            <FormField
              control={form.control}
              name="Server"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2">
                  <FormLabel>Server</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="Ecommerce"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2">
                  <FormLabel>E-commerce</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          {/* Additional Information */}
          <FormField
            control={form.control}
            name="SecuritySolutions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Solutions</FormLabel>
                <FormControl>
                  <Input placeholder="Enter security solutions" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="NetworkInfrastructure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Network Infrastructure</FormLabel>
                <FormControl>
                  <Input placeholder="Enter network infrastructure" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="Notes"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any additional notes" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Machines and Servers with Bulk Upload */}
        <Tabs defaultValue="machines" onValueChange={(value) => setActiveTab(value as 'machines' | 'servers')}>
          <TabsList className="mb-4">
            <TabsTrigger value="machines">Machines</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
          </TabsList>
          
          {/* Machines Tab */}
          <TabsContent value="machines">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Machines ({machineFields.length})</h3>
              <div className="flex gap-2">
                <Tabs value={bulkMode} onValueChange={(v) => setBulkMode(v as 'manual' | 'csv')} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="csv">Bulk Upload</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {bulkMode === 'manual' ? (
              <>
                <div className="space-y-4">
                  {machineFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-md">Machine {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMachine(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`machines.${index}.Name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter machine name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`machines.${index}.IP`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IP Address *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 192.168.1.1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`machines.${index}.User`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>User *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter user" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`machines.${index}.operatingSystem`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Operating System</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Windows 10, Linux" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`machines.${index}.Notes`}
                            render={({ field }) => (
                              <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Notes *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter notes about this machine" 
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {machineFields.length === 0 && (
                    <div className="text-center py-4 border rounded-md bg-muted/20">
                      <p className="text-muted-foreground">No machines added yet</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={() => appendMachine({ Name: '', IP: '', User: '', Notes: '', operatingSystem: '' })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Machine
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // CSV Upload UI
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload Machines</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with multiple machines to add them in bulk
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-md border text-sm">
                      <h4 className="font-medium mb-2">CSV Format Guidelines:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Required columns:</strong> Name, IP, User, Notes</li>
                        <li><strong>Optional columns:</strong> operatingSystem</li>
                        <li>Column names must match exactly (case-sensitive)</li>
                        <li>Ensure the first row contains the column headers</li>
                        <li>Example: <code>Name,IP,User,Notes,operatingSystem</code></li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={machineTableData.handleFileChange}
                        disabled={machineTableData.isProcessing || machineTableData.isSubmitting}
                      />
                      <Button
                        type="button"
                        onClick={machineTableData.handleProcessCSV}
                        disabled={!machineTableData.csvFile || machineTableData.isProcessing}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Process CSV
                      </Button>
                    </div>
                    
                    {machineTableData.data.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          CSV should have columns: Name, IP, User, Notes, operatingSystem (optional)
                        </p>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {machineTableData.currentPageData.map((row, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.IP}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.User}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.operatingSystem || 'N/A'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination controls */}
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Page {machineTableData.pagination.currentPage} of {machineTableData.totalPages}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={machineTableData.previousPage}
                              disabled={machineTableData.pagination.currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              onClick={machineTableData.nextPage}
                              disabled={machineTableData.pagination.currentPage === machineTableData.totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={machineTableData.resetData}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleApplyBulkMachines}
                            disabled={machineTableData.data.length === 0}
                          >
                            Add to Form
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Servers Tab */}
          <TabsContent value="servers">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Servers ({serverFields.length})</h3>
              <div className="flex gap-2">
                <Tabs value={bulkMode} onValueChange={(v) => setBulkMode(v as 'manual' | 'csv')} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="csv">Bulk Upload</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {bulkMode === 'manual' ? (
              <>
                <div className="space-y-4">
                  {serverFields.map((field, index) => (
                    <Card key={field.id}>
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-md">Server {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeServer(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`servers.${index}.Name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter server name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`servers.${index}.IP`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IP Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 192.168.1.1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`servers.${index}.User`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>User</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter user" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`servers.${index}.operatingSystem`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Operating System</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Windows Server, Linux" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`servers.${index}.Notes`}
                            render={({ field }) => (
                              <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter notes about this server" 
                                    className="min-h-[80px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => appendServer({ Name: '', IP: '', User: '', Notes: '', operatingSystem: '' })}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Server
                  </Button>
                </div>
              </>
            ) : (
              // CSV Upload UI
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload Servers</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with multiple servers to add them in bulk
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-md border text-sm">
                      <h4 className="font-medium mb-2">CSV Format Guidelines:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Column names:</strong> Name, IP, User, Notes, operatingSystem</li>
                        <li>All fields are optional for servers, but column headers are required</li>
                        <li>Column names must match exactly (case-sensitive)</li>
                        <li>Ensure the first row contains the column headers</li>
                        <li>Example: <code>Name,IP,User,Notes,operatingSystem</code></li>
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={serverTableData.handleFileChange}
                        disabled={serverTableData.isProcessing || serverTableData.isSubmitting}
                      />
                      <Button
                        type="button"
                        onClick={serverTableData.handleProcessCSV}
                        disabled={!serverTableData.csvFile || serverTableData.isProcessing}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Process CSV
                      </Button>
                    </div>
                    
                    {serverTableData.data.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          CSV should have columns: Name, IP, User, Notes, operatingSystem (optional)
                        </p>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {serverTableData.currentPageData.map((row, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Name || 'N/A'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.IP || 'N/A'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.User || 'N/A'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.operatingSystem || 'N/A'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.Notes || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination controls */}
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Page {serverTableData.pagination.currentPage} of {serverTableData.totalPages}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={serverTableData.previousPage}
                              disabled={serverTableData.pagination.currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              onClick={serverTableData.nextPage}
                              disabled={serverTableData.pagination.currentPage === serverTableData.totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={serverTableData.resetData}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleApplyBulkServers}
                            disabled={serverTableData.data.length === 0}
                          >
                            Add to Form
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Asset" : "Create Asset"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};