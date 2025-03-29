import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState({
    amount: 0,
    status: "",
    date: ""
  });

  useEffect(() => {
    // Obter o session_id da URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    setSessionId(sid);

    // Em produção, aqui verificaríamos a sessão no servidor
    // Aqui estamos apenas simulando para desenvolvimento
    setIsLoading(false);
    setPaymentInfo({
      amount: 1198.80, // R$ 99,90 x 12 meses
      status: "Assinatura Ativa",
      date: new Date().toLocaleDateString("pt-BR")
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg shadow-lg border-green-100">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-12 w-12" />
            <div>
              <CardTitle className="text-2xl font-bold">Pagamento Aprovado!</CardTitle>
              <CardDescription className="text-green-100">
                Sua assinatura foi ativada com sucesso
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-2">
                  R$ {paymentInfo.amount.toFixed(2).replace(".", ",")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Assinatura anual (12x de R$ 99,90)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-green-600">{paymentInfo.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{paymentInfo.date}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">O que está incluído:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Acesso ilimitado a todas as funcionalidades do sistema</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Gestão completa de fretes e motoristas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Relatórios detalhados e personalizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Link href="/">
            <Button className="gap-2">
              <span>Voltar para o sistema</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}