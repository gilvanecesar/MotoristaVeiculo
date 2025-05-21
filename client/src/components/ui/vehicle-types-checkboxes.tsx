import React from 'react';
import { VEHICLE_CATEGORIES, VEHICLE_TYPES_BY_CATEGORY, getVehicleTypeNameOnly } from '@/lib/utils/vehicle-types';

function VehicleTypesCheckboxes({
  selectedVehicleTypes,
  onChange,
}: {
  selectedVehicleTypes: string[];
  onChange: (newSelectedTypes: string[]) => void;
}) {
  return (
    <div className="w-full border rounded-md p-4">
      {/* Leve */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2">Leve</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.LEVE].map((type) => {
            const isAllOption = type.endsWith('_todos');
            const displayName = getVehicleTypeNameOnly(type);
            
            return (
              <div key={type} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`vehicle-type-${type}`}
                  checked={selectedVehicleTypes.includes(type)}
                  style={{ 
                    width: '24px', 
                    height: '24px',
                    margin: '0px 8px 0px 0px'
                  }}
                  onChange={(e) => {
                    let newTypes = [...selectedVehicleTypes];
                    
                    if (isAllOption) {
                      if (e.target.checked) {
                        // Selecionando "Todos" - só seleciona ele
                        newTypes = [type];
                      } else {
                        // Desmarcando "Todos" - limpa todas as seleções
                        newTypes = [];
                      }
                    } else {
                      if (e.target.checked) {
                        // Selecionando um tipo específico
                        newTypes.push(type);
                        // Remove o "Todos" se estiver marcado
                        const todosType = VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.LEVE].find(t => t.endsWith('_todos'));
                        if (todosType && newTypes.includes(todosType)) {
                          newTypes = newTypes.filter(t => t !== todosType);
                        }
                      } else {
                        // Desmarcando um tipo específico
                        newTypes = newTypes.filter(t => t !== type);
                      }
                    }
                    
                    console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                    onChange(newTypes);
                  }}
                />
                <label 
                  htmlFor={`vehicle-type-${type}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {displayName}
                </label>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Médio */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-2">Médio</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.MEDIO].map((type) => {
            const isAllOption = type.endsWith('_todos');
            const displayName = getVehicleTypeNameOnly(type);
            
            return (
              <div key={type} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`vehicle-type-${type}`}
                  checked={selectedVehicleTypes.includes(type)}
                  style={{ 
                    width: '24px', 
                    height: '24px',
                    margin: '0px 8px 0px 0px'
                  }}
                  onChange={(e) => {
                    let newTypes = [...selectedVehicleTypes];
                    
                    if (isAllOption) {
                      if (e.target.checked) {
                        // Selecionando "Todos" - só seleciona ele
                        newTypes = [type];
                      } else {
                        // Desmarcando "Todos" - limpa todas as seleções
                        newTypes = [];
                      }
                    } else {
                      if (e.target.checked) {
                        // Selecionando um tipo específico
                        newTypes.push(type);
                        // Remove o "Todos" se estiver marcado
                        const todosType = VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.MEDIO].find(t => t.endsWith('_todos'));
                        if (todosType && newTypes.includes(todosType)) {
                          newTypes = newTypes.filter(t => t !== todosType);
                        }
                      } else {
                        // Desmarcando um tipo específico
                        newTypes = newTypes.filter(t => t !== type);
                      }
                    }
                    
                    console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                    onChange(newTypes);
                  }}
                />
                <label 
                  htmlFor={`vehicle-type-${type}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {displayName}
                </label>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Pesado */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Pesado</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.PESADO].map((type) => {
            const isAllOption = type.endsWith('_todos');
            const displayName = getVehicleTypeNameOnly(type);
            
            return (
              <div key={type} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`vehicle-type-${type}`}
                  checked={selectedVehicleTypes.includes(type)}
                  style={{ 
                    width: '24px', 
                    height: '24px',
                    margin: '0px 8px 0px 0px'
                  }}
                  onChange={(e) => {
                    let newTypes = [...selectedVehicleTypes];
                    
                    if (isAllOption) {
                      if (e.target.checked) {
                        // Selecionando "Todos" - só seleciona ele
                        newTypes = [type];
                      } else {
                        // Desmarcando "Todos" - limpa todas as seleções
                        newTypes = [];
                      }
                    } else {
                      if (e.target.checked) {
                        // Selecionando um tipo específico
                        newTypes.push(type);
                        // Remove o "Todos" se estiver marcado
                        const todosType = VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.PESADO].find(t => t.endsWith('_todos'));
                        if (todosType && newTypes.includes(todosType)) {
                          newTypes = newTypes.filter(t => t !== todosType);
                        }
                      } else {
                        // Desmarcando um tipo específico
                        newTypes = newTypes.filter(t => t !== type);
                      }
                    }
                    
                    console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                    onChange(newTypes);
                  }}
                />
                <label 
                  htmlFor={`vehicle-type-${type}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {displayName}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VehicleTypesCheckboxes;