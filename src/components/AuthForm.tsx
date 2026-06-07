"use client";

import { useActionState } from "react";
import Link from "next/link";

type Action = (
  prev: unknown,
  formData: FormData,
) => Promise<{ error?: string } | void>;

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "register";
  action: Action;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";
  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl bg-white p-6 card-shadow">
      <h1 className="mb-4 text-xl font-bold">
        {isRegister ? "Criar conta" : "Entrar"}
      </h1>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next || "/jogos"} />
        {isRegister && (
          <input
            name="name"
            placeholder="Seu nome"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        )}
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          required
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Senha"
          required
          className="rounded-lg border border-gray-300 px-3 py-2"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          disabled={pending}
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Aguarde..." : isRegister ? "Cadastrar" : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        {isRegister ? (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="text-brand hover:underline">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Não tem conta?{" "}
            <Link href="/register" className="text-brand hover:underline">
              Criar conta
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
