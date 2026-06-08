"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/(auth)/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    undefined,
  );
  const sent = state && "ok" in state && state.ok;

  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl bg-white p-6 card-shadow">
      <h1 className="mb-2 text-xl font-bold">Esqueci minha senha</h1>
      {sent ? (
        <p className="text-sm text-gray-600">
          Se existir uma conta com esse e-mail, enviamos um link para redefinir
          a senha. Verifique sua caixa de entrada (e a pasta de spam).
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            Informe seu e-mail e enviaremos um link para criar uma nova senha.
          </p>
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          {state && "error" in state && state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <button
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-gray-500">
        <Link href="/login" className="text-brand hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
