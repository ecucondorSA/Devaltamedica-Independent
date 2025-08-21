# Tracker AltaMedica

Este directorio contiene la fuente de verdad para milestones e issues. Edite `roadmap.yaml` (o `roadmap.json`) y ejecute el script para sincronizar con GitHub.

## Uso
1. Configure el token en PowerShell:
   `$env:GITHUB_TOKEN = "<token>"`
2. Ejecute el script:
   `node tools/scripts/sync_github_tracker.js`
3. Verifique en GitHub que se crearon/actualizaron labels, milestones e issues.

Notas:
- El script incluye un parser YAML mínimo. Para casos complejos, puede crear `.github/tracker/roadmap.json` con el mismo esquema y será preferido.
- Los owners deben ser handles de GitHub válidos con acceso al repo.
