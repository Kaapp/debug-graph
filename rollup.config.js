import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        format: "umd",
        name: "DebugGraphs",
        file: "dist/main.js",
        indent: "  ",
        sourcemap: true,
      },
      {
        format: "es",
        name: "DebugGraphs",
        file: "dist/module.js",
        indent: "  ",
        sourcemap: true,
      },
    ],
    plugins: [typescript()],
  },
  {
    input: "./dist/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
