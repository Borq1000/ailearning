// Обход бага Next 16 на Windows: при `output: 'export'` файлы сегментов для префетча должны лежать плоско
// (`__next.review.__PAGE__.txt`), но из-за обратных слэшей в path.relative попадают во вложенные папки
// (`__next.review/__PAGE__.txt`), и браузер получает 404. На Linux/macOS вложенных папок нет — скрипт ничего не делает.
import { promises as fs } from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'out')

/** Переносит файлы из вложенной папки `__next.*` в плоские файлы рядом с ней. */
async function flatten(dir, prefix, destDir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await flatten(full, `${prefix}.${entry.name}`, destDir)
    } else {
      await fs.rename(full, path.join(destDir, `${prefix}.${entry.name}`))
    }
  }
  await fs.rmdir(dir)
}

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const full = path.join(dir, entry.name)
    if (entry.name.startsWith('__next.')) {
      await flatten(full, entry.name, dir)
    } else if (entry.name !== '_next') {
      await walk(full)
    }
  }
}

await walk(OUT)
