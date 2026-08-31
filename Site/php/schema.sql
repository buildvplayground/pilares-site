-- Tabela dos cadastros de Fornecedores / Trabalhe Conosco.
-- Rodar uma vez no MySQL do Hostinger (phpMyAdmin > SQL).
CREATE TABLE IF NOT EXISTS cadastros (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo             ENUM('fornecedor','candidato') NOT NULL,
  nome             VARCHAR(120)  NOT NULL,
  email            VARCHAR(120)  NOT NULL,
  telefone         VARCHAR(20)   NOT NULL,
  area             VARCHAR(120)  NOT NULL,
  mensagem         TEXT          NOT NULL,
  anexo            VARCHAR(80)   DEFAULT NULL,
  consentimento    TINYINT(1)    NOT NULL DEFAULT 0,
  consentimento_em DATETIME      NOT NULL,
  ip               VARCHAR(45)   DEFAULT NULL,
  user_agent       VARCHAR(255)  DEFAULT NULL,
  criado_em        DATETIME      NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tipo (tipo),
  KEY idx_criado (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
