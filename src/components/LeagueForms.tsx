"use client";

import { useActionState } from "react";
import { createLeagueAction, joinLeagueAction } from "@/app/ligas/actions";

export function LeagueForms({
  atingiuLimite,
  appUrl,
}: {
  atingiuLimite: boolean;
  appUrl: string;
}) {
  const [createState, createForm, creating] = useActionState(
    createLeagueAction,
    undefined,
  );
  const [joinState, joinForm, joining] = useActionState(
    joinLeagueAction,
    undefined,
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-white p-4 card-shadow">
        <h2 className="mb-2 font-semibold">Criar liga</h2>
        {atingiuLimite ? (
          <p className="text-sm text-gray-400">
            Limite de ligas atingido. Saia de uma para criar outra.
          </p>
        ) : (
          <form action={createForm} className="flex flex-col gap-2">
            <input
              name="nome"
              placeholder="Nome da liga"
              required
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
            <button
              disabled={creating}
              className="rounded-lg bg-brand px-3 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {creating ? "Criando..." : "Criar"}
            </button>
          </form>
        )}
        {createState && "error" in createState && createState.error && (
          <p className="mt-2 text-sm text-red-600">{createState.error}</p>
        )}
        {createState && "ok" in createState && createState.ok && (
          <div className="mt-2 rounded-lg bg-green-50 p-2 text-sm">
            Liga criada! Código{" "}
            <span className="font-mono font-bold">{createState.codigo}</span>
            <div className="mt-1 break-all text-xs text-gray-500">
              Convite: {appUrl}/ligas/entrar/{createState.codigo}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 card-shadow">
        <h2 className="mb-2 font-semibold">Entrar em uma liga</h2>
        {atingiuLimite ? (
          <p className="text-sm text-gray-400">
            Limite de ligas atingido. Saia de uma para entrar em outra.
          </p>
        ) : (
          <form action={joinForm} className="flex flex-col gap-2">
            <input
              name="codigo"
              placeholder="Código (ex: ABC123)"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 font-mono uppercase"
            />
            <button
              disabled={joining}
              className="rounded-lg border border-brand px-3 py-2 font-medium text-brand hover:bg-brand-light disabled:opacity-60"
            >
              {joining ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
        {joinState && "error" in joinState && joinState.error && (
          <p className="mt-2 text-sm text-red-600">{joinState.error}</p>
        )}
        {joinState && "ok" in joinState && joinState.ok && (
          <p className="mt-2 text-sm text-green-600">Você entrou na liga! ✅</p>
        )}
      </div>
    </div>
  );
}
