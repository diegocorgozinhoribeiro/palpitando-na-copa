"use client";

import { useActionState } from "react";
import { joinLeagueAction } from "@/app/ligas/actions";

export function JoinViaLink({ codigo }: { codigo: string }) {
  const [state, formAction, pending] = useActionState(
    joinLeagueAction,
    undefined,
  );
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="codigo" value={codigo} />
      <button
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar na liga"}
      </button>
      {state && "error" in state && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
