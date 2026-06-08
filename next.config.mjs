/** @type {import('next').NextConfig} */
const nextConfig = {
  // nodemailer e um pacote Node-only; mantem ele fora do bundle do servidor.
  serverExternalPackages: ["nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
