// Contrato de tipos da autenticação. Sem código que roda — só "moldes".
// Também é a especificação que o colega do back vai implementar.

export type Credenciais = {
  usuario: string;
  senha: string;
};

export type NovoUsuario = {
  nome: string;
  usuario: string;
  senha: string;
};

// Usuário como o resto do app enxerga (NUNCA carrega a senha de volta).
export type Usuario = {
  id: string;
  nome: string;
  usuario: string;
};

export type Sessao = {
  usuario: Usuario;
  token: string; // fake agora; o back devolve um JWT depois
  criadaEm: string; // ISO 8601
};
