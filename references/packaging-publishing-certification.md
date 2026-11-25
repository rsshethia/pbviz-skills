# Packaging, publishing, and certification

## Package locally

```bash
pbiviz package
# output: dist/<name>.pbiviz
```

Before packaging, `pbiviz.json` must contain: `name`, `displayName`, `guid`, four-part `version`, `description`, `supportUrl`, author `name` and `email`. The `.pbiviz` is what users import and what you upload to Partner Center.

**Never change the GUID when updating a published visual.**

## AppSource submission checklist

Enroll in [Partner Center](https://partner.microsoft.com/) first, then create a Power BI visual offer.

| Item | Required | Details |
| --- | --- | --- |
| `.pbiviz` package | Yes | Built with `pbiviz package`; metadata complete (see above). |
| Sample `.pbix` report | Yes | Demonstrates value and usage; must work **offline** with no external connections. Optional "hints" page. |
| Logo | Yes | PNG, exactly **300 × 300 px**. Distinct from the 20×20 `assets/icon.png`. |
| Screenshots | Yes | 1–5 PNGs, exactly **1366 × 768 px**, ≤ 1024 KB, with text bubbles explaining key features. |
| Support URL | Yes | Must start with `https://`. |
| Privacy policy link | Yes | Must start with `https://`. |
| EULA | Yes | Standard contract, Power BI visuals contract, or your own. |
| Video link | No | Must start with `https://`. |

Also follow the [guidelines for publishing Power BI visuals](https://learn.microsoft.com/en-us/power-bi/developer/visuals/guidelines-powerbi-visuals):

- Enable the **context menu** (both empty-space and data-point modes).
- Create a **landing page** explaining how to use the visual and where to buy a license.
- Do not autoplay videos; include only material that improves the customer experience.
- Put license key/token fields at the **top** of the Format pane.
- Submit a short screen recording and a detailed description including supported features (high contrast, report page tooltips, drill-down).
- Check code quality; no unhandled exceptions.
- Use the latest `powerbi-visuals-api` / `powerbi-visuals-tools`.

## Free vs. "additional purchase may be required" (IAP)

- An **IAP visual is a free visual** with free features plus optional paid advanced features. The description must disclose which features require purchase.
- Transactability and license management are the ISV's responsibility; Microsoft's **Licensing API** is recommended.
- If converting a free visual to IAP, existing users must keep the **same free functionality**; add paid features on top only.
- **Watermarks** are allowed only on **paid** features used without a license — never on free features.
- Show a **pop-up window** explaining how to purchase when a license is invalid/expired; do not build your own full licensing UX.
- In Partner Center, check **"My product requires the purchase of a service"** on the Offer setup tab.

### Licensing API (4.7.0+)

```typescript
const result: powerbi.LicenseInfoResult =
  await host.licenseManager.getAvailableServicePlans();
// { plans, isLicenseUnsupportedEnv, isLicenseInfoAvailable }
```

- Service plan states: **Active** and **Warning** (grace period) are usable; Inactive, Suspended, Unknown are not.
- Fetch once (constructor/init) and cache; the host caches subsequent calls during the session.
- `isLicenseUnsupportedEnv`: licenses are unavailable in Publish to Web / PaaS embed, national clouds, Reporting Services, and REST API exports — do not block the visual there.
- `isLicenseInfoAvailable` false: Desktop offline/not signed in, or temporary service outage — fail open gracefully.
- Use Power BI's predefined notifications for missing licenses instead of a custom licensing UI.

## Commercial logos (optional)

- Allowed in **edit mode only**, never in view mode.
- Three types: logo (icon + name), symbol (graphic only), logotype (text only).
- Color must be grey **#C8C8C8**, no gradients/effects.
- Provide **300 × 300 px PNG** for the offer details page; Partner Center derives the search-page logo.
- Interaction: selecting it either opens your website or a pop-up with a marketing area and an information/links area.
- Informative `(i)` icons in reading mode must follow the same color/size/location rules.

## Certification

Certification is optional but valuable: certified visuals can be exported to PowerPoint and shown in subscribed report emails. Requirements:

### General

- Not an R visual.
- Complies with the publishing guidelines.
- Passes all [required tests](https://learn.microsoft.com/en-us/power-bi/developer/visuals/submission-testing).
- Compiled package exactly matches the submitted package.

### Repository

- Source available for review (GitHub recommended).
- Repository contains code for **one** visual only, no unrelated code.
- Branch named **`certification`** (lowercase) whose source matches the submitted package.
- Private npm packages / git submodules require granting access.

### Files

- `.gitignore` includes `node_modules`, `.tmp`, `dist` (these folders must not be committed).
- `capabilities.json`, `pbiviz.json`, `package.json`, `package-lock.json`, `tsconfig.json`.
- `package.json` installs `typescript`, `eslint`, `eslint-plugin-powerbi-visuals` and has `"eslint": "npx eslint . --ext .js,.jsx,.ts,.tsx"`.
- Use the latest API and latest `powerbi-visuals-tools`.

### Source code rules

Required:

- Only public, reviewable OSS components.
- Support the Rendering Events API (`host.eventService`).
- Sanitize user input/data before adding it to the DOM.
- Test with the provided sample report.

Not allowed:

- External services/resources; no HTTP/S or WebSocket calls out of Power BI. `WebAccess` privilege must be empty or omitted.
- `fetch`, `XMLHttpRequest`.
- `innerHTML`, `d3.html(user data or user input)`.
- JavaScript errors/exceptions in the console for any input data.
- Arbitrary/dynamic code: `eval()`, unsafe `Function()`, `setTimeout`/`setInterval` with user input functions, etc.
- Minified JavaScript files/projects.

## Submission flow

1. Build and test locally.
2. Run certification audits/lint/audit commands.
3. Upload `.pbiviz` + `.pbix` and assets to Partner Center.
4. Check "Request Power BI certification" if pursuing certification, and fill the Notes for certification box.
5. Track validation status and publication timeline in Partner Center.

Sources: [Publish visuals](https://learn.microsoft.com/en-us/power-bi/developer/visuals/office-store), [Certification](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified), [Licensing API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/licensing-api), [Publishing guidelines](https://learn.microsoft.com/en-us/power-bi/developer/visuals/guidelines-powerbi-visuals).
