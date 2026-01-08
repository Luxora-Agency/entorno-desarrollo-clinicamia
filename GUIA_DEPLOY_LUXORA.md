# 🚀 Guía de Deploy al Repositorio Luxora-Agency

Esta guía te ayudará a subir el código al nuevo repositorio de Luxora Agency.

---

## ✅ Estado Actual

El repositorio ya ha sido creado exitosamente:

- **Organización**: Luxora-Agency
- **Repositorio**: entorno-desarrollo-clinicamia
- **URL**: https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia
- **Visibilidad**: Público

### Remotes Configurados

```bash
origin  → https://github.com/lumicame/clinica-mia.git
luxora  → https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia.git
```

---

## 📤 Opción 1: Push al Repositorio Luxora (Recomendado)

### Paso 1: Verificar el estado actual

```bash
# Ver el estado de los archivos
git status

# Ver los remotes configurados
git remote -v
```

### Paso 2: Agregar y commitear archivos nuevos

```bash
# Agregar archivos de documentación creados
git add README.md ORGANIZACION_REPOSITORIO.md GUIA_DEPLOY_LUXORA.md

# Commit
git commit -m "docs: agregar documentación organizacional y README completo

- Añadido README.md principal con información completa del proyecto
- Añadido ORGANIZACION_REPOSITORIO.md con estructura detallada
- Añadido GUIA_DEPLOY_LUXORA.md con instrucciones de deploy
"
```

### Paso 3: Push a Luxora Agency

```bash
# Push de la rama actual al repositorio Luxora
git push luxora feature/procesos-prioritarios-module

# O si quieres pushear main/master
git push luxora main
```

### Paso 4: Configurar branch default (Opcional)

Si quieres hacer que Luxora sea tu remote por defecto:

```bash
# Cambiar el remote origin a luxora
git remote rename origin origin-old
git remote rename luxora origin

# Verificar
git remote -v
```

---

## 📤 Opción 2: Migración Completa

Si quieres migrar todo el historial y todas las ramas:

```bash
# Push de todas las ramas
git push luxora --all

# Push de todos los tags
git push luxora --tags
```

---

## 🔄 Opción 3: Mantener Ambos Remotes

Puedes mantener ambos repositorios sincronizados:

```bash
# Push a origin (lumicame)
git push origin feature/procesos-prioritarios-module

# Push a luxora
git push luxora feature/procesos-prioritarios-module
```

---

## 📋 Checklist Pre-Deploy

Antes de hacer push, verifica:

- [ ] **Archivos sensibles**: No hay `.env` files en el commit
- [ ] **Secrets**: No hay API keys, passwords o tokens
- [ ] **node_modules**: Está en .gitignore (✅ ya configurado)
- [ ] **Archivos grandes**: No hay archivos binarios grandes innecesarios
- [ ] **Documentación**: README.md está actualizado (✅ ya creado)
- [ ] **Variables de entorno**: Crear archivos .env.example

### Crear archivos .env.example

```bash
# Backend
cp backend/.env backend/.env.example
# Editar .env.example y eliminar valores reales

# Frontend
cp frontend/.env.local frontend/.env.local.example
# Editar .env.local.example y eliminar valores reales
```

---

## 🔒 Configuración de Seguridad

### 1. Proteger Branch Main

En GitHub:
1. Ir a https://github.com/Luxora-Agency/entorno-desarrollo-clinicamia/settings/branches
2. Click en "Add branch protection rule"
3. Configurar:
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require linear history
   - ✅ Include administrators

### 2. Configurar Secrets

Para GitHub Actions:
1. Ir a Settings → Secrets and variables → Actions
2. Agregar secrets:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (opcional)

### 3. Configurar Team Access

1. Ir a Settings → Collaborators and teams
2. Agregar miembros del equipo con permisos apropiados

---

## 🚀 Despliegue Continuo

### GitHub Actions (Opcional)

Crear `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          backend/package-lock.json
          frontend/package-lock.json

    - name: Install Backend Dependencies
      working-directory: ./backend
      run: npm ci

    - name: Install Frontend Dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Run Backend Tests
      working-directory: ./backend
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        JWT_SECRET: test_secret

    - name: Run Frontend Tests
      working-directory: ./frontend
      run: npm test
```

---

## 📝 Comandos Útiles

### Ver historial de commits
```bash
git log --oneline --graph --all
```

### Ver diferencias antes de push
```bash
git diff luxora/main
```

### Cambiar de remote
```bash
# Ver remote actual de una rama
git branch -vv

# Cambiar remote de una rama
git branch --set-upstream-to=luxora/main main
```

### Limpiar branches antiguas
```bash
# Ver branches remotas
git branch -r

# Eliminar branch remota
git push luxora --delete nombre-branch
```

---

## 🐛 Troubleshooting

### Error: "refusing to merge unrelated histories"

Si el repositorio luxora tiene commits que no están en tu local:

```bash
git pull luxora main --allow-unrelated-histories
```

### Error: "authentication failed"

Verificar autenticación de GitHub CLI:

```bash
gh auth status
gh auth login
```

### Error: "remote rejected"

Verificar permisos en la organización:
1. Ir a https://github.com/Luxora-Agency
2. Verificar que tienes permisos de escritura

---

## 📞 Siguiente Pasos

1. ✅ Push del código al repositorio Luxora
2. ⬜ Configurar branch protection rules
3. ⬜ Agregar colaboradores al repositorio
4. ⬜ Configurar GitHub Actions (CI/CD)
5. ⬜ Configurar secrets en GitHub
6. ⬜ Crear archivos .env.example
7. ⬜ Documentar proceso de deploy en producción
8. ⬜ Configurar webhooks (opcional)

---

## 📚 Referencias

- [GitHub: Managing remotes](https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories)
- [GitHub: Branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions: CI/CD](https://docs.github.com/en/actions)

---

<p align="center">
  <strong>¿Listo para hacer push?</strong> 🚀
</p>

```bash
git push luxora feature/procesos-prioritarios-module
```
