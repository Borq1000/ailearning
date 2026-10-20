// Обход бага Next 16 на Windows (наблюдался в 16.4.2): при `output: 'export'` файлы сегментов для префетча должны лежать
// плоско (`__next.review.__PAGE__.txt`), но из-за обратных слэшей в path.relative попадают во вложенные папки
// (`__next.review/__PAGE__.txt`). Симптом: 404 на RSC-файлы `__next.*.__PAGE__.txt` при префетче ссылок.
// На Linux/macOS вложенных папок нет — скрипт ничего не делает.
// Удалить, когда релиз Next начнёт писать плоские файлы сегментов на Windows (и убрать "postbuild" из package.json).
import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'out')

/** Переносит файлы из вложенной папки `__next.*` в плоские файлы рядом с ней. */
async function flatten(dir, prefix, destDir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await flatten(full, `${prefix}.${entry.name}`, destDir)
    } else {
      const dest = path.join(destDir, `${prefix}.${entry.name}`)
      if (existsSync(dest)) {
        console.warn(`flatten-segments: ${dest} уже существует, пропускаю ${full}`)
        continue
      }
      await fs.rename(full, dest)
    }
  }
  // папка остаётся, если в ней что-то пропущено, — тогда rmdir бросит ENOTEMPTY, это не ошибка
  await fs.rmdir(dir).catch((e) => {
    if (e.code !== 'ENOTEMPTY') throw e
  })
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

if (!existsSync(OUT)) {
  console.log('flatten-segments: папки out/ нет, пропускаю')
} else {
  await walk(OUT)
}
