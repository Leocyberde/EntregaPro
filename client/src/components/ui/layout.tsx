import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { LogOut, Package2, Wallet, User as UserIcon, Bike } from "lucide-react";
import { Button } from "./button";

export function Layout({ children }: { children: ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar / Mobile Nav */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex-shrink-0">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Bike className="text-white w-6 h-6" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight">
              Turbo<span className="text-primary">Entrega</span>
            </h1>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            <Package2 className="w-5 h-5" />
            Meus Pedidos
          </Link>
          <Link href="/wallet" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive('/wallet') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
            <Wallet className="w-5 h-5" />
            Carteira & Créditos
          </Link>
        </nav>

        <div className="p-4 mt-auto border-t border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
              <p className="text-xs text-primary font-bold">{user.credits} Créditos</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
