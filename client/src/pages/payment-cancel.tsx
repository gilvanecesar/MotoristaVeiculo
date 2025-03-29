import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

export default function PaymentCancelPage() {
  const [_, navigate] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
              <Icons.close className="h-8 w-8 text-red-600 dark:text-red-300" />
            </div>
          </div>
          <CardTitle className="text-2xl">Pagamento cancelado</CardTitle>
          <CardDescription>
            O processo de pagamento foi cancelado ou não foi concluído.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Você não será cobrado por esta transação cancelada. Para acessar a plataforma QUERO FRETES, é necessário concluir o processo de assinatura.
          </p>
          <p className="text-sm text-muted-foreground">
            Se encontrou algum problema durante o pagamento, entre em contato com nosso suporte.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col justify-center gap-4 pb-6">
          <Button 
            onClick={() => navigate("/auth")} 
            className="w-full"
            variant="default"
          >
            Tentar novamente
          </Button>
          <Button 
            onClick={() => window.location.href = "mailto:contato@querofretes.com"} 
            className="w-full"
            variant="outline"
          >
            Contatar suporte
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}