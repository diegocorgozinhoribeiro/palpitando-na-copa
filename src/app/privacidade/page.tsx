import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade · Palpitando na Copa",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-2xl font-bold">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-gray-400">
        Última atualização: 07/06/2026
      </p>

      <div className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-gray-700">
        <p>
          Esta Política explica como o <strong>Palpitando na Copa</strong>{" "}
          (“nós”) coleta, usa e protege seus dados pessoais, em conformidade com
          a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
        </p>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">
            1. Dados que coletamos
          </h2>
          <ul className="list-disc pl-5">
            <li>
              <strong>Nome</strong>: para identificar você no ranking e nas
              ligas.
            </li>
            <li>
              <strong>E-mail</strong>: para login e identificação da conta.
            </li>
            <li>
              <strong>Senha</strong>: armazenada de forma criptografada (hash),
              nunca em texto puro.
            </li>
            <li>
              <strong>Dados de uso</strong>: seus palpites, pontuação e ligas
              das quais participa.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">2. Finalidade</h2>
          <p>
            Usamos seus dados exclusivamente para operar o jogo: autenticar seu
            acesso, registrar palpites, calcular pontuação e exibir rankings.
            Não vendemos nem compartilhamos seus dados com terceiros para fins
            de marketing.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">3. Base legal</h2>
          <p>
            Tratamos seus dados com base no seu <strong>consentimento</strong>{" "}
            (dado no cadastro) e na <strong>execução do serviço</strong> que
            você solicitou ao criar uma conta.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">
            4. Armazenamento e segurança
          </h2>
          <p>
            Os dados são armazenados em banco de dados gerenciado (Neon /
            PostgreSQL) e o acesso ao site ocorre sempre via conexão
            criptografada (HTTPS). Adotamos medidas como hash de senha e cookies
            de sessão protegidos (httpOnly) para reduzir riscos.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">5. Cookies</h2>
          <p>
            Utilizamos apenas um cookie essencial de sessão, necessário para
            manter você conectado. Não usamos cookies de rastreamento ou
            publicidade.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">
            6. Seus direitos (LGPD)
          </h2>
          <p>
            Você pode, a qualquer momento, acessar, corrigir ou excluir seus
            dados. A exclusão da conta pode ser feita diretamente na página{" "}
            <Link href="/perfil" className="text-brand hover:underline">
              Meu perfil
            </Link>
            , removendo permanentemente seus dados pessoais e palpites.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">7. Retenção</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a
            conta, os dados pessoais são apagados do nosso banco de dados.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">8. Contato</h2>
          <p>
            Para dúvidas sobre privacidade ou para exercer seus direitos, entre
            em contato com o administrador do site.
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
