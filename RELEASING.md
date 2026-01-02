# Releasing Year Glance

## Initial Release (First Time Only)

```bash
# Commit all files
git add .
git commit -m "Initial release"

# Add remote and push
git remote add origin https://github.com/yy/obsidian-year-glance.git
git push -u origin main

# Create and push the initial tag
git tag 0.1.0
git push --tags
```

Then go to GitHub → Releases, edit the draft, and publish it.

---

## Creating Subsequent Releases

1. **Bump version number**
   ```bash
   npm version patch   # for bug fixes (0.1.0 → 0.1.1)
   npm version minor   # for new features (0.1.0 → 0.2.0)
   npm version major   # for breaking changes (0.1.0 → 1.0.0)
   ```
   This command automatically:
   - Updates version in `package.json`
   - Runs `version-bump.mjs` to sync `manifest.json` and `versions.json`
   - Creates a git commit
   - Creates a git tag (e.g., `v0.1.1`)

2. **Push changes and tag**
   ```bash
   git push && git push --tags
   ```
   Pushing the tag triggers the GitHub Actions workflow to build and create a draft release.

3. **Publish the release**
   - Go to GitHub → Releases
   - Edit the draft release created by the workflow
   - Add release notes
   - Click "Publish release"

---

## Submitting to Obsidian Community Plugins

### Prerequisites

- [ ] Public GitHub repository
- [ ] At least one published release with `main.js`, `manifest.json`, `styles.css`
- [ ] `README.md` with plugin description
- [ ] `LICENSE` file

### Steps

1. **Fork the obsidian-releases repository**
   https://github.com/obsidianmd/obsidian-releases

2. **Edit `community-plugins.json`**

   Add this entry (maintain alphabetical order by `id`):
   ```json
   {
     "id": "year-glance",
     "name": "Year Glance",
     "author": "YY Ahn",
     "description": "Render yearly calendar views with events marked and color-coded",
     "repo": "yy/obsidian-year-glance"
   }
   ```

3. **Submit a Pull Request**
   - Title: `Add Year Glance plugin`
   - The PR template will guide you through required information

4. **Wait for review**
   - Typically takes 1-2 weeks
   - Obsidian team reviews for security and guideline compliance
   - You may receive feedback to address before approval

### After Approval

Once approved, your plugin will appear in Obsidian's Community Plugins browser. Users can install it directly from Settings → Community plugins → Browse.
