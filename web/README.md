# CollabCode frontend

The React + TypeScript + Vite application lives here. Start with the [repository README](../README.md) for the product, architecture map, and complete setup.

```powershell
npm ci
# Create .env.local from .env.example if it does not already exist.
npm run dev
```

Use `npm run build` for TypeScript and a production build. The output is `dist/`; Vercel's root directory is `web/`.

- [AI contributor instructions](../AGENTS.md)
- [Architecture and diagrams](../docs/architecture.md)
- [Supabase, OAuth, and deployment](../docs/setup.md)

Keep feature logic under `src/features/`, compose it in `src/app/routes/`, and use shared modules through `@/` imports. The initial `src/App.tsx` is only a compatibility re-export.
