import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;
  const notice =
    reset === "1"
      ? "Senha redefinida com sucesso! Faça login com a nova senha."
      : undefined;
  return (
    <AuthForm mode="login" action={loginAction} next={next} notice={notice} />
  );
}
