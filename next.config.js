/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the kickoff email HTML file is bundled with the API route on Vercel
  outputFileTracingIncludes: {
    '/api/onboarding': ['./kickoff-email/**'],
  },
}

module.exports = nextConfig
