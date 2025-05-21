import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { LocationInput } from "@/components/location/location-input";
import { Control } from "react-hook-form";

interface CityFieldsVerticalProps {
  form: any;
  control: Control<any>;
  hasMultipleDestinations: boolean;
  isReadOnly?: boolean;
}

/**
 * Componente para campos de cidade/estado de origem e destino alinhados verticalmente
 */
export function CityFieldsVertical({ 
  form, 
  control, 
  hasMultipleDestinations, 
  isReadOnly = false 
}: CityFieldsVerticalProps) {
  return (
    <div className="md:col-span-2 grid grid-cols-1 gap-6">
      {/* Cidade de Origem - Alinhado Verticalmente */}
      <div>
        <FormField
          control={control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade de Origem</FormLabel>
              <FormControl>
                <LocationInput
                  readOnly={isReadOnly}
                  value={field.value}
                  onChange={field.onChange}
                  stateField="originState"
                  stateValue={form.watch("originState")}
                  onStateChange={(state) => form.setValue("originState", state)}
                />
              </FormControl>
              {form.formState.errors.origin && (
                <FormMessage>{form.formState.errors.origin.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </div>
      
      {/* Cidade de Destino - Alinhado Verticalmente */}
      {!hasMultipleDestinations && (
        <div>
          <FormField
            control={control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade de Destino</FormLabel>
                <FormControl>
                  <LocationInput
                    readOnly={isReadOnly}
                    value={field.value || ""}
                    onChange={field.onChange}
                    stateField="destinationState"
                    stateValue={form.watch("destinationState")}
                    onStateChange={(state) =>
                      form.setValue("destinationState", state)
                    }
                  />
                </FormControl>
                {form.formState.errors.destination && (
                  <FormMessage>
                    {form.formState.errors.destination.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}