import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEMO_USERS = [
  { id: "1", email: "jefe@bomberos.pe",      password: "demo1234", rol: "JEFE_COMPANIA",       nombres: "Christian Pool Zamudio Lara", cip: "B-001" },
  { id: "2", email: "admin@bomberos.pe",     password: "demo1234", rol: "ADMINISTRACION",       nombres: "Ana Mendoza Vargas",      cip: "B-004" },
  { id: "3", email: "ops@bomberos.pe",       password: "demo1234", rol: "OPERACIONES",          nombres: "Juan Torres Huanca",      cip: "B-003" },
  { id: "4", email: "servicios@bomberos.pe", password: "demo1234", rol: "SERVICIOS_GENERALES",  nombres: "Lucia Rojas Soto",        cip: "B-006" },
  { id: "5", email: "instruccion@bomberos.pe", password: "demo1234", rol: "INSTRUCCION",        nombres: "Miguel Paredes Cruz",     cip: "B-007" },
  { id: "6", email: "sanidad@bomberos.pe",   password: "demo1234", rol: "SANIDAD",              nombres: "María Flores Ramos",      cip: "B-002" },
  { id: "7", email: "imagen@bomberos.pe",    password: "demo1234", rol: "IMAGEN",               nombres: "Sandra Vega Castillo",    cip: "B-008" },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = DEMO_USERS.find(
          (u) => u.email === credentials.email && u.password === credentials.password
        );
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          rol: user.rol,
          nombres: user.nombres,
          cip: user.cip,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.rol = u.rol;
        token.nombres = u.nombres;
        token.cip = u.cip;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.nombres = token.nombres as string;
        session.user.cip = token.cip as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
