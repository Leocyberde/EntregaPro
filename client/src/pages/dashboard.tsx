import { useOrders, useCreateOrder } from "@/hooks/use-orders";
import { useUser } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, updateProfileSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MapPin, Truck, Plus, Search, Loader2, User, Settings, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { calcularDistancia, calcularValorCorrida } from "@/services/distancia";

const formSchema = insertOrderSchema.extend({
  price: z.number().default(10),
});

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: orders, isLoading } = useOrders();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collectionAddress: user?.storeAddress || "",
      deliveryAddress: "",
      customerName: "",
      customerPhone: "",
      packageDetails: "",
      price: 10,
    },
  });

  // Novos estados para cálculo
  const [distanciaEstimada, setDistanciaEstimada] = useState<number | null>(null);
  const [valorEstimado, setValorEstimado] = useState<number | null>(null);

  // Geocodificação real usando Nominatim e cálculo de rota via OSRM
  const calcularRotaReal = async (enderecoDestino: string) => {
    const enderecoOrigem = form.getValues("collectionAddress");
    
    if (!enderecoDestino || enderecoDestino.length < 5 || !enderecoOrigem) {
      setDistanciaEstimada(null);
      setValorEstimado(null);
      return;
    }

    try {
      // 1. Geocodificar Origem
      const respOrigem = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoOrigem)}&limit=1`, {
        headers: { "User-Agent": "EntregaPro-App" }
      });
      const dataOrigem = await respOrigem.json();
      
      // 2. Geocodificar Destino
      const respDestino = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDestino)}&limit=1`, {
        headers: { "User-Agent": "EntregaPro-App" }
      });
      const dataDestino = await respDestino.json();

      if (dataOrigem.length > 0 && dataDestino.length > 0) {
        const lat1 = dataOrigem[0].lat;
        const lon1 = dataOrigem[0].lon;
        const lat2 = dataDestino[0].lat;
        const lon2 = dataDestino[0].lon;

        // 3. Calcular Rota Real via OSRM
        const respRota = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
        const dataRota = await respRota.json();

        if (dataRota.code === "Ok" && dataRota.routes.length > 0) {
          const distKm = dataRota.routes[0].distance / 1000;
          const val = calcularValorCorrida(distKm);

          setDistanciaEstimada(distKm);
          setValorEstimado(val);
          form.setValue("price", Math.round(val));
        } else {
          // Fallback para Haversine se OSRM falhar
          const distHaversine = calcularDistancia(Number(lat1), Number(lon1), Number(lat2), Number(lon2));
          const val = calcularValorCorrida(distHaversine);
          setDistanciaEstimada(distHaversine);
          setValorEstimado(val);
          form.setValue("price", Math.round(val));
        }
      }
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
      toast({
        variant: "destructive",
        title: "Erro no cálculo",
        description: "Não foi possível calcular a rota real. Verifique os endereços.",
      });
    }
  };

  // Update collection address when user data is available
  useEffect(() => {
    if (user?.storeAddress) {
      form.setValue("collectionAddress", user.storeAddress);
    }
  }, [user, form]);

  const profileForm = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      storeAddress: user?.storeAddress || "",
      currentPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        storeAddress: user.storeAddress,
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof updateProfileSchema>) {
    setProfileLoading(true);
    try {
      await apiRequest(api.auth.updateProfile.method, api.auth.updateProfile.path, values);
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      profileForm.setValue("currentPassword", "");
      profileForm.setValue("newPassword", "");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message,
      });
    } finally {
      setProfileLoading(false);
    }
  }

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
      case "ready": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "accepted": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "picked_up": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "delivered": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "ready": return "Pronto";
      case "accepted": return "Aceito";
      case "picked_up": return "Em Trânsito";
      case "delivered": return "Entregue";
      default: return status;
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      toast({
        title: "Status Atualizado!",
        description: `Pedido marcado como ${getStatusText(status).toLowerCase()}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo, {user?.storeName}.</p>
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
                O endereço de coleta foi preenchido automaticamente com o endereço da sua loja.
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
                        <FormLabel>Endereço de Coleta (Sua Loja)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Endereço da sua loja" {...field} className="pl-9" readOnly />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Alterável nas configurações do perfil.
                        </FormDescription>
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
                            <Input 
                              placeholder="Av. B, 456 - Bairro" 
                              {...field} 
                              className="pl-9" 
                              onBlur={(e) => calcularRotaReal(e.target.value)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {distanciaEstimada !== null && (
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-md animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                        <Calculator className="w-4 h-4" />
                        <span>Estimativa de Rota</span>
                      </div>
                      <div className="grid grid-cols-2 text-sm">
                        <span className="text-muted-foreground">Distância:</span>
                        <span className="font-medium text-right">{distanciaEstimada.toFixed(2)} km</span>
                        <span className="text-muted-foreground">Valor Estimado:</span>
                        <span className="font-bold text-right text-primary">R$ {valorEstimado?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nome Completo" {...field} className="pl-9" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="(11) 99999-9999" {...field} className="pl-9" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="orders">
            <Package className="w-4 h-4 mr-2" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Settings className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[100px]">Pedido #</TableHead>
                    <TableHead>Cód. Coleta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : orders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum pedido encontrado. Faça sua primeira entrega!
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders?.map((order) => (
                      <TableRow key={order.id} className="hover:bg-white/5 border-border/50 transition-colors">
                        <TableCell className="font-mono text-sm font-bold text-primary">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold text-blue-500">
                          {order.collectionCode}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="font-medium">{order.customerName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground ml-6">
                              {order.customerPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm gap-1">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {order.collectionAddress}
                            </span>
                            <span className="text-foreground flex items-center gap-1.5 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {order.deliveryAddress}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {order.createdAt && format(new Date(order.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 border-green-500/50 text-green-500 hover:bg-green-500/10"
                              onClick={() => updateStatus(order.id, 'ready')}
                            >
                              Marcar como Pronto
                            </Button>
                          )}
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
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Card className="max-w-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle>Editar Perfil da Loja</CardTitle>
              <CardDescription>Atualize o endereço da sua loja e gerencie sua senha.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="storeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço da Loja</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rua da Loja, 123" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <FormField
                      control={profileForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>Necessária para trocar a senha.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
