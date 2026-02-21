import { useOrders, useCreateOrder } from "@/hooks/use-orders";
import { useUser } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, MapPin, Truck, Plus, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = insertOrderSchema.extend({
  price: z.number().default(10), // Fixed price for now or handled in UI
});

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: orders, isLoading } = useOrders();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionAddress: "",
      deliveryAddress: "",
      packageDetails: "",
      price: 10,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createOrder(values, {
      onSuccess: () => {
        toast({
          title: "Pedido Criado!",
          description: "Um motoboy será notificado em breve.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Erro ao criar pedido",
          description: error.message,
        });
      },
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "accepted": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "picked_up": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "accepted": return "Aceito";
      case "picked_up": return "Em Trânsito";
      case "delivered": return "Entregue";
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas entregas e acompanhe o status.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Nova Entrega
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Solicitar Motoboy</DialogTitle>
              <DialogDescription>
                Preencha os dados da entrega. Custo fixo: <span className="font-bold text-primary">10 créditos</span>.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="collectionAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço de Coleta</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rua A, 123 - Centro" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço de Entrega</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Av. B, 456 - Bairro" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packageDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalhes do Pacote</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="O que está sendo enviado? Instruções especiais..." 
                            className="resize-none min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Solicitando..." : "Confirmar Solicitação"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum pedido encontrado. Faça sua primeira entrega!
                  </TableCell>
                </TableRow>
              ) : (
                orders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-white/5 border-border/50 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{order.id.toString().padStart(4, '0')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="font-medium">{order.packageDetails}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {order.collectionAddress}
                        </span>
                        <span className="text-foreground flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {order.deliveryAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.createdAt && format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${getStatusColor(order.status)} border capitalize`}>
                        {getStatusText(order.status)}
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
