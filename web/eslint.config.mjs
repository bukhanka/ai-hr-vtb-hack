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
      // Максимально ослабляем правила для хакатона
      "@typescript-eslint/no-unused-vars": "off", // Полностью отключаем неиспользуемые переменные
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off", // Отключаем проверку зависимостей хуков
      // Отключаем самые проблемные правила
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      // Дополнительные правила для упрощения разработки
      "@typescript-eslint/prefer-const": "off",
      "@typescript-eslint/no-var-requires": "off",
      "prefer-const": "off",
    },
  },
];

export default eslintConfig;
