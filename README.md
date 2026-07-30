<img src="./images/og-image.png" height="300" alt="mintit" />

---

### A self-hosted payment processor for privacy-focused cryptocurrencies. Accepts payments in fixed fiat amounts and notifies your application via webhooks. Currently supports Firo and Monero, work in progress.

## 📚 Current docs: **[mintit.dev](https://mintit.dev)**

<img src="./images/overview.png" height="700" alt="mintit" />

## Roadmap

### Phase 1 — Core Payment Processor

- [x] Invoice-based payments with unique address per invoice
- [x] Multi-chain support (Firo, XMR)
- [x] Authenticated webhooks
- [x] Admin dashboard
- [x] Docker deployment

### Phase 2 — Merchant Focus

- [x] 2FA
- [x] Per-invoice coin selection
- [x] Invoice memos
- [x] Hosted checkout page
- [x] Additional coin support
- [x] Configurable coin price sources
- [ ] TBA

### Phase 3 — Developer Experience (TBD)

## Development

### Dev mode (hot reload)

```bash
cp .env.example.dev .env.local   # fill in RPC creds, etc.
pnpm install
pnpm dev
```

Runs the API and web app directly via `turbo run dev`, reading config from `.env.local`.

### Docker demo (Caddy + built image)

```bash
cp .env.example.prod .env        # fill in every blank
docker compose up -d
```

Builds the app image from the root `Dockerfile` (multi-stage: builds `@mintit/types`, `@mintit/api`, `@mintit/web`, then serves the API + built SPA from one Node process) and fronts it with Caddy for TLS termination, alongside a Postgres container. See `docker-compose.yml` for the full service layout.
