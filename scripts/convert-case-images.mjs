import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const QUALITY = 82;

const EXPECTED = {
  zix: 26,
  pixly: 27,
  odl: 29,
};

function logicalBase(filename) {
  const name = path.basename(filename, ".jpg");
  if (name.endsWith("@2x")) return name.slice(0, -3);
  if (name.endsWith("@05x")) return name.slice(0, -4);
  return name;
}

function tierPaths(inputDir, base) {
  return {
    w05: path.join(inputDir, `${base}@05x.jpg`),
    w1: path.join(inputDir, `${base}.jpg`),
    w2: path.join(inputDir, `${base}@2x.jpg`),
  };
}

async function convertTier(inputPath, outputPath) {
  const image = sharp(inputPath);
  const meta = await image.metadata();
  await image.webp({ quality: QUALITY }).toFile(outputPath);
  return { width: meta.width, height: meta.height };
}

export async function convertCaseImages(folder, { removeJpg = false } = {}) {
  const inputDir = path.join(ROOT, folder);
  const expectedBases = EXPECTED[path.basename(folder)];

  if (!expectedBases) {
    throw new Error(`Unknown folder "${folder}". Add expected base count to EXPECTED.`);
  }

  const jpgs = fs.readdirSync(inputDir).filter((f) => f.endsWith(".jpg"));
  const bases = new Set(jpgs.map(logicalBase));

  const manifest = {};
  let converted = 0;

  for (const base of [...bases].sort()) {
    const src = tierPaths(inputDir, base);

    if (!fs.existsSync(src.w05) || !fs.existsSync(src.w1) || !fs.existsSync(src.w2)) {
      console.warn(`Skipping ${base}: missing tier(s)`);
      continue;
    }

    const out05 = path.join(inputDir, `${base}@0.5x.webp`);
    const out1 = path.join(inputDir, `${base}.webp`);
    const out2 = path.join(inputDir, `${base}@2x.webp`);

    const [meta05, meta1, meta2] = await Promise.all([
      convertTier(src.w05, out05),
      convertTier(src.w1, out1),
      convertTier(src.w2, out2),
    ]);

    manifest[base] = {
      w05: meta05.width,
      h05: meta05.height,
      w1: meta1.width,
      h1: meta1.height,
      w2: meta2.width,
      h2: meta2.height,
    };

    converted += 3;
    console.log(`✓ ${base} → ${meta05.width}w / ${meta1.width}w / ${meta2.width}w`);
  }

  fs.writeFileSync(
    path.join(inputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const baseCount = Object.keys(manifest).length;
  console.log(`\n[${folder}] Converted ${converted} WebP files for ${baseCount} bases.`);

  if (removeJpg) {
    if (baseCount !== expectedBases || converted !== expectedBases * 3) {
      throw new Error(
        `Aborting JPG removal: expected ${expectedBases} bases (${expectedBases * 3} files), got ${baseCount} (${converted}).`
      );
    }

    for (const file of jpgs) {
      fs.unlinkSync(path.join(inputDir, file));
    }
    console.log(`Removed ${jpgs.length} source JPG files from ${folder}.`);
  }

  return manifest;
}

async function main() {
  const args = process.argv.slice(2);
  const removeJpg = args.includes("--remove-jpg");
  const folders = args.filter((a) => !a.startsWith("--"));

  if (folders.length === 0) {
    await convertCaseImages("imgs/zix", { removeJpg });
    await convertCaseImages("imgs/pixly", { removeJpg });
    return;
  }

  for (const folder of folders) {
    await convertCaseImages(folder, { removeJpg });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
