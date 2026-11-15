# moatazbuilds.github.io

Portfolio site for Moataz Sayed. Live at https://moatazbuilds.github.io

## How it is put together

| Path | What it is |
|---|---|
| `index.html` | The live site. One self-contained page. It is generated, so do not edit it by hand. |
| `content.json` | All the words, projects and picture references. The single source of truth. |
| `assets/` | Photos, videos and the resume PDF. |
| `edit/` | The editor at https://moatazbuilds.github.io/edit/ . `render.js` turns `content.json` into the page, `shell.html` is the fixed part of the page (styles, fonts, script). |
| `src/` | The source for the fixed part of the page: `page.html`, `site.css`, `fonts.css`, `site.js`. |
| `tools/build.mjs` | Rebuilds `edit/shell.html` and `index.html`. |

## Changing content

Open https://moatazbuilds.github.io/edit/ , make changes, press Publish. The editor writes `content.json`, `index.html` and any new files in `assets/` in one commit.

## Changing the design

Edit the files in `src/`, then run:

```
node tools/build.mjs
```

Commit the changed files in `src/` together with the regenerated `edit/shell.html` and `index.html`.
