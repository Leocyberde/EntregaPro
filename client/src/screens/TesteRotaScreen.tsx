import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcularDistancia, calcularValorCorrida } from "@/services/distancia";

export default function TesteRotaScreen() {
  // Valores fixos para teste (Exemplo: São Paulo -> Campinas aprox)
  const origem = { lat: -23.5505, lon: -46.6333 };
  const destino = { lat: -22.9064, lon: -47.0616 };

  const distancia = calcularDistancia(
    origem.lat,
    origem.lon,
    destino.lat,
    destino.lon
  );
  const valor = calcularValorCorrida(distancia);

  return (
    <div className="p-4 flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Teste de Cálculo de Rota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-semibold">Origem:</div>
            <div data-testid="text-origin">{origem.lat}, {origem.lon}</div>
            <div className="font-semibold">Destino:</div>
            <div data-testid="text-destination">{destino.lat}, {destino.lon}</div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Distância:</span>
              <span className="font-bold text-lg" data-testid="text-distance">
                {distancia.toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor da Corrida:</span>
              <span className="font-bold text-2xl text-primary" data-testid="text-price">
                R$ {valor.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground italic">
            * Cálculo baseado na fórmula de Haversine para distância direta.
            Regra: R$ 10 até 5km + R$ 2 por km adicional.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
