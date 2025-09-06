import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/**", // Исключаем автогенерированные Prisma файлы
      "prisma/migrations/**",
    ],
  },
  {
    rules: {
      // Ослабляем правила для хакатона
      "@typescript-eslint/no-unused-vars": "warn", // Превращаем в предупреждения
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@next/next/no-img-element": "warn",
      // Отключаем самые проблемные правила
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

export default eslintConfig;
