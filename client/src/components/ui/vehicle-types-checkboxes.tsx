import React from 'react';
import { VEHICLE_CATEGORIES, VEHICLE_TYPES, VEHICLE_TYPES_BY_CATEGORY, getVehicleTypeNameOnly } from '@/lib/utils/vehicle-types';

// Componente para exibir tipos de veículo exatamente como mostrado na imagem de exemplo
function VehicleTypesCheckboxes({
  selectedVehicleTypes,
  onChange,
}: {
  selectedVehicleTypes: string[];
  onChange: (newSelectedTypes: string[]) => void;
}) {
  return (
    <div className="border rounded-md p-4">
      {/* Leve */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Leve</h4>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="leve-todos"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_TODOS)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Selecionar "Todos" remove outros tipos da categoria
                  newTypes = newTypes.filter(type => 
                    !Object.values(VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.LEVE]).includes(type)
                  );
                  newTypes.push(VEHICLE_TYPES.LEVE_TODOS);
                } else {
                  // Desmarcar "Todos"
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_TODOS);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="leve-todos" className="cursor-pointer">
              Todos
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="leve-fiorino"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_FIORINO)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Fiorino
                  newTypes.push(VEHICLE_TYPES.LEVE_FIORINO);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_TODOS);
                } else {
                  // Removendo Fiorino
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_FIORINO);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="leve-fiorino" className="cursor-pointer">
              Fiorino
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="leve-toco"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_TOCO)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Toco
                  newTypes.push(VEHICLE_TYPES.LEVE_TOCO);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_TODOS);
                } else {
                  // Removendo Toco
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_TOCO);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="leve-toco" className="cursor-pointer">
              Toco
            </label>
          </div>
          
          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="leve-vlc"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.LEVE_VLC)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando VLC
                  newTypes.push(VEHICLE_TYPES.LEVE_VLC);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_TODOS);
                } else {
                  // Removendo VLC
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.LEVE_VLC);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="leve-vlc" className="cursor-pointer">
              VLC
            </label>
          </div>
        </div>
      </div>

      {/* Médio */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Médio</h4>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="medio-todos"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.MEDIO_TODOS)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Selecionar "Todos" remove outros tipos da categoria
                  newTypes = newTypes.filter(type => 
                    !Object.values(VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.MEDIO]).includes(type)
                  );
                  newTypes.push(VEHICLE_TYPES.MEDIO_TODOS);
                } else {
                  // Desmarcar "Todos"
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.MEDIO_TODOS);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="medio-todos" className="cursor-pointer">
              Todos
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="medio-bitruck"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.MEDIO_BITRUCK)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Bitruck
                  newTypes.push(VEHICLE_TYPES.MEDIO_BITRUCK);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.MEDIO_TODOS);
                } else {
                  // Removendo Bitruck
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.MEDIO_BITRUCK);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="medio-bitruck" className="cursor-pointer">
              Bitruck
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="medio-truck"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.MEDIO_TRUCK)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Truck
                  newTypes.push(VEHICLE_TYPES.MEDIO_TRUCK);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.MEDIO_TODOS);
                } else {
                  // Removendo Truck
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.MEDIO_TRUCK);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="medio-truck" className="cursor-pointer">
              Truck
            </label>
          </div>
        </div>
      </div>

      {/* Pesado */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Pesado</h4>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="pesado-todos"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_TODOS)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Selecionar "Todos" remove outros tipos da categoria
                  newTypes = newTypes.filter(type => 
                    !Object.values(VEHICLE_TYPES_BY_CATEGORY[VEHICLE_CATEGORIES.PESADO]).includes(type)
                  );
                  newTypes.push(VEHICLE_TYPES.PESADO_TODOS);
                } else {
                  // Desmarcar "Todos"
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_TODOS);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="pesado-todos" className="cursor-pointer">
              Todos
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="pesado-bitrem"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_BITREM)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Bitrem
                  newTypes.push(VEHICLE_TYPES.PESADO_BITREM);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_TODOS);
                } else {
                  // Removendo Bitrem
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_BITREM);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="pesado-bitrem" className="cursor-pointer">
              Bitrem
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="pesado-carreta"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_CARRETA)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Carreta
                  newTypes.push(VEHICLE_TYPES.PESADO_CARRETA);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_TODOS);
                } else {
                  // Removendo Carreta
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_CARRETA);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="pesado-carreta" className="cursor-pointer">
              Carreta
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="pesado-carreta-ls"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_CARRETA_LS)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Carreta LS
                  newTypes.push(VEHICLE_TYPES.PESADO_CARRETA_LS);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_TODOS);
                } else {
                  // Removendo Carreta LS
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_CARRETA_LS);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="pesado-carreta-ls" className="cursor-pointer">
              Carreta LS
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="pesado-rodotrem"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_RODOTREM)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Rodotrem
                  newTypes.push(VEHICLE_TYPES.PESADO_RODOTREM);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_TODOS);
                } else {
                  // Removendo Rodotrem
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_RODOTREM);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="pesado-rodotrem" className="cursor-pointer">
              Rodotrem
            </label>
          </div>

          <div className="min-w-[100px] flex items-center">
            <input
              type="checkbox"
              id="pesado-vanderleia"
              checked={selectedVehicleTypes.includes(VEHICLE_TYPES.PESADO_VANDERLEIA)}
              style={{
                width: '24px',
                height: '24px',
                margin: '0 8px 0 0'
              }}
              onChange={(e) => {
                let newTypes = [...selectedVehicleTypes];
                if (e.target.checked) {
                  // Adicionando Vanderleia
                  newTypes.push(VEHICLE_TYPES.PESADO_VANDERLEIA);
                  // Remover "Todos" se estiver selecionado
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_TODOS);
                } else {
                  // Removendo Vanderleia
                  newTypes = newTypes.filter(type => type !== VEHICLE_TYPES.PESADO_VANDERLEIA);
                }
                console.log(`Atualizando tipos de veículo: ${newTypes.join(', ')}`);
                onChange(newTypes);
              }}
            />
            <label htmlFor="pesado-vanderleia" className="cursor-pointer">
              Vanderleia
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleTypesCheckboxes;