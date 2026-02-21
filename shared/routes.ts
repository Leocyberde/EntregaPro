import { z } from 'zod';
import { insertUserSchema, insertOrderSchema, users, orders, deposits } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  paymentRequired: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: insertUserSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      }
    }
  },
  deposits: {
    create: {
      method: 'POST' as const,
      path: '/api/deposits' as const,
      input: z.object({ amount: z.number(), credits: z.number() }),
      responses: {
        201: z.custom<typeof deposits.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/deposits' as const,
      responses: {
        200: z.array(z.custom<typeof deposits.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    webhook: {
      method: 'POST' as const,
      path: '/api/webhooks/asaas' as const,
      input: z.object({ id: z.number(), status: z.string() }), 
      responses: {
        200: z.object({ message: z.string() }),
      }
    }
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: insertOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        402: errorSchemas.paymentRequired,
      }
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}