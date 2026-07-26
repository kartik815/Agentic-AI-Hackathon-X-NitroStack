# Workspace Rules & GitHub Sync Guidelines

## Continuous GitHub Synchronization Workflow

- **Target Repository**: `https://github.com/kartik815/Agentic-AI-Hackathon-X-NitroStack.git`
- **Target Branch**: `main`

### Rules & Workflow:
1. **Pre-Change Verification**:
   - Before making significant code changes, pull latest changes from `origin main`.
   - Ensure clean working tree or resolve conflicts safely.
2. **Build Verification**:
   - Ensure the project builds successfully before committing (`npm run build` where appropriate).
3. **Commit & Push Milestones**:
   - After completing each meaningful milestone (not every tiny edit), stage appropriate files, create a descriptive commit, and push immediately to `origin main`.
   - Never wait until the end of a long implementation.
4. **Security & Exclusions**:
   - Never commit `.env`, `.env.*`, `node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, logs, or hardcoded secrets/tokens.
5. **Push Reporting**:
   - After every successful push, briefly report:
     - Commit Hash
     - Commit Message
     - Branch
     - Push Status

## Post-Implementation Compile & Sanity Check Protocol
After implementing any feature or bug fix:
- Ensure the project compiles successfully.
- Resolve all TypeScript errors in changed files.
- Resolve all ESLint errors.
- Ensure all imported components and icons exist.
- Ensure there are no undefined React components.
- Do not leave any runtime ReferenceErrors.

