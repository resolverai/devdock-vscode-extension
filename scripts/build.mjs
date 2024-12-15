/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import esbuild from 'esbuild'
import { copy } from 'esbuild-plugin-copy';
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config();

(async () => {
  const extensionConfig = {
    bundle: true,
    entryPoints: ['src/index.ts'],
    external: ['vscode', 'esbuild', './xhr-sync-worker.js', 'sodium-native', 'udx-native', 'b4a'],
    format: 'cjs',
    outdir: 'out',
    platform: 'node',
    minify: true,
    sourcemap: true,
    loader: { '.node': 'file' },
    assetNames: '[name]',
    define: {
      "process.env.ALCHEMY_AUTH0_DOMAIN": JSON.stringify(process.env.ALCHEMY_AUTH0_DOMAIN || ""),
      "process.env.ALCHEMY_AUTH0_CLIENT_ID": JSON.stringify(process.env.ALCHEMY_AUTH0_CLIENT_ID || ""),
      "process.env.ALCHEMY_AUTH0_REDIRECT_URI": JSON.stringify(process.env.ALCHEMY_AUTH0_REDIRECT_URI || ""),
      "process.env.ALCHEMY_CLIENT_SECRET": JSON.stringify(process.env.ALCHEMY_CLIENT_SECRET || ""),
      "process.env.ALCHEMY_API_KEY": JSON.stringify(process.env.ALCHEMY_API_KEY || ""),
      "process.env.CHATGPT_API_KEY": JSON.stringify(process.env.CHATGPT_API_KEY || "")
    },
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: [
          {
            from: './node_modules/onnxruntime-web/dist/ort-wasm-simd.wasm',
            to: './out/ort-wasm-simd.wasm'
          },
          {
            from: './node_modules/tree-sitter-wasms/out/**/*.wasm',
            to: './out/tree-sitter-wasms'
          },
          {
            from: './node_modules/web-tree-sitter/tree-sitter.wasm',
            to: './out/tree-sitter.wasm'
          },
          {
            from: './node_modules/web-tree-sitter/tree-sitter.wasm',
            to: './out/tree-sitter.wasm'
          },
          {
            from: './node_modules/web-tree-sitter/tree-sitter.wasm',
            to: './out/tree-sitter.wasm'
          }
        ],
        watch: true,
      })
    ]
  }

  const webConfig = {
    bundle: true,
    external: ['vscode'],
    entryPoints: ['src/webview/index.tsx'],
    outfile: 'out/sidebar.js',
    sourcemap: true,
    plugins: [],
  }

  const flags = process.argv.slice(2);

  if (flags.includes('--watch')) {
    const ctx = await esbuild.context(webConfig);
    const ectx = await esbuild.context(extensionConfig);
    await ctx.watch();
    await ectx.watch();
  } else {
    await esbuild.build(webConfig);
    await esbuild.build(extensionConfig);
  }
})()
