/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 */
export const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanciaBase = R * c;

  // Multiplicar por 1.3 para simular rota real conforme pedido
  return distanciaBase * 1.3;
};

/**
 * Calcula o valor da corrida com base na distância
 */
export const calcularValorCorrida = (distancia: number): number => {
  const TAXA_BASE = 10;
  const VALOR_KM_EXCEDENTE = 2;
  const LIMITE_BASE = 5;

  if (distancia <= LIMITE_BASE) {
    return TAXA_BASE;
  }

  const kmExcedentes = distancia - LIMITE_BASE;
  return TAXA_BASE + kmExcedentes * VALOR_KM_EXCEDENTE;
};
