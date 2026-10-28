import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PLAN_PRICE_LABEL } from "@/lib/access";
import { TRIAL_DAYS } from "@/lib/signup";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Prueba gratis — TallerLink" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <main className="flex-1 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="flex items-center gap-2 font-extrabold text-xl mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <Wrench size={17} aria-hidden />
          </span>
          TallerLink
        </p>
        <h1 className="text-2xl font-bold">Prueba gratis {TRIAL_DAYS} días</h1>
        <p className="mt-1.5 text-sm text-muted">
          Crea tu taller y empieza a registrar cada carro hoy. Sin tarjeta. Después, {PLAN_PRICE_LABEL}.
        </p>

        <SignupForm />

        <p className="mt-6 text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="font-medium text-primary hover:underline underline-offset-4">
            Entra aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
