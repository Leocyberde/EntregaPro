import { useUser } from "@/hooks/use-auth";
import { useDeposits, useCreateDeposit, useSimulatePayment } from "@/hooks/use-deposits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, QrCode, Copy, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WalletPage() {
  const { data: user } = useUser();
  const { data: deposits, isLoading } = useDeposits();
  const { mutate: createDeposit, isPending: isCreating } = useCreateDeposit();
  const { mutate: simulatePayment, isPending: isSimulating } = useSimulatePayment();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>("50");
  const [activeDeposit, setActiveDeposit] = useState<any>(null);

  const handleDeposit = () => {
    const value = parseInt(amount);
    if (isNaN(value) || value <= 0) return;

    // Logic: 1 Real = 1 Credit
    createDeposit({ amount: value * 100, credits: value }, {
      onSuccess: (data) => {
        setActiveDeposit(data);
        toast({
          title: "Código PIX gerado!",
          description: "Realize o pagamento para liberar os créditos.",
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: err.message
        });
      }
    });
  };

  const handleCopyPix = () => {
    if (activeDeposit) {
      navigator.clipboard.writeText(activeDeposit.pixPayload);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold">Carteira</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus créditos e histórico de recargas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-orange-600/5 border-primary/20 shadow-xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-primary">
              <Wallet className="w-5 h-5" />
              Saldo Disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-display tracking-tight text-foreground">
              {user?.credits}
              <span className="text-xl text-muted-foreground ml-2 font-normal">créditos</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Use seus créditos para solicitar motoboys. Cada entrega custa 10 créditos.
            </p>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card className="lg:col-span-2 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Adicionar Créditos</CardTitle>
            <CardDescription>Compre créditos via PIX. 1 Real = 1 Crédito.</CardDescription>
          </CardHeader>
          <CardContent>
            {!activeDeposit ? (
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="grid w-full gap-2">
                  <Label htmlFor="amount">Valor da Recarga (R$)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="text-lg h-12"
                    min="10"
                  />
                </div>
                <Button 
                  onClick={handleDeposit} 
                  disabled={isCreating}
                  className="w-full sm:w-auto h-12 text-base px-8 bg-primary hover:bg-primary/90"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar PIX"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col md:flex-row gap-6 items-center bg-background/50 p-6 rounded-xl border border-border">
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    {/* Placeholder for QR Code since we don't have a real generator in frontend */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeDeposit.pixPayload)}`} 
                      alt="QR Code Pix" 
                      className="w-32 h-32 md:w-40 md:h-40 object-contain"
                    />
                  </div>
                  <div className="space-y-4 w-full">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Pague com PIX</h3>
                      <p className="text-sm text-muted-foreground">Abra o app do seu banco e escaneie o QR Code ou copie o código abaixo.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input value={activeDeposit.pixPayload} readOnly className="font-mono text-xs bg-muted" />
                      <Button size="icon" variant="secondary" onClick={handleCopyPix}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button variant="ghost" onClick={() => setActiveDeposit(null)}>
                    Voltar
                  </Button>
                  
                  {/* DEV ONLY BUTTON */}
                  <Button 
                    variant="outline" 
                    className="border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                    onClick={() => simulatePayment({ id: activeDeposit.id }, {
                      onSuccess: () => {
                        toast({ title: "Pagamento Aprovado!", description: "Seus créditos foram adicionados." });
                        setActiveDeposit(null);
                      }
                    })}
                    disabled={isSimulating}
                  >
                    {isSimulating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Simular Pagamento (Dev)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Data</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell>
                </TableRow>
              ) : deposits?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhuma transação encontrada.</TableCell>
                </TableRow>
              ) : (
                deposits?.map((deposit) => (
                  <TableRow key={deposit.id} className="hover:bg-white/5 border-border/50">
                    <TableCell className="text-muted-foreground">
                      {deposit.createdAt && format(new Date(deposit.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-primary" />
                        <span>PIX</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-green-500">+{deposit.credits} Créditos</TableCell>
                    <TableCell>R$ {(deposit.amount / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={deposit.status === 'paid' ? 'default' : 'secondary'} className={deposit.status === 'paid' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20' : ''}>
                        {deposit.status === 'paid' ? 'Aprovado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
