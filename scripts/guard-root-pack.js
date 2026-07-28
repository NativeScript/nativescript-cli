// The published package is assembled in dist/ and packed from there, so packing
// the repository root would produce a tarball with everything nested one level
// deeper - every path the CLI resolves through __dirname would break, silently.
// npm pack ./dist runs dist's own manifest, so this guard does not fire for it.
console.error(
  [
    "Refusing to pack the repository root.",
    "",
    "The published package is assembled in dist/. Use:",
    "  npm run pack",
    "",
    "which builds dist/ and runs `npm pack ./dist`.",
  ].join("\n")
);

process.exit(1);
