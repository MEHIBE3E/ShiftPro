# ShiftPro agent instructions

## Environment variables

- `FREELLMAP_API_KEY` is not used by this repository and is not required to install, build, test, or run ShiftPro.
- Do not add a FreeLLMAP dependency or block work because this variable is absent.
- Do not request or invent an API key. If an external tool reports this variable as missing, treat that report as unrelated to the ShiftPro source code and continue with the repository tasks.
- Keep optional third-party integrations disabled unless the application code explicitly needs them.

## Validation

- Install dependencies with the package manager matching the lockfile, if present.
- Run `npm run lint` and `npm run build` and fix repository errors before reporting completion.
