export const paths = {
  home: '/',
  projects: '/projects',
  project: (id: string) => `/projects/${id}`,
  createProject: '/projects/new',
  people: '/people',
  profile: (id: string) => `/people/${id}`,
  myProjects: '/workspace',
  settings: '/settings',
  login: '/auth/login',
  register: '/auth/register',
}
