import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Deposit } from "@shared/schema";

export function useDeposits() {
  return useQuery<Deposit[]>({
    queryKey: ["/api/deposits"],
    queryFn: async () => {
      const res = await fetch("/api/deposits");
      if (!res.ok) throw new Error("Failed to fetch deposits");
      return await res.json();
    },
  });
}

export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, credits }: { amount: number; credits: number }) => {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, credits }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create deposit");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
    },
  });
}

// Dev-only simulation hook
export function useSimulatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await fetch("/api/webhooks/asaas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "paid" }),
      });
      
      if (!res.ok) throw new Error("Simulation failed");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}
