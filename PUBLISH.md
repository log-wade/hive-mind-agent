# Publishing Hive-Mind Agent

Steps to publish as open source.

## 1. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `hive-mind-agent`
3. Description: "Model-agnostic, project-agnostic multi-agent hive orchestration"
4. Public, add README (or skip if this repo has one)
5. Create repository

## 2. Push to GitHub

```bash
cd /path/to/hive-mind-agent
git add .
git commit -m "Initial release: hive-mind orchestration for Cursor, CLI, MCP, API"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/hive-mind-agent.git
git push -u origin main
```

Update `package.json` `repository`, `bugs`, and `homepage` URLs if your org differs from `hive-mind-agent`.

## 3. Publish to npm

```bash
# Log in (one-time)
npm login

# Dry run to verify package contents
npm pack --dry-run

# Publish
npm publish
```

After publish, anyone can run:
```bash
npx hive-mind-agent init
```

## 4. Install Skill (for users)

Users who clone or install the package can install the Cursor skill:

```bash
cd hive-mind-agent
npm run skill:install
```

This copies the skill to `~/.cursor/skills/hive-mind-orchestrator/`.

## 5. Release Tags

For versioned releases:
```bash
npm version patch   # or minor, major
git push && git push --tags
npm publish
```
