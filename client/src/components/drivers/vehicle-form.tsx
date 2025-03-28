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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X } from "lucide-react";
import { z } from "zod";
import { vehicleValidator, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";

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

        <FormField
          control={control}
          name={`vehicles.${index}.vehicleType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Tipo de Veículo
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || VEHICLE_TYPES.LEVE_TODOS}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Veículos Leves */}
                  <div className="px-2 py-1.5 font-semibold text-primary">
                    -- Veículos Leves --
                  </div>
                  <SelectItem value={VEHICLE_TYPES.LEVE_TODOS}>Todos os leves</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.LEVE_FIORINO}>Fiorino</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.LEVE_TOCO}>Toco</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.LEVE_VLC}>VLC</SelectItem>
                  
                  {/* Veículos Médios */}
                  <div className="px-2 py-1.5 font-semibold text-primary mt-2">
                    -- Veículos Médios --
                  </div>
                  <SelectItem value={VEHICLE_TYPES.MEDIO_TODOS}>Todos os médios</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.MEDIO_BITRUCK}>Bitruck</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.MEDIO_TRUCK}>Truck</SelectItem>
                  
                  {/* Veículos Pesados */}
                  <div className="px-2 py-1.5 font-semibold text-primary mt-2">
                    -- Veículos Pesados --
                  </div>
                  <SelectItem value={VEHICLE_TYPES.PESADO_TODOS}>Todos os pesados</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.PESADO_BITREM}>Bitrem</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.PESADO_CARRETA}>Carreta</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.PESADO_CARRETA_LS}>Carreta LS</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.PESADO_RODOTREM}>Rodotrem</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.PESADO_VANDERLEIA}>Vanderléia</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name={`vehicles.${index}.bodyType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                Tipo de Carroceria
              </FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || BODY_TYPES.FECHADA}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a carroceria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={BODY_TYPES.BAU}>Baú</SelectItem>
                  <SelectItem value={BODY_TYPES.GRANELEIRA}>Graneleira</SelectItem>
                  <SelectItem value={BODY_TYPES.BASCULANTE}>Basculante</SelectItem>
                  <SelectItem value={BODY_TYPES.PLATAFORMA}>Plataforma</SelectItem>
                  <SelectItem value={BODY_TYPES.TANQUE}>Tanque</SelectItem>
                  <SelectItem value={BODY_TYPES.FRIGORIFICA}>Frigorífica</SelectItem>
                  <SelectItem value={BODY_TYPES.PORTA_CONTEINER}>Porta Contêiner</SelectItem>
                  <SelectItem value={BODY_TYPES.SIDER}>Sider</SelectItem>
                  <SelectItem value={BODY_TYPES.CACAMBA}>Caçamba</SelectItem>
                  <SelectItem value={BODY_TYPES.ABERTA}>Aberta</SelectItem>
                  <SelectItem value={BODY_TYPES.FECHADA}>Fechada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
