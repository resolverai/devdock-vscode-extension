import path from "path";
import * as vscode from "vscode";

export async function getFileExtensionMapping(): Promise<{
  [key: string]: string;
}> {
  // Define your extension-to-language mappings
  const extensionMapping: { [key: string]: string } = {
    // Web development languages
    ".html": "HTML",
    ".htm": "HTML",
    ".css": "CSS",
    // ".scss": "Sass",
    // ".less": "LESS",
    ".js": "JavaScript",
    ".jsx": "ReactJS JavaScript",
    ".ts": "TypeScript",
    ".tsx": "ReactJS TypeScript",
    ".json": "JSON",
    ".xml": "XML",
    ".yaml": "YAML",
    ".csv": "CSV",

    // Web3 and blockchain development
    ".sol": "Solidity",
    ".vy": "Vyper",
    ".go": "Golang",
    ".rs": "Rust",
    ".near": "NEAR Contracts",
    ".move": "Move (Aptos/Diem)",

    // Backend development
    ".java": "Java",
    ".kt": "Kotlin",
    ".c": "C",
    ".cpp": "C++",
    ".cs": "C#",
    ".py": "Python",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".m": "Objective-C",
    ".scala": "Scala",
    ".groovy": "Groovy",
    ".r": "R",

    // Database and data file extensions
    ".sql": "SQL",
    ".psql": "PostgreSQL",
    ".db": "Database File",
    ".db3": "Database File",
    ".sqlite": "SQLite",
    ".sqlite3": "SQLite",

    // Web server and configuration files
    ".env": "Environment Config",
    ".ini": "INI Config",
    ".conf": "Config File",
    ".nginx": "Nginx Config",
    ".htaccess": "Apache Config",
    ".dockerfile": "Docker",
    ".yml": "Docker Compose",
    ".tf": "Terraform",
    ".bat": "Batch File",

    // Script files
    ".pl": "Perl",
    ".sh": "Shell Script",
    ".ps1": "PowerShell",
    ".cmd": "Command Prompt",

    // Frontend templating and component files
    ".ejs": "Embedded JavaScript",
    ".pug": "Pug",
    ".hbs": "Handlebars",
    ".vue": "VueJS",
    ".svelte": "Svelte",
    ".njk": "Nunjucks",

    // Smart contracts and blockchain-specific files
    ".abi": "ABI",
    ".rlp": "Recursive Length Prefix",

    // Markdown and documentation
    ".md": "Markdown",
    ".mdx": "Markdown React",
    ".rst": "reStructuredText",

    // Other common Web2/Web3 extensions
    ".lua": "Lua",
    ".dart": "Dart",
    ".coffee": "CoffeeScript",
    ".tsv": "TSV",
    ".ipynb": "Jupyter Notebook",
    ".rkt": "Racket",

    // Miscellaneous
    ".txt": "Plain Text",
    ".log": "Log File",
    ".lock": "Lock File",
    ".toml": "TOML Config",
    ".gql": "GraphQL",
    ".graphql": "GraphQL",
    // Add more mappings here as needed
  };

  // Object to store unique mappings for files in the workspace
  const uniqueFileMappings: { [key: string]: string } = {};

  // Get the root workspace folders
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    console.log("No workspace folder found");
    return uniqueFileMappings;
  }

  // Function to recursively find files in a folder
  async function findFilesRecursively(folderUri: vscode.Uri): Promise<void> {
    const entries = await vscode.workspace.fs.readDirectory(folderUri);
    for (const [name, type] of entries) {
      const fileUri = vscode.Uri.joinPath(folderUri, name);
      if (type === vscode.FileType.Directory) {
        await findFilesRecursively(fileUri); // Recursive call for directories
      } else if (type === vscode.FileType.File) {
        const fileExtension = path.extname(name);
        if (
          extensionMapping[fileExtension] &&
          !uniqueFileMappings[fileExtension]
        ) {
          uniqueFileMappings[fileExtension] = extensionMapping[fileExtension];
        }
      }
    }
  }

  // Process each root folder in the workspace
  const folderPromises = workspaceFolders.map((folder) =>
    findFilesRecursively(folder.uri)
  );
  await Promise.all(folderPromises); // Wait for all folders to be processed

  return uniqueFileMappings;
}
