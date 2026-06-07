import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/(auth)/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="register" action={registerAction} next={next} />;
}
