import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { z } from "zod";
import { vehicleValidator } from "@shared/schema";

type VehicleFormProps = {
  index: number;
  control: Control<any>;
  onRemove: () => void;
};

type VehicleFields = z.infer<typeof vehicleValidator>;

export function VehicleForm({ index, control, onRemove }: VehicleFormProps) {
  return (
    <div className="vehicle-form bg-slate-50 p-4 rounded-md border border-slate-200">
      <div className="flex justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700">Dados do Veículo</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-500"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name={`vehicles.${index}.plate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Placa
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="AAA-0000" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`vehicles.${index}.brand`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Marca
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`vehicles.${index}.model`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Modelo
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`vehicles.${index}.year`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Ano
              </FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number" 
                  min="1900" 
                  max={new Date().getFullYear() + 1}
                  onChange={(e) => {
                    field.onChange(parseInt(e.target.value, 10));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`vehicles.${index}.color`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Cor
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`vehicles.${index}.renavam`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Renavam</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
