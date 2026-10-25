export const environment = {
  production: false,
  portfolioAi: {
    /**
     * Same-origin proxy that forwards to a chat-completions API.
     * Leave the key empty to use the on-device catalog interpreter.
     * Do not call a provider such as api.openai.com directly from the browser:
     * those APIs block cross-origin requests and the key would be public.
     */
    endpoint: '/api/portfolio-ai',
    model: 'gpt-4o-mini',
    apiKey: '',
  },
};
