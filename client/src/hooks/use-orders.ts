import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertOrder, Order } from "@shared/schema";

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json();
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: InsertOrder) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        // Handle 402 specifically for insufficient funds
        if (res.status === 402) {
          throw new Error("Saldo insuficiente. Por favor, recarregue seus créditos.");
        }
        const error = await res.json();
        throw new Error(error.message || "Failed to create order");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      // Also invalidate user to update credit balance
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}
