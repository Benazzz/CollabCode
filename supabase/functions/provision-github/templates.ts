// Deterministic, reviewed starters. No user-supplied code or credentials are executed.
export function starterFiles(
  slug: string,
  projectId: string,
  title: string,
): Record<string, string> {
  const withSupabase = slug === 'react-supabase'
  const withDotnet = slug === 'dotnet-react'
  const prefix = withDotnet ? 'web/' : ''
  const files: Record<string, string> = {
    '.gitignore': 'node_modules/\ndist/\n.env\n.env.*\n!.env.example\nbin/\nobj/\n',
    '.collabcode.json': JSON.stringify({ projectId, template: slug, version: 1 }, null, 2),
    'README.md':
      '# ' +
      title.replace(/[\r\n]/g, ' ') +
      '\n\nA project started together on CollabCode.\n\n## Getting started\n\n' +
      (withDotnet
        ? 'Frontend: run npm install and npm run dev from web/.\nBackend: install the .NET 10 SDK, then run dotnet run --project api.\n\n'
        : 'Run npm install, then npm run dev.\n\n') +
      (withSupabase
        ? 'Copy .env.example to .env.local and add your own Supabase URL and publishable key.\n\n'
        : '') +
      'Commit the package-lock.json produced by npm install.\n\n## Architecture\n\nThe frontend keeps application wiring in src/app, feature behavior in src/features, shared UI in src/components, and configured clients in src/lib. Compose features in the app layer; do not import between sibling features.\n\nStarter Issues describe your first milestone.\n',
    'AGENTS.md':
      '# Working in this project\n\nUse React + TypeScript and the existing feature-based architecture. Keep business logic in features; shared UI must not import features. Do not expose secrets to browser code. Ask before deleting important files or data. Update documentation when architecture changes.\n',
  }
  const dependencies: Record<string, string> = { react: '19.3.1', 'react-dom': '19.3.1' }
  if (withSupabase) dependencies['@supabase/supabase-js'] = '2.119.0'
  files[prefix + 'package.json'] = JSON.stringify(
    {
      name: 'collabcode-project',
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview' },
      dependencies,
      devDependencies: {
        '@types/react': '19.3.0',
        '@types/react-dom': '19.3.0',
        '@vitejs/plugin-react': '6.1.2',
        typescript: '6.0.3',
        vite: '8.3.5',
      },
    },
    null,
    2,
  )
  files[prefix + 'index.html'] =
    '<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Our next project</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n'
  files[prefix + 'tsconfig.json'] = JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: ['vite/client'],
      },
      include: ['src'],
    },
    null,
    2,
  )
  files[prefix + 'vite.config.ts'] =
    "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins:[react()] })\n"
  files[prefix + 'src/main.tsx'] =
    "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport { App } from './app/app'\nimport './index.css'\ncreateRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)\n"
  files[prefix + 'src/app/app.tsx'] =
    'export function App() { return <main><p>OUR NEXT CHAPTER</p><h1>Good things are built together.</h1><p>A small beginning. A shared ambition. Make this space your own.</p></main> }\n'
  files[prefix + 'src/index.css'] =
    'body{margin:0;background:#f4f3eb;color:#304442;font-family:system-ui,sans-serif}main{max-width:720px;margin:18vh auto;padding:32px}h1{font-family:Georgia,serif;font-size:48px;font-weight:400}p{line-height:1.8;color:#7f8a73}\n'
  for (const dir of [
    'features',
    'components',
    'hooks',
    'types',
    'utils',
    'assets',
    'config',
    'lib',
  ])
    files[prefix + 'src/' + dir + '/.gitkeep'] = ''
  if (withSupabase) {
    files[prefix + '.env.example'] = 'VITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=\n'
    files[prefix + 'src/lib/supabase.ts'] =
      "import { createClient } from '@supabase/supabase-js'\nconst url = import.meta.env.VITE_SUPABASE_URL\nconst key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY\nif (!url || !key) throw new Error('Configure your Supabase environment variables')\nexport const supabase = createClient(url,key)\n"
  }
  if (withDotnet) {
    files['api/Api.csproj'] =
      '<Project Sdk="Microsoft.NET.Sdk.Web"><PropertyGroup><TargetFramework>net10.0</TargetFramework><Nullable>enable</Nullable><ImplicitUsings>enable</ImplicitUsings></PropertyGroup></Project>\n'
    files['api/Program.cs'] =
      'var builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173").AllowAnyHeader().AllowAnyMethod()));\nvar app = builder.Build();\napp.UseCors();\napp.MapGet("/api/health", () => Results.Ok(new { status = "ready" }));\napp.Run();\n'
    files['api/Properties/launchSettings.json'] = JSON.stringify(
      {
        profiles: {
          Api: {
            commandName: 'Project',
            applicationUrl: 'http://localhost:5000',
            environmentVariables: { ASPNETCORE_ENVIRONMENT: 'Development' },
          },
        },
      },
      null,
      2,
    )
    files[prefix + 'src/config/api.ts'] =
      "export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'\n"
  }
  return files
}
