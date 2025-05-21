import React from 'react';
import { VEHICLE_TYPES } from '@shared/schema';

// Componente simples para exibir os checkboxes de tipos de veículo
function VehicleTypesCheckboxes({
  selectedVehicleTypes,
  onChange,
}: {
  selectedVehicleTypes: string[];
  onChange: (newSelectedTypes: string[]) => void;
}) {
  // Função auxiliar para atualizar a seleção
  const updateSelection = (type: string, isChecked: boolean) => {
    let newTypes = [...selectedVehicleTypes];
    
    if (isChecked) {
      // Se está marcando, adiciona o tipo
      if (!newTypes.includes(type)) {
        newTypes.push(type);
      }
      
      // Se está marcando um tipo específico, desmarca o "Todos" da categoria
      if (type !== "leve_todos" && type.startsWith("leve_")) {
        newTypes = newTypes.filter(t => t !== "leve_todos");
      } else if (type !== "medio_todos" && type.startsWith("medio_")) {
        newTypes = newTypes.filter(t => t !== "medio_todos");
      } else if (type !== "pesado_todos" && type.startsWith("pesado_")) {
        newTypes = newTypes.filter(t => t !== "pesado_todos");
      }
      
      // Se está marcando "Todos", desmarca os específicos da categoria
      if (type === "leve_todos") {
        newTypes = newTypes.filter(t => !t.startsWith("leve_") || t === "leve_todos");
      } else if (type === "medio_todos") {
        newTypes = newTypes.filter(t => !t.startsWith("medio_") || t === "medio_todos");
      } else if (type === "pesado_todos") {
        newTypes = newTypes.filter(t => !t.startsWith("pesado_") || t === "pesado_todos");
      }
    } else {
      // Se está desmarcando, remove o tipo
      newTypes = newTypes.filter(t => t !== type);
    }
    
    console.log("Tipos de veículo selecionados:", newTypes);
    onChange(newTypes);
  };
  
  return (
    <div className="border rounded-md p-4">
      {/* Leve */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Leve</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="leve-todos"
              checked={selectedVehicleTypes.includes("leve_todos")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("leve_todos", e.target.checked)}
            />
            <label htmlFor="leve-todos" className="cursor-pointer">Todos</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="leve-vlc"
              checked={selectedVehicleTypes.includes("leve_vlc")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("leve_vlc", e.target.checked)}
            />
            <label htmlFor="leve-vlc" className="cursor-pointer">VLC</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="leve-fiorino"
              checked={selectedVehicleTypes.includes("leve_fiorino")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("leve_fiorino", e.target.checked)}
            />
            <label htmlFor="leve-fiorino" className="cursor-pointer">Fiorino</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="leve-toco"
              checked={selectedVehicleTypes.includes("leve_toco")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("leve_toco", e.target.checked)}
            />
            <label htmlFor="leve-toco" className="cursor-pointer">Toco</label>
          </div>
        </div>
      </div>
      
      {/* Médio */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Médio</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="medio-todos"
              checked={selectedVehicleTypes.includes("medio_todos")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("medio_todos", e.target.checked)}
            />
            <label htmlFor="medio-todos" className="cursor-pointer">Todos</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="medio-bitruck"
              checked={selectedVehicleTypes.includes("medio_bitruck")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("medio_bitruck", e.target.checked)}
            />
            <label htmlFor="medio-bitruck" className="cursor-pointer">Bitruck</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="medio-truck"
              checked={selectedVehicleTypes.includes("medio_truck")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("medio_truck", e.target.checked)}
            />
            <label htmlFor="medio-truck" className="cursor-pointer">Truck</label>
          </div>
        </div>
      </div>
      
      {/* Pesado */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Pesado</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pesado-todos"
              checked={selectedVehicleTypes.includes("pesado_todos")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("pesado_todos", e.target.checked)}
            />
            <label htmlFor="pesado-todos" className="cursor-pointer">Todos</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pesado-bitrem"
              checked={selectedVehicleTypes.includes("pesado_bitrem")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("pesado_bitrem", e.target.checked)}
            />
            <label htmlFor="pesado-bitrem" className="cursor-pointer">Bitrem</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pesado-carreta"
              checked={selectedVehicleTypes.includes("pesado_carreta")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("pesado_carreta", e.target.checked)}
            />
            <label htmlFor="pesado-carreta" className="cursor-pointer">Carreta</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pesado-carreta-ls"
              checked={selectedVehicleTypes.includes("pesado_carreta_ls")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("pesado_carreta_ls", e.target.checked)}
            />
            <label htmlFor="pesado-carreta-ls" className="cursor-pointer">Carreta LS</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pesado-rodotrem"
              checked={selectedVehicleTypes.includes("pesado_rodotrem")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("pesado_rodotrem", e.target.checked)}
            />
            <label htmlFor="pesado-rodotrem" className="cursor-pointer">Rodotrem</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="pesado-vanderleia"
              checked={selectedVehicleTypes.includes("pesado_vanderleia")}
              style={{ width: '24px', height: '24px', margin: '0 8px 0 0' }}
              onChange={(e) => updateSelection("pesado_vanderleia", e.target.checked)}
            />
            <label htmlFor="pesado-vanderleia" className="cursor-pointer">Vanderleia</label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleTypesCheckboxes;