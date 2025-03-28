import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DriversTable from "./tables/drivers-table";
import VehiclesTable from "./tables/vehicles-table";
import ClientsTable from "./tables/clients-table";
import FreightsTable from "./tables/freights-table";

export default function DataManagement() {
  const [selectedTable, setSelectedTable] = useState("drivers");
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Dados</CardTitle>
        <CardDescription>
          Acesse e gerencie as tabelas do banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTable} onValueChange={setSelectedTable}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="drivers">Motoristas</TabsTrigger>
            <TabsTrigger value="vehicles">Veículos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="freights">Fretes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drivers" className="mt-4">
            <DriversTable />
          </TabsContent>
          
          <TabsContent value="vehicles" className="mt-4">
            <VehiclesTable />
          </TabsContent>
          
          <TabsContent value="clients" className="mt-4">
            <ClientsTable />
          </TabsContent>
          
          <TabsContent value="freights" className="mt-4">
            <FreightsTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}