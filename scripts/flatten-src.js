#!/usr/bin/env node
import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)

function getArgValue(flag, fallback) {
  const index = args.indexOf(flag)
  if (index === -1) return fallback

  const value = args[index + 1]
  if (!value || value.startsWith('--')) return fallback
  return value
}

const sourceDir = path.resolve(getArgValue('--source', 'src'))
const outputDir = path.resolve(getArgValue('--output', 'src-flat'))
const dryRun = args.includes('--dry-run')
const keepOutput = args.includes('--keep-output')

async function collectFiles(currentDir, baseDir, outputBaseDir, files) {
  const entries = await readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name)

    if (fullPath === outputBaseDir || fullPath.startsWith(outputBaseDir + path.sep)) {
      continue
    }

    if (entry.isDirectory()) {
      await collectFiles(fullPath, baseDir, outputBaseDir, files)
      continue
    }

    if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath))
    }
  }
}

function buildFlatName(relativePath) {
  return relativePath.split(path.sep).join('__')
}

async function main() {
  const sourceStats = await stat(sourceDir)
  if (!sourceStats.isDirectory()) {
    throw new Error(`La ruta de origen no es una carpeta: ${sourceDir}`)
  }

  const files = []
  await collectFiles(sourceDir, sourceDir, outputDir, files)

  if (dryRun) {
    console.log(`Se copiarían ${files.length} archivos desde ${sourceDir} hacia ${outputDir}`)
    files.slice(0, 25).forEach((file) => {
      console.log(`- ${buildFlatName(file)}`)
    })
    if (files.length > 25) {
      console.log(`... y ${files.length - 25} archivos más`)
    }
    return
  }

  if (!keepOutput) {
    await rm(outputDir, { recursive: true, force: true })
  }

  await mkdir(outputDir, { recursive: true })

  const usedNames = new Set()

  for (const relativePath of files) {
    const originalPath = path.join(sourceDir, relativePath)
    const baseName = buildFlatName(relativePath)
    const ext = path.extname(baseName)
    const nameWithoutExt = baseName.slice(0, baseName.length - ext.length)

    let candidateName = baseName
    let candidatePath = path.join(outputDir, candidateName)
    let counter = 1

    while (usedNames.has(candidateName)) {
      candidateName = `${nameWithoutExt}__${counter}${ext}`
      candidatePath = path.join(outputDir, candidateName)
      counter += 1
    }

    usedNames.add(candidateName)
    await copyFile(originalPath, candidatePath)
  }

  console.log(`Copiados ${files.length} archivos a ${outputDir}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})