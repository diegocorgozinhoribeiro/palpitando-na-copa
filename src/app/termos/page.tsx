import Link from "next/link";

export const metadata = {
  title: "Termos de Uso · Palpitando na Copa",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-2xl font-bold">Termos de Uso</h1>
      <p className="mt-1 text-sm text-gray-400">
        Última atualização: 07/06/2026
      </p>

      <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-gray-700">
        <p>
          Ao criar uma conta no <strong>Palpitando na Copa</strong>, você
          concorda com estes Termos de Uso.
        </p>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">1. O serviço</h2>
          <p>
            O Palpitando na Copa é um jogo gratuito e recreativo de palpites
            sobre as partidas da Copa do Mundo. Os palpites valem apenas pontos
            dentro do jogo,{" "}
            <strong>
              sem qualquer valor financeiro, premiação em dinheiro ou aposta
            </strong>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">2. Sua conta</h2>
          <p>
            Você é responsável por manter a confidencialidade da sua senha e por
            todas as atividades realizadas na sua conta. Forneça informações
            verdadeiras no cadastro.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">3. Conduta</h2>
          <p>
            É proibido usar o serviço para fins ilegais, criar múltiplas contas
            para manipular rankings, ou tentar comprometer a segurança do
            sistema. Podemos suspender contas que violem estas regras.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">
            4. Regras do jogo
          </h2>
          <p>
            Os palpites só podem ser feitos enquanto o mercado de cada jogo
            estiver aberto (fecha 1 minuto antes do início da partida). Os
            resultados e a pontuação são definidos pela administração com base
            nos jogos oficiais.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">
            5. Isenção de responsabilidade
          </h2>
          <p>
            O serviço é fornecido “como está”. Não garantimos disponibilidade
            ininterrupta nem a ausência de erros, e não nos responsabilizamos
            por eventuais indisponibilidades de serviços de terceiros.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">6. Alterações</h2>
          <p>
            Estes Termos podem ser atualizados a qualquer momento. O uso
            contínuo do serviço após mudanças significa que você concorda com a
            versão vigente.
          </p>
        </section>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/" className="text-brand hover:underline">
          ← Voltar
        </Link>
      </p>
    </div>
  );
}
