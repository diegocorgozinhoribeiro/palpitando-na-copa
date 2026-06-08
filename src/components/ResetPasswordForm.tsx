"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/(auth)/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    undefined,
  );

  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl bg-white p-6 card-shadow">
      <h1 className="mb-4 text-xl font-bold">Criar nova senha</h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <input
          name="password"
          type="password"
          placeholder="Nova senha"
          required
          minLength={8}
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
        <input
          name="confirm"
          type="password"
          placeholder="Confirmar nova senha"
          required
          minLength={8}
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="-mt-1 text-xs text-gray-400">
          Mínimo 8 caracteres, com letras e números.
        </p>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
