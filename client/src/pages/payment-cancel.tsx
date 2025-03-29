import { Link } from "wouter";
import { XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancel() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg shadow-lg border-red-100">
        <CardHeader className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
          <div className="flex items-center gap-4">
            <XCircle className="h-12 w-12" />
            <div>
              <CardTitle className="text-2xl font-bold">Pagamento Cancelado</CardTitle>
              <CardDescription className="text-red-100">
                Sua assinatura não foi concluída
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <p className="text-center text-slate-600">
              O processo de pagamento foi interrompido ou cancelado.
              Nenhum valor foi cobrado do seu cartão.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Motivos comuns para cancelamento:</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">1</div>
                  <span>Dados do cartão informados incorretamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">2</div>
                  <span>Cancelamento voluntário do processo</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">3</div>
                  <span>Saldo insuficiente ou limite indisponível</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">4</div>
                  <span>Problemas técnicos durante o processo</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800">O que você pode fazer:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Tente novamente utilizando outro cartão</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Verifique se os dados do cartão estão corretos</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5" />
                  <span>Entre em contato com o suporte para assistência</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pb-6">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para o sistema</span>
            </Button>
          </Link>
          
          <Link href="/">
            <Button className="gap-2">
              <span>Tentar novamente</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}