// The published package is assembled in dist/ and packed from there, so packing
// the repository root would produce a tarball with everything nested one level
// deeper - every path the CLI resolves through __dirname would break, silently.
// npm pack ./dist runs dist's own manifest, so this guard does not fire for it.
//
// The release script is deliberately not called "pack": npm runs pre<name> for
// any script, so `npm run pack` would fire this guard as its own pre-hook.
console.error(
  [
    "Refusing to pack the repository root.",
    "",
    "The published package is assembled in dist/. Use:",
    "  npm run pack.release",
    "",
    "which builds dist/ and runs `npm pack ./dist`.",
  ].join("\n")
);

process.exit(1);
