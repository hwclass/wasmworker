# Publishing Guide

This guide walks you through publishing `@wasmworker/sdk` to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Ensure npm is installed (comes with Node.js)
3. **Authentication**: Log in to npm via CLI

## One-Time Setup

### 1. Create npm Account (if needed)

```bash
npm login
# Enter your username, password, and email
```

Verify you're logged in:
```bash
npm whoami
```

### 2. Set up Organization (Optional)

If you want to publish under `@wasmworker` scope, you need to:

1. Create an organization at [npmjs.com/org/create](https://www.npmjs.com/org/create)
2. Name it `wasmworker`
3. Invite collaborators if needed

**Alternative**: Publish without a scope by changing the package name from `@wasmworker/sdk` to `wasmworker-sdk` in [package.json](./packages/sdk/package.json).

## Pre-Publish Checklist

Before publishing, ensure:

- [ ] All tests pass: `pnpm test`
- [ ] Code builds successfully: `pnpm build`
- [ ] Version number is updated in `packages/sdk/package.json`
- [ ] README.md is up to date
- [ ] LICENSE file exists
- [ ] Repository URL is correct in package.json
- [ ] Author information is correct

## Publishing Steps

### 1. Navigate to SDK Package

```bash
cd packages/sdk
```

### 2. Verify Package Contents

Preview what will be published:

```bash
npm pack --dry-run
```

This shows all files that will be included. Verify that:
- `dist/` folder is included
- `README.md` is included
- `LICENSE` is included
- Source files (`src/`, `tests/`) are **NOT** included

### 3. Update Version

Update the version in `package.json` following [semantic versioning](https://semver.org/):

- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

```bash
# Option 1: Manual edit
# Edit packages/sdk/package.json and change "version": "0.1.0"

# Option 2: Use npm version command
npm version patch  # for 0.1.0 -> 0.1.1
npm version minor  # for 0.1.0 -> 0.2.0
npm version major  # for 0.1.0 -> 1.0.0
```

### 4. Build and Test

The `prepublishOnly` script will automatically run, but you can test manually:

```bash
pnpm run clean
pnpm run build
pnpm run test
```

### 5. Publish to npm

For first-time publish with scoped package:

```bash
npm publish --access public
```

For subsequent publishes:

```bash
npm publish
```

### 6. Verify Publication

Check your package on npm:

```bash
# View package info
npm view @wasmworker/sdk

# Or visit
# https://www.npmjs.com/package/@wasmworker/sdk
```

### 7. Tag Release on GitHub

```bash
cd ../..  # back to repo root
git tag v0.1.0
git push origin v0.1.0
```

## Testing Installation

After publishing, test installation in a fresh project:

```bash
mkdir test-wasmworker
cd test-wasmworker
npm init -y
npm install @wasmworker/sdk

# Verify it installs correctly
node -e "console.log(require('@wasmworker/sdk'))"
```

## Publishing Beta/RC Versions

For pre-release versions:

```bash
# Update version to something like "0.2.0-beta.1"
npm version 0.2.0-beta.1

# Publish with beta tag
npm publish --tag beta
```

Users can install with:
```bash
npm install @wasmworker/sdk@beta
```

## Unpublishing (Use with Caution!)

You can unpublish within 72 hours of publishing:

```bash
npm unpublish @wasmworker/sdk@0.1.0
```

**Warning**: Unpublishing is discouraged and may be blocked for packages with high download counts.

## Common Issues

### Issue: "You do not have permission to publish"

**Solution**:
- Ensure you're logged in: `npm whoami`
- If using a scope (@wasmworker), ensure the organization exists
- Add `--access public` flag

### Issue: "Version already exists"

**Solution**:
- You cannot republish the same version
- Increment the version number
- Use `npm version patch/minor/major`

### Issue: "Package name too similar to existing package"

**Solution**:
- Choose a different package name
- Or use a scope: `@yourname/wasmworker`

### Issue: Files missing in published package

**Solution**:
- Check the `files` array in package.json
- Use `npm pack --dry-run` to preview
- Verify symlinks are working for README/LICENSE

## Automation with GitHub Actions (Optional)

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - run: pnpm install
      - run: pnpm build
      - run: pnpm test

      - name: Publish to npm
        run: |
          cd packages/sdk
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then add your npm token to GitHub secrets:
1. Create npm token: `npm token create`
2. Add to GitHub: Settings → Secrets → New repository secret
3. Name: `NPM_TOKEN`, Value: your token

## Best Practices

1. **Always test before publishing**: Run `pnpm test` and `pnpm build`
2. **Use semantic versioning**: Follow semver for version numbers
3. **Maintain a changelog**: Document changes in CHANGELOG.md (or git tags)
4. **Tag releases**: Create git tags for each published version
5. **Test installation**: Install your package in a test project
6. **Use `.npmignore`**: Already configured in the SDK package
7. **Monitor downloads**: Check npm stats periodically

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
- [Creating Organizations](https://docs.npmjs.com/creating-an-organization)

## Support

If you encounter issues:
- Check [npm status](https://status.npmjs.org/)
- Search [npm support](https://docs.npmjs.com/)
- Ask in the npm community forums
