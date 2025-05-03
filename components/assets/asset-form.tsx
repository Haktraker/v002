'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash } from 'lucide-react';

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

import { createAsset, updateAsset } from '@/lib/api/endpoints/assets-inventory';
import { IAssetInventory, AssetInventoryPayload, IMachine, IServer } from '@/lib/api/types';

// Define the form schema with zod
const machineSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  IP: z.string().min(1, 'IP address is required').regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address format'),
  User: z.string().min(1, 'User is required'),
  Notes: z.string().min(1, 'Notes are required'),
  affectedSystem: z.string().optional(),
});

const serverSchema = z.object({
  Name: z.string().optional(),
  IP: z.string().optional(),
  User: z.string().optional(),
  Notes: z.string().optional(),
  affectedSystem: z.string().optional(),
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
      machines: [{ Name: '', IP: '', User: '', Notes: '', affectedSystem: '' }],
      servers: [],
    },
  });
  
  // Use field arrays for dynamic machines and servers
  const { 
    fields: machineFields, 
    append: appendMachine, 
    remove: removeMachine 
  } = useFieldArray({
    control: form.control,
    name: "machines",
  });
  
  const { 
    fields: serverFields, 
    append: appendServer, 
    remove: removeServer 
  } = useFieldArray({
    control: form.control,
    name: "servers",
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
  
  // Add empty machine
  const handleAddMachine = () => {
    appendMachine({ Name: '', IP: '', User: '', Notes: '', affectedSystem: '' });
  };
  
  // Add empty server
  const handleAddServer = () => {
    appendServer({ Name: '', IP: '', User: '', Notes: '', affectedSystem: '' });
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
        
        {/* Machines Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Machines</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddMachine}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </div>
          
          <div className="space-y-4">
            {machineFields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-md">Machine {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                      name={`machines.${index}.affectedSystem`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Affected System</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter affected system" {...field} />
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
                  onClick={handleAddMachine}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Machine
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Servers Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Servers</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddServer}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Server
            </Button>
          </div>
          
          <div className="space-y-4">
            {serverFields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-md">Server {index + 1}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                      name={`servers.${index}.affectedSystem`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Affected System</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter affected system" {...field} />
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
            
            {serverFields.length === 0 && (
              <div className="text-center py-4 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">No servers added yet</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={handleAddServer}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Server
                </Button>
              </div>
            )}
          </div>
        </div>
        
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