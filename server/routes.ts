import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(session({
    secret: process.env.SESSION_SECRET || 'super-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // use true in prod
    store: new SessionStore({ checkPeriod: 86400000 })
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    next();
  };

  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) return res.status(400).json({ message: 'Username taken' });
      
      const user = await storage.createUser(input);
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.status(200).json(req.user);
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: 'Logged out' });
    });
  });

  // Deposits
  app.post(api.deposits.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.deposits.create.input.parse(req.body);
      const user = req.user as any;
      
      // Simulate Asaas PIX creation
      const pixQrCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`; // 1x1 black pixel mock
      const pixPayload = `00020101021226...MOCK_PAYLOAD_${Date.now()}`;

      const deposit = await storage.createDeposit({
        merchantId: user.id,
        amount: input.amount,
        credits: input.credits,
        pixQrCode,
        pixPayload
      });

      res.status(201).json(deposit);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(api.deposits.list.path, requireAuth, async (req, res) => {
    const deposits = await storage.getDeposits((req.user as any).id);
    res.status(200).json(deposits);
  });

  app.post(api.deposits.webhook.path, requireAuth, async (req, res) => {
    // Simulated webhook endpoint for development
    try {
      const input = api.deposits.webhook.input.parse(req.body);
      const deposit = await storage.getDeposit(input.id);
      
      if (!deposit || deposit.status === 'paid') {
        return res.status(200).json({ message: 'Ok' });
      }

      // Check if it belongs to user (just for dev simulation security)
      if (deposit.merchantId !== (req.user as any).id) {
         return res.status(401).json({ message: 'Unauthorized' });
      }

      await storage.updateDepositStatus(deposit.id, 'paid');
      
      const user = await storage.getUser(deposit.merchantId);
      if (user) {
        await storage.updateUserCredits(user.id, user.credits + deposit.credits);
      }

      res.status(200).json({ message: 'Payment processed successfully' });
    } catch (err) {
      res.status(400).json({ message: 'Invalid payload' });
    }
  });

  // Orders
  app.post(api.orders.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const user = await storage.getUser((req.user as any).id);
      
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      
      if (user.credits < input.price) {
        return res.status(402).json({ message: 'Insufficient credits. Please deposit more.' });
      }

      // Deduct credits
      await storage.updateUserCredits(user.id, user.credits - input.price);

      const order = await storage.createOrder({
        ...input,
        merchantId: user.id
      });

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: 'Internal error' });
    }
  });

  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    const orders = await storage.getOrders((req.user as any).id);
    res.status(200).json(orders);
  });

  return httpServer;
}
