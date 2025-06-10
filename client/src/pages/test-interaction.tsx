import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestInteractionPage() {
  const [inputValue, setInputValue] = useState("");
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    console.log("Button clicked! Current input:", inputValue);
    setClickCount(prev => prev + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Input changed:", e.target.value);
    setInputValue(e.target.value);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Interação</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Teste Simples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label>Campo de teste:</label>
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Digite algo aqui..."
              className="mt-2"
            />
          </div>
          
          <Button onClick={handleClick}>
            Clique aqui ({clickCount})
          </Button>
          
          <div className="bg-gray-100 p-4 rounded">
            <p>Valor do input: {inputValue}</p>
            <p>Clicks: {clickCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}