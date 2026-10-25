import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// Memuat fungsi dan konstanta murni dari berkas yang tidak boleh mengekspornya
// (misalnya page.tsx Next.js) agar perilakunya bisa dikunci oleh tes
// karakterisasi tanpa mengubah berkas aslinya. Hanya dipakai sampai logika itu
// dipindah ke modul bersama; setelah itu tes mengimpor modulnya langsung.
// `scope` berisi nilai yang diimpor berkas asal (misalnya peta warna status) agar
// potongan kode bisa dijalankan tanpa memuat seluruh berkas.
export function loadSourceDeclarations<T extends Record<string, unknown>>(
  relativePath: string,
  names: (keyof T & string)[],
  scope: Record<string, unknown> = {},
): T {
  const filePath = path.resolve(process.cwd(), relativePath);
  const sourceText = fs.readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const wanted = new Set<string>(names);
  const snippets: string[] = [];

  for (const statement of source.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      wanted.has(statement.name.text)
    ) {
      snippets.push(statement.getText(source));
      wanted.delete(statement.name.text);
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          wanted.has(declaration.name.text)
        ) {
          snippets.push(statement.getText(source));
          wanted.delete(declaration.name.text);
        }
      }
    }
  }

  if (wanted.size > 0) {
    throw new Error(
      `Deklarasi tidak ditemukan di ${relativePath}: ${[...wanted].join(", ")}`,
    );
  }

  const program = `${snippets.join("\n")}\nreturn { ${names.join(", ")} };`;
  const { outputText } = ts.transpileModule(program, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2022,
    },
  });

  return new Function(...Object.keys(scope), outputText)(
    ...Object.values(scope),
  ) as T;
}
