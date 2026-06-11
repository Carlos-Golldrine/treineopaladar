/**
 * Declaracao ambiente para importar os JSON de conteudo sem alterar o tsconfig.
 * O Vite resolve JSON nativamente em runtime; aqui garantimos o typecheck.
 * O barrel (index.ts) faz o cast para os types do contrato (./types).
 */
declare module '*.json' {
  const value: unknown;
  export default value;
}
