const fs = require("fs");
const path = require("path");

const rootDir = "./";
const outputFile = "formatted_output.txt";
const foldersToInclude = ["configPlugins"];
const filesToExclude = ["package-lock.json"];
const validExtensions = [".js", ".json", ".html"];

function getLanguage(ext) {
  switch (ext) {
    case ".js":
      return "javascript";
    case ".css":
      return "css";
    case ".html":
      return "html";
    case ".json":
      return "json";
    default:
      return "";
  }
}

function formatFileContent(filePath, content) {
  const ext = path.extname(filePath);
  const language = getLanguage(ext);
  return `${filePath}\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return formatFileContent(filePath, content);
}

function searchFiles(dir, baseDir = "") {
  let result = "";
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (filesToExclude.includes(file)) {
      continue;
    }

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const folderName = path.basename(filePath);
      if (baseDir === "" || foldersToInclude.includes(folderName)) {
        result += searchFiles(filePath, folderName);
      }
    } else if (validExtensions.includes(path.extname(file))) {
      if (baseDir === "" || foldersToInclude.includes(baseDir)) {
        const relativePath = path.relative(rootDir, filePath);
        result += processFile(relativePath);
      }
    }
  }

  return result;
}

function main() {
  let formattedContent = `I am developing a simple mobile app using Native Expo React. It is a location sharing app where users can view and share live location. Here is the full project:\n\n${searchFiles(rootDir)}`;
  fs.writeFileSync(outputFile, formattedContent);
  console.log(`Formatted content has been saved to ${outputFile}`);
}

main();
