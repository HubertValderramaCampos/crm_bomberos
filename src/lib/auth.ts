import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",     type: "email"    },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { rows } = await pool.query<{
          id: number;
          email: string;
          password_hash: string;
          rol: string;
          activo: boolean;
          bombero_id: number | null;
          nombres: string | null;
          apellidos: string | null;
          codigo: string | null;
          grado: string | null;
        }>(`
          SELECT u.id, u.email, u.password_hash, u.rol, u.activo,
                 u.bombero_id,
                 b.nombres, b.apellidos, b.codigo, b.grado
          FROM usuario u
          LEFT JOIN bombero b ON b.id = u.bombero_id
          WHERE u.email = $1
          LIMIT 1
        `, [credentials.email.toLowerCase().trim()]);

        const user = rows[0];
        if (!user || !user.activo) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        const nombres = user.nombres && user.apellidos
          ? `${user.apellidos}, ${user.nombres}`
          : user.email;

        return {
          id:        String(user.id),
          email:     user.email,
          rol:       user.rol,
          nombres,
          cip:       user.codigo ?? null,
          grado:     user.grado ?? null,
          bomberoId: user.bombero_id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id        = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.rol       = u.rol;
        token.nombres   = u.nombres;
        token.cip       = u.cip;
        token.grado     = u.grado;
        token.bomberoId = u.bomberoId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id        = token.id as string;
        session.user.rol       = token.rol as string;
        session.user.nombres   = token.nombres as string;
        session.user.cip       = token.cip as string | null;
        session.user.grado     = token.grado as string | null;
        session.user.bomberoId = token.bomberoId as number | null;
      }
      return session;
    },
  },
  pages:   { signIn: "/login", newUser: "/inicio" },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,
};
