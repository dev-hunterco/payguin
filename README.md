# PayGuin 🐧

> API fake do Asaas para testes locais e CI/CD

Servidor mock local que simula a API do gateway de pagamentos [Asaas](https://www.asaas.com/), permitindo que você desenvolva e teste suas integrações sem depender do sandbox real.

*O nome é uma alusão ao pinguim — tem asas mas não voa!*

---

## O que é?

O **PayGuin** é um servidor local que replica os endpoints da API do Asaas. Basta apontar sua aplicação para ele em vez do sandbox real e você pode:

- **Criar clientes, cobranças (boleto/PIX/cartão de crédito), notas fiscais e webhooks** -- todos os recursos principais da API
- **Simular mudanças de estado** (pagamento recebido, vencido, estornado) via endpoints especiais de simulação
- **Receber callbacks de webhook** exatamente como no Asaas real
- **Gerenciar múltiplas contas** com carteiras isoladas
- **Resetar todos os dados** com uma única chamada -- perfeito para testes automatizados

---

## Quick Start

```bash
git clone <repo-url>
cd local_asaas
npm install
cd ui && npm install && npm run build && cd ..
npm run dev
```

- Servidor da API: **http://localhost:8787**
- Painel administrativo: **http://localhost:8787/__admin**

---

## Configuração

Variáveis de ambiente (podem ser definidas no arquivo `.env`):

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `8787` | Porta do servidor |
| `DB_PATH` | `./data/payguin.db` | Caminho do banco de dados SQLite |
| `WEBHOOK_TIMEOUT` | `5000` | Timeout em ms para dispatch de webhooks |
| `LOG_LEVEL` | `info` | Nível de log (`debug`, `info`, `warn`, `error`) |

---

## Como Usar

### Autenticação

Envie o header `access_token` com qualquer string. Cada token único gera automaticamente uma conta isolada com sua própria carteira.

```bash
# Isso cria uma conta automaticamente
curl -H "access_token: my-test-key" http://localhost:8787/v3/customers
```

Não há validação de credenciais -- qualquer valor funciona. Isso é proposital para facilitar os testes.

### Criando um cliente

```bash
curl -X POST http://localhost:8787/v3/customers \
  -H "Content-Type: application/json" \
  -H "access_token: my-test-key" \
  -d '{"name": "João Silva", "cpfCnpj": "12345678901"}'
```

### Criando uma cobrança

```bash
curl -X POST http://localhost:8787/v3/payments \
  -H "Content-Type: application/json" \
  -H "access_token: my-test-key" \
  -d '{"customer": "cus_xxx", "billingType": "BOLETO", "value": 100.00, "dueDate": "2024-12-31"}'
```

### Simulando pagamento

```bash
curl -X POST http://localhost:8787/__sim/payments/pay_xxx/pay
```

### Registrando webhook

```bash
curl -X POST http://localhost:8787/v3/webhooks \
  -H "Content-Type: application/json" \
  -H "access_token: my-test-key" \
  -d '{"url": "http://localhost:3000/webhook", "events": ["PAYMENT_RECEIVED"]}'
```

---

## API Reference

### Endpoints Implementados (compatíveis com Asaas)

#### Contas & Parceiros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v2/accounts` | Criar subconta |
| GET | `/v3/myAccount/commercialInfo` | Info comercial |
| GET | `/v3/wallets` | Listar carteiras |
| GET | `/v3/banks` | Listar bancos |

#### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v3/customers` | Criar/atualizar cliente |
| GET | `/v3/customers?cpfCnpj=` | Buscar por CPF/CNPJ |
| GET | `/v3/customerFiscalInfo` | Config fiscal |

#### Cobranças

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v3/payments` | Criar cobrança |
| GET | `/v3/payments/{id}` | Consultar cobrança |
| POST | `/v3/payments/{id}` | Atualizar splits |
| GET | `/v3/payments?installment=` | Consultar parcelas |
| POST | `/v3/payments/{id}/receiveInCash` | Receber em dinheiro |

#### Notas Fiscais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v3/invoices` | Emitir NF |
| GET | `/v3/invoices?status=` | Listar NFs |
| GET | `/v3/invoices/municipalServices` | Serviços municipais |

#### Fiscal

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/v3/fiscalInfo/nbsCodes` | Códigos NBS |
| GET | `/v3/fiscalInfo/operationIndicatorCodes` | Indicadores de operação |

#### Webhooks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v3/webhooks` | Criar webhook |
| PUT | `/v3/webhooks/{id}` | Atualizar webhook |
| GET | `/v3/webhooks` | Listar webhooks |

#### Financeiro

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/v3/transfers` | Transferência entre contas |
| GET | `/v3/finance/getCurrentBalance` | Saldo atual |

### Endpoints de Simulação

Estes endpoints **não existem no Asaas real**. São os "códigos de trapaça" para testes:

| Método | Endpoint | Efeito |
|--------|----------|--------|
| POST | `/__sim/payments/{id}/pay` | Simula pagamento recebido |
| POST | `/__sim/payments/{id}/confirm` | Simula confirmação (PIX/cartão) |
| POST | `/__sim/payments/{id}/overdue` | Simula vencimento |
| POST | `/__sim/payments/{id}/refund` | Simula estorno |
| POST | `/__sim/invoices/{id}/authorize` | Autoriza nota fiscal |
| POST | `/__sim/invoices/{id}/error` | Simula erro na NF |
| POST | `/__sim/time/advance` | Avança tempo (vence boletos). Body: `{"days": 30}` |
| POST | `/__sim/reset` | Reseta todo o banco de dados |
| POST | `/__sim/reset/{accountId}` | Reseta dados de uma conta específica |

> **Importante:** Os endpoints de simulação disparam webhooks automaticamente. Por exemplo, ao chamar `/__sim/payments/{id}/pay`, se houver um webhook registrado para o evento `PAYMENT_RECEIVED`, o servidor fará o POST para a URL configurada.

---

## Webhooks

O PayGuin replica o sistema de webhooks do Asaas real:

1. **Registre uma URL** via `POST /v3/webhooks` informando a URL e os eventos desejados
2. **Quando o estado muda** (via API ou endpoints de simulação), o servidor faz um POST para a URL registrada
3. **O payload segue o mesmo formato** do Asaas real:

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_xxx",
    "customer": "cus_xxx",
    "value": 100.00,
    "status": "RECEIVED",
    "billingType": "BOLETO"
  }
}
```

**Eventos disparados:**

| Evento | Quando |
|--------|--------|
| `PAYMENT_RECEIVED` | Pagamento recebido |
| `PAYMENT_CONFIRMED` | Pagamento confirmado (PIX/cartão) |
| `PAYMENT_OVERDUE` | Pagamento vencido |
| `PAYMENT_REFUNDED` | Pagamento estornado |
| `INVOICE_AUTHORIZED` | Nota fiscal autorizada |
| `INVOICE_ERROR` | Erro na nota fiscal |

**Observações:**
- Não há retentativas de envio (é um mock, se falhar, falhou)
- O log de dispatch de webhooks pode ser visualizado no painel administrativo

---

## Admin UI

O painel administrativo está disponível em **http://localhost:8787/__admin** e permite:

- **Visualizar todas as contas** com seus saldos
- **Navegar por clientes, cobranças e notas fiscais** de cada conta
- **Clicar em botões de ação** para disparar simulações (pagar, vencer, estornar, etc.)
- **Visualizar configurações de webhook** e logs de dispatch
- **Resetar o banco de dados** com um botão

### Desenvolvimento da UI

Para desenvolver a interface administrativa com hot-reload:

```bash
cd ui
npm run dev  # inicia na porta 5173, com proxy da API para 8787
```

---

## Uso em Testes Automatizados

Exemplo de como integrar com seus testes:

```javascript
const ASAAS_URL = 'http://localhost:8787'
const API_KEY = 'test-key-123'

// Reseta o banco antes de cada teste
await fetch(`${ASAAS_URL}/__sim/reset`, { method: 'POST' })

// Cria um cliente
const customer = await fetch(`${ASAAS_URL}/v3/customers`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
  body: JSON.stringify({ name: 'Test Customer', cpfCnpj: '12345678901' })
}).then(r => r.json())

// Cria uma cobrança
const payment = await fetch(`${ASAAS_URL}/v3/payments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
  body: JSON.stringify({
    customer: customer.id,
    billingType: 'BOLETO',
    value: 150.00,
    dueDate: '2024-12-31'
  })
}).then(r => r.json())

