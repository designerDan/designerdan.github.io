import { convertCaseImages } from "./convert-case-images.mjs";

const removeJpg = process.argv.includes("--remove-jpg");

convertCaseImages("imgs/zix", { removeJpg }).catch((err) => {
  console.error(err);
  process.exit(1);
});
