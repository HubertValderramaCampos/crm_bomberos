import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:        string;
      email:     string;
      rol:       string;
      nombres:   string;
      cip:       string | null;
      grado:     string | null;
      bomberoId: number | null;
    };
  }
}
