# Deployment and branch workflow

## Existing owner-managed setup

The owner reports that this GitHub repository is already connected to Vercel, with `main` deployed as production and `develop` deployed as the development preview. This document records that setup; it does not change project settings or claim a new deployment was performed.

| Git branch | Role | Expected Git-triggered behavior |
|---|---|---|
| `main` | Production release | Continue the production build/deployment |
| `develop` | Integration and developer preview | Continue the preview build/deployment |
| Any other branch | Feature/fix work | Cancel the build through Ignored Build Step |

Keep `main` selected as the Vercel Production Branch. The branch-filter command below only decides whether a build proceeds; it does not itself choose production versus preview.

### Owner-provided dashboard references

- [Vercel project / production overview](https://vercel.com/reyowners-projects/intrigue-rental-investment-calculator)
- [Existing develop deployment reference](https://vercel.com/reyowners-projects/intrigue-rental-investment-calculator/6MXLEfbtxTer3vtuoqxroLFLS39U)

These are management/dashboard links, not public live-app URLs. The second link identifies one deployment, not a moving alias for the latest `develop` build. Open the corresponding deployment's Domains/Visit entry for its app URL. No production domain or preview alias is guessed here. The public dashboard shell did not expose usable branch/status/domain details during documentation review, so owner-reported settings and hosted application behavior are not independently certified by these links.

## Ignored Build Step

In **Project Settings > Build and Deployment > Ignored Build Step**, the owner configured this exact custom command:

```sh
bash -c 'if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] || [ "$VERCEL_GIT_COMMIT_REF" = "develop" ]; then exit 1; else exit 0; fi'
```

This is the **Ignored Build Step**, not the application's Build Command. Vercel interprets exit `1` as continue the build and exit `0` as cancel it. Consequently, only exact `main`/`develop` refs continue; feature/fix branches and an unset ref are skipped. The application itself is static HTML/CSS/native JavaScript: serve the repository root, including `index.html`, `src/` and `assets/`. No package installation or application compilation is required.

The filter avoids unnecessary completed branch builds, but is not a guarantee of zero deployment records, storage use, quota use or charges. Vercel documents that ignored/canceled builds can still count toward deployment quotas and concurrent build slots. Manual redeploys can also bypass Ignored Build Step if that option is unchecked. See [official Ignored Build Step documentation](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step) and [Vercel's command examples](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel).

The setting currently lives in the Vercel dashboard. No `vercel.json`, deployment hook, CLI deployment or replacement branch-filter script is introduced by this documentation change.

## Contribution and release flow

1. Create a feature/fix branch from current `develop`, keeping changes focused.
2. Run local automated/browser checks and update the relevant documentation.
3. Commit and push that feature branch. Its app build is intentionally skipped; test locally rather than expecting a feature-specific preview URL.
4. Manually open a PR with **base `develop`** and the feature branch as head. Review and merge it manually.
5. Check the resulting `develop` preview deployment, confirm its source commit/status, and exercise inputs, View results, chart loading, the full table and phone layout on the hosted app. Do not assume local tests or GitHub push success prove hosted behavior.
6. When the preview is accepted, manually open/review a separate PR from `develop` into **`main`**. Its merge is the production-release action, not part of a feature-branch push.
7. Verify the production deployment and domain against that release commit. Confirm the contact form still honestly reports local-only validation; hosting does not add message delivery or a backend.

For a faulty release, prefer a reviewed revert PR to the affected branch so Git history and the deployment source stay aligned. Re-run checks and verify the replacement deployment. Do not force-push/reset shared branches or overwrite production content with unreviewed local work.

## Verification boundaries

Local checks are documented in [verification](verification.md) and [projection results](projection-results.md). The branch-filter command can be tested with representative `VERCEL_GIT_COMMIT_REF` values, but that does not verify the saved dashboard setting, permissions, deployment protection, current domains or actual hosted behavior. Treat those as separate release checks. Changing Vercel settings, manually deploying, creating PRs and merging are not included in authorization to push a feature branch.