// Simula o pagamento
await fetch(`${ASAAS_URL}/__sim/payments/${payment.id}/pay`, { method: 'POST' })

// Verifica que o pagamento foi recebido
const updated = await fetch(`${ASAAS_URL}/v3/payments/${payment.id}`, {
  headers: { 'access_token': API_KEY }
}).then(r => r.json())

assert(updated.status === 'RECEIVED')
```

**Dica:** Use o `/__sim/reset` no `beforeEach` dos seus testes para garantir isolamento total entre cenários.

---

## Uso com Docker (futuro)

Um Dockerfile será adicionado em breve para facilitar o uso em pipelines de CI/CD. Por enquanto, você pode usar diretamente:

```bash
# Exemplo para CI
npm ci
cd ui && npm ci && npm run build && cd ..
PORT=8787 node src/index.js &

# Execute seus testes
npm test

# Encerre o servidor
kill %1
```

---

## Diferenças em relação ao Asaas real

| Aspecto | Asaas real | PayGuin |
|---------|-----------|-------------|
| Autenticação | API key validada | Qualquer string funciona |
| CPF/CNPJ | Validação real | Sem validação |
| Pagamentos | Processamento real | Simulação via endpoints `/__sim` |
| Webhooks | Com retentativas | Sem retentativas |
| Boleto URL | URL real do banco | URL fake |
| PIX QR Code | QR code real | QR code fake |
| Notas Fiscais | Emissão real na prefeitura | Simulação local |
| Rate limiting | Sim | Não |

---

## Stack

| Componente | Tecnologia |
|------------|-----------|
| Backend | Node.js + Express |
| Banco de dados | better-sqlite3 (SQLite) |
| Frontend (Admin UI) | Vue 3 + Tailwind CSS |
| Dependências externas | Nenhuma |

Zero serviços externos necessários. Tudo roda localmente.

---

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona minha feature'`)
4. Faça push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

Por favor, siga o estilo de código existente e adicione testes quando possível.

---

## License

[MIT](LICENSE)
