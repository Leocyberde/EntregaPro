import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();
  const { toast } = useToast();

  const loginSchema = z.object({
    username: z.string().min(1, "CPF é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória"),
  });

  const registerSchema = insertUserSchema;

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: {
      username: "",
      password: "",
      cnpjOrCpf: "",
      phone: "",
      storeName: "",
      storeAddress: "",
    },
  });

  function onSubmit(values: any) {
    const action = mode === "login" ? login : register;
    action(values, {
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
      },
    });
  }

  const isPending = isLoginPending || isRegisterPending;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <Bike className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-display tracking-tight">
            {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
          </CardTitle>
          <CardDescription className="text-base">
            {mode === "login" 
              ? "Entre com seu CPF para gerenciar entregas" 
              : "Preencha os dados da sua loja para começar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{mode === "login" ? "CPF" : "CPF (Login)"}</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} className="bg-background/50 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "register" && (
                <>
                  <FormField
                    control={form.control}
                    name="cnpjOrCpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ ou CPF (Faturamento)</FormLabel>
                        <FormControl>
                          <Input placeholder="CNPJ ou CPF" {...field} className="bg-background/50 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Loja</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do seu comércio" {...field} className="bg-background/50 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone (WhatsApp/Ligação)</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} className="bg-background/50 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="storeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço da Loja</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número, bairro, cidade" {...field} className="bg-background/50 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-background/50 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base font-semibold mt-6" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                form.reset();
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline"
            >
              {mode === "login" 
                ? "Não tem uma conta? Cadastre-se" 
                : "Já tem uma conta? Faça login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
