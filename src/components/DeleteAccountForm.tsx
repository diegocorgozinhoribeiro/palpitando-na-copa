"use client";

import { deleteAccountAction } from "@/app/(auth)/actions";

export function DeleteAccountForm() {
  return (
    <form
      action={deleteAccountAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Tem certeza? Esta ação é permanente e apaga sua conta, seus palpites e as ligas que você criou.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
        Excluir minha conta
      </button>
    </form>
  );
}
