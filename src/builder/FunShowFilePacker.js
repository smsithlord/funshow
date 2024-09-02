class FunShowFilePacker extends FunShowEventEmitter {
  constructor() {
    super();
    this.files = [];
    this.zipName = '';
    this.zipPackage = null;
    this.manifests = {
      "slideshowFolder": {
        "name": "Slideshow Folder & Developer Build Manifest",
        "description": "A built package for end-users to use from their local file system.",
        "files": [
          {"file": "funshow", "files": [
              {"file": "index.html"},
              {"file": "dist", "files": [
                  {"file": "funshow-shared.min.js"},
                  {"file": "funshow-viewer.min.js"},
                  {"file": "funshow-builder.min.js"}
                ]
              }
            ]
          }
        ]
      },
      "developerBuild": {
        "name": "Slideshow Folder & Developer Build Manifest",
        "description": "A built package for end-users to use from their local file system.",
        "files": [
          {"file": "funshow", "files": [
              {"file": "index.html"},
              {"file": "dist", "files": [
                  {"file": "funshow-shared.min.js"},
                  {"file": "funshow-viewer.min.js"},
                  {"file": "funshow-builder.min.js"},
                  {"file": "thirdparty", "files": [
                      {"file": "jszip.min.js"},
                      {"file": "bundle.min.js"},
                      {"file": "LICENSE.txt"}
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }

  async packFilesFromManifest({ manifestId, startInPath = '' }) {
    const manifest = this.manifests[manifestId];
    if (!manifest) {
      throw new Error(`Manifest with id "${manifestId}" not found.`);
    }

    this.zipName = `${manifest.name}.zip`;
    const normalizedStartInPath = this.normalizePath(startInPath);
    const fileArray = await this.processManifestFiles(manifest.files, normalizedStartInPath);
    return this.packFiles(this.zipName, fileArray);
  }

  async packFilesAndDownloadFromManifest({ manifestId, startInPath = '' }) {
    await this.packFilesFromManifest({ manifestId, startInPath });
    this.downloadPackage();
  }

  async processManifestFiles(files, basePath = '') {
    let fileArray = [];
    for (const entry of files) {
      const currentPath = basePath ? `${basePath}${entry.file}` : entry.file;
      if (entry.files) {
        // If it's a directory, recursively process its files
        fileArray = fileArray.concat(await this.processManifestFiles(entry.files, `${currentPath}/`));
      } else {
        // If it's a file, add it to the fileArray
        fileArray.push(currentPath);
      }
    }
    return fileArray;
  }

  normalizePath(path) {
    // Replace backslashes with forward slashes
    let normalized = path.replace(/\\/g, '/');
    // Ensure the path ends with a slash
    if (normalized && !normalized.endsWith('/')) {
      normalized += '/';
    }
    return normalized;
  }

  async fetchFile(fileUrl) {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      return {
        name: this.getFileName(fileUrl),
        content: content
      };
    } catch (error) {
      console.error(`Error fetching ${fileUrl}: ${error.message}`);
      return {
        name: this.getFileName(fileUrl),
        content: `Error: ${error.message}`
      };
    }
  }

  getFileName(fileUrl) {
    const parts = fileUrl.split('/');
    return parts[parts.length - 1] || 'file.txt';
  }

  async packFiles(zipName, fileArray) {
    this.zipName = zipName;
    const fetchPromises = fileArray.map(entry => this.processEntry(entry));
    this.files = await Promise.all(fetchPromises);
    this.zipPackage = await this.zipFiles();
    return this.zipPackage;
  }

  async processEntry(entry) {
    if (typeof entry === 'string') {
      return this.fetchFile(entry);
    } else if (typeof entry === 'object') {
      if ('filename' in entry && 'data' in entry) {
        return {
          name: entry.filename,
          content: typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data)
        };
      } else {
        return {
          name: 'object.json',
          content: JSON.stringify(entry)
        };
      }
    }
  }

  async zipFiles() {
    const zip = new JSZip();

    this.files.forEach(file => {
      zip.file(file.name, file.content);
    });

    try {
      const content = await zip.generateAsync({type: "blob"});
      return {
        name: this.zipName,
        data: content
      };
    } catch (error) {
      console.error("Error generating zip file:", error);
      throw error;
    }
  }

  downloadPackage() {
    if (!this.zipPackage) {
      console.error("No zip package available. Please pack files first.");
      return;
    }

    const url = URL.createObjectURL(this.zipPackage.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.zipPackage.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async packFilesAndDownload(zipName, fileArray) {
    await this.packFiles(zipName, fileArray);
    this.downloadPackage();
  }
}