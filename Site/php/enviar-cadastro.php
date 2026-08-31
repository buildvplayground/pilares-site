<?php
/**
 * Recebe o formulário de Fornecedores / Trabalhe Conosco.
 *
 * Segurança e LGPD:
 *  - valida TUDO de novo no servidor (a validação do JS é só conveniência);
 *  - prepared statements (sem concatenar SQL);
 *  - honeypot + limite de tamanho e de extensão do anexo;
 *  - anexo salvo FORA da raiz pública, com nome gerado (nunca o nome enviado);
 *  - grava o consentimento com data/hora e IP, como a LGPD exige provar;
 *  - credenciais ficam em db-config.php, que NÃO vai para o git.
 */

declare(strict_types=1);
header('X-Content-Type-Options: nosniff');

$ehAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']);

function responde(bool $ok, string $msg, bool $ehAjax): void
{
    if ($ehAjax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'erro' => $ok ? null : $msg], JSON_UNESCAPED_UNICODE);
        exit;
    }
    // sem JS: volta para a página com o resultado na querystring
    $destino = '../fornecedores.html?envio=' . ($ok ? 'ok' : 'erro');
    header('Location: ' . $destino, true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    responde(false, 'Método não permitido.', $ehAjax);
}

/* ---------- honeypot: se preenchido, é robô ---------- */
if (trim((string)($_POST['site_web'] ?? '')) !== '') {
    responde(true, '', $ehAjax);   // responde "ok" sem gravar nada
}

/* ---------- coleta e sanitização ---------- */
function limpa(string $v, int $max): string
{
    $v = str_replace(["\r", "\0"], '', $v);
    $v = trim($v);
    return mb_substr($v, 0, $max, 'UTF-8');
}

$tipo     = limpa((string)($_POST['tipo'] ?? ''), 20);
$nome     = limpa((string)($_POST['nome'] ?? ''), 120);
$email    = limpa((string)($_POST['email'] ?? ''), 120);
$telefone = limpa((string)($_POST['telefone'] ?? ''), 20);
$area     = limpa((string)($_POST['area'] ?? ''), 120);
$mensagem = limpa((string)($_POST['mensagem'] ?? ''), 2000);
$consent  = !empty($_POST['consent']);

$erros = [];
if (!in_array($tipo, ['fornecedor', 'candidato'], true)) $erros[] = 'Selecione o tipo de cadastro.';
if ($nome === '' || mb_strlen($nome) < 3)                $erros[] = 'Informe o nome ou a razão social.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))          $erros[] = 'Informe um e-mail válido.';
if (strlen(preg_replace('/\D/', '', $telefone)) < 10)    $erros[] = 'Informe o telefone com DDD.';
if ($area === '')                                        $erros[] = 'Informe a área de atuação ou serviço.';
if (mb_strlen($mensagem) < 10)                           $erros[] = 'Escreva uma mensagem com pelo menos 10 caracteres.';
if (!$consent)                                           $erros[] = 'É necessário autorizar o uso dos dados.';

if ($erros) {
    http_response_code(422);
    responde(false, implode(' ', $erros), $ehAjax);
}

/* ---------- anexo (opcional) ---------- */
$anexoNome = null;
$MAX = 5 * 1024 * 1024;
$PERMITIDAS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'];
$MIMES_OK = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/webp',
];

if (!empty($_FILES['arquivo']['name']) && ($_FILES['arquivo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['arquivo'];

    if ($f['error'] !== UPLOAD_ERR_OK) {
        http_response_code(422);
        responde(false, 'Falha ao receber o arquivo. Tente novamente.', $ehAjax);
    }
    if ($f['size'] > $MAX) {
        http_response_code(422);
        responde(false, 'Arquivo acima de 5 MB.', $ehAjax);
    }

    $ext = strtolower(pathinfo((string)$f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $PERMITIDAS, true)) {
        http_response_code(422);
        responde(false, 'Formato de arquivo não aceito.', $ehAjax);
    }

    // confere o tipo real do conteúdo, não só a extensão
    $fi = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$fi->file($f['tmp_name']);
    if (!in_array($mime, $MIMES_OK, true)) {
        http_response_code(422);
        responde(false, 'O conteúdo do arquivo não corresponde a um documento ou imagem válidos.', $ehAjax);
    }

    // pasta FORA da raiz pública; nome gerado (nunca o nome do usuário)
    $destinoDir = __DIR__ . '/../../uploads-cadastros';
    if (!is_dir($destinoDir) && !mkdir($destinoDir, 0750, true) && !is_dir($destinoDir)) {
        http_response_code(500);
        responde(false, 'Não foi possível armazenar o arquivo.', $ehAjax);
    }
    $anexoNome = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], $destinoDir . '/' . $anexoNome)) {
        http_response_code(500);
        responde(false, 'Não foi possível armazenar o arquivo.', $ehAjax);
    }
}

/* ---------- persistência ---------- */
$ip   = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
$ua   = mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255, 'UTF-8');
$agora = date('Y-m-d H:i:s');

$configPath = __DIR__ . '/db-config.php';
$gravouNoBanco = false;
$cfg = [];                      // sem db-config.php o script segue por e-mail

if (is_file($configPath)) {
    /** @var array{host:string,nome:string,usuario:string,senha:string,email_destino?:string} $cfg */
    $cfg = require $configPath;
    try {
        $pdo = new PDO(
            sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $cfg['host'], $cfg['nome']),
            $cfg['usuario'],
            $cfg['senha'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
        );
        $sql = 'INSERT INTO cadastros
                  (tipo, nome, email, telefone, area, mensagem, anexo,
                   consentimento, consentimento_em, ip, user_agent, criado_em)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
        $pdo->prepare($sql)->execute([
            $tipo, $nome, $email, $telefone, $area, $mensagem, $anexoNome,
            1, $agora, $ip, $ua, $agora,
        ]);
        $gravouNoBanco = true;
    } catch (Throwable $e) {
        error_log('[pilares] falha no banco: ' . $e->getMessage());
    }
}

/* ---------- aviso por e-mail (fallback e notificação) ---------- */
$destino = $cfg['email_destino'] ?? 'contratos@pilaresengltda.com.br';
$assunto = sprintf('[Site] %s: %s', $tipo === 'fornecedor' ? 'Fornecedor' : 'Trabalhe Conosco', $nome);
$corpo = "Novo cadastro pelo site\n\n"
       . "Tipo:      {$tipo}\n"
       . "Nome:      {$nome}\n"
       . "E-mail:    {$email}\n"
       . "Telefone:  {$telefone}\n"
       . "Área:      {$area}\n"
       . "Anexo:     " . ($anexoNome ?: 'nenhum') . "\n"
       . "Data:      {$agora}\n"
       . "IP:        {$ip}\n"
       . "Banco:     " . ($gravouNoBanco ? 'gravado' : 'NAO gravado (ver log)') . "\n\n"
       . "Mensagem:\n{$mensagem}\n";

// cabeçalhos sem quebra de linha injetável
$headers = "From: site@pilaresengltda.com.br\r\n"
         . 'Reply-To: ' . str_replace(["\r", "\n"], '', $email) . "\r\n"
         . "Content-Type: text/plain; charset=utf-8\r\n";

$enviouEmail = @mail($destino, $assunto, $corpo, $headers);

if (!$gravouNoBanco && !$enviouEmail) {
    error_log('[pilares] cadastro perdido: ' . json_encode(compact('tipo', 'nome', 'email'), JSON_UNESCAPED_UNICODE));
    http_response_code(500);
    responde(false, 'Não conseguimos registrar seu cadastro agora. Escreva para contratos@pilaresengltda.com.br.', $ehAjax);
}

responde(true, '', $ehAjax);
