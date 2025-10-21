import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, USER_TYPES } from "@shared/schema";
import { sendWelcomeEmail } from "./email-service";

declare global {
  namespace Express {
    // Use the User type from schema as the User in Express
    interface User {
      id: number;
      email: string;
      password: string | null;
      name: string;
      profileType: string;
      authProvider: string;
      providerId: string | null;
      avatarUrl: string | null;
      isVerified: boolean;
      isActive: boolean;
      createdAt: Date;
      lastLogin: Date | null;
      driverId?: number | null;
      clientId?: number | null;
      // Campos de assinatura
      subscriptionActive?: boolean;
      subscriptionType?: string;
      subscriptionExpiresAt?: string | Date;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      paymentRequired?: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Verificar se a senha armazenada tem o formato hash.salt
  if (stored.includes('.')) {
    // Formato hash.salt - usa algoritmo scrypt
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } else {
    // Para desenvolvimento - permite senhas em texto simples
    return supplied === stored;
  }
}

export function setupAuth(app: Express) {
  console.log(`Configurando autenticação no ambiente: ${process.env.NODE_ENV || 'development'}`);
  
  const isProd = process.env.NODE_ENV === 'production';
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "querofretes-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      secure: false, // Força false para desenvolvimento
      httpOnly: false, // Permite acesso via JavaScript para debug
      sameSite: 'lax' // Configuração para desenvolvimento
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "USER_NOT_FOUND" });
        }
        
        if (!user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "INVALID_PASSWORD" });
        }
        
        // Verifica se o usuário está ativo
        if (user.isActive === false) {
          return done(null, false, { message: "ACCOUNT_DISABLED" });
        }
        
        // Atualiza último login
        await storage.updateLastLogin(user.id);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      
      // Se o usuário não existir mais ou estiver inativo, consideramos como não autenticado
      if (!user || user.isActive === false) {
        return done(null, false);
      }
      
      // Verificar expiração da assinatura durante a deserialização
      if (user.subscriptionActive && 
          user.subscriptionType !== "driver_free" && 
          user.subscriptionExpiresAt) {
        
        const expirationDate = new Date(user.subscriptionExpiresAt);
        const currentDate = new Date();
        
        // Se a assinatura expirou, atualiza o status no banco de dados
        if (expirationDate < currentDate) {
          console.log(`Assinatura expirada para usuário ${user.id}. Expiração: ${expirationDate}, Atual: ${currentDate}`);
          
          // Atualiza o status da assinatura no banco
          await storage.updateUser(user.id, { 
            subscriptionActive: false,
            paymentRequired: true
          });
          
          // Atualiza o objeto do usuário em memória também
          user.subscriptionActive = false;
          user.paymentRequired = true;
          
          console.log(`Assinatura desativada para usuário ${user.id}`);
        }
      }
      
      done(null, user);
    } catch (error) {
      console.error("Erro ao deserializar usuário:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name, profileType, phone, whatsapp, cpf } = req.body;
      
      // Verifica se o usuário já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      // Limpa o nome de CPF/CNPJ se necessário
      const { cleanNameFromDocument } = await import("./utils/nameUtils");
      const cleanedName = cleanNameFromDocument(name);

      // Cria novo usuário
      const hashedPassword = await hashPassword(password);
      
      // Configura assinatura baseada no tipo de perfil
      let userSubscriptionType: string;
      let subscriptionExpiresAt: Date | null = null;
      let subscriptionActive = false;
      
      // Prioridade para motoristas (acesso gratuito permanente)
      if (profileType === "driver" || profileType === "motorista") {
        userSubscriptionType = "driver_free";
        subscriptionActive = true;
        subscriptionExpiresAt = null;
      } else {
        // Para outros perfis (embarcadores), não ativa assinatura automaticamente
        // Eles precisam pagar através do OpenPix para ter acesso
        userSubscriptionType = "none";
        subscriptionActive = false;
        subscriptionExpiresAt = null;
      }
      
      const newUser = await storage.createUser({
        email,
        name: cleanedName,
        password: hashedPassword,
        profileType,
        authProvider: "local",
        isVerified: false,
        isActive: true,
        avatarUrl: null,
        providerId: null,
        subscriptionType: userSubscriptionType,
        subscriptionActive,
        subscriptionExpiresAt,
        whatsapp: whatsapp || phone || null,
        cpf: cpf || null
      });

      // Envia email de boas-vindas
      try {
        sendWelcomeEmail(newUser);
      } catch (emailError) {
        console.error("Erro ao enviar email de boas-vindas:", emailError);
      }
      
      // Efetua login automaticamente
      req.login(newUser, (err: any) => {
        if (err) return next(err);
        res.status(201).json(newUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    res.json(req.user);
  });
}