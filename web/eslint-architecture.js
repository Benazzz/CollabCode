import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = fileURLToPath(new URL('./src', import.meta.url))
const segments = (file) => relative(sourceRoot, file).replaceAll('\\', '/').split('/')

// An import must travel from app -> features -> shared, or stay within its feature.
export const architecture = {
  rules: {
    boundaries: {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          boundary:
            'Keep dependencies shared → features → app. Compose sibling features in app/routes.',
        },
      },
      create(context) {
        const from = segments(context.filename)
        function check(node) {
          const value = node.source?.value
          if (typeof value !== 'string' || (!value.startsWith('@/') && !value.startsWith('.')))
            return
          const target = value.startsWith('@/')
            ? resolve(sourceRoot, value.slice(2))
            : resolve(dirname(context.filename), value)
          const to = segments(target)
          const crossFeature = from[0] === 'features' && to[0] === 'features' && from[1] !== to[1]
          const featureToApp = from[0] === 'features' && to[0] === 'app'
          const sharedToBusiness =
            !['app', 'features', 'main.tsx', 'App.tsx'].includes(from[0]) &&
            ['app', 'features'].includes(to[0])
          if (crossFeature || featureToApp || sharedToBusiness)
            context.report({ node, messageId: 'boundary' })
        }
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
        }
      },
    },
  },
}
