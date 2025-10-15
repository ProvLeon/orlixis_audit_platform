import { Octokit } from "@octokit/rest"

export interface GitHubFile {
  name: string
  path: string
  type: "file" | "dir"
  size?: number
  content?: string
  encoding?: string
  sha: string
  download_url?: string
}

export interface GitHubTreeItem {
  path: string
  mode: string
  type: "blob" | "tree"
  sha: string
  size?: number
  url: string
}

export interface RepositoryInfo {
  owner: string
  repo: string
  branch: string
  languages: string[]
  frameworks: string[]
  totalSize: number
  fileCount: number
}

export class GitHubClient {
  private octokit: Octokit

  constructor(accessToken?: string) {
    // Create truly unauthenticated client for public access
    if (!accessToken || !accessToken.trim() || accessToken === "") {
      console.log("GitHubClient: Creating unauthenticated client for public access")
      this.octokit = new Octokit()
    } else {
      console.log("GitHubClient: Creating authenticated client with token length:", accessToken.length)
      this.octokit = new Octokit({ auth: accessToken })
    }
  }

  /**
   * Test if the current token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated()
      return true
    } catch (error: any) {
      console.log("Token validation failed:", error.message)
      return false
    }
  }

  /**
   * Get repository information including languages and basic stats
   */
  async getRepositoryInfo(owner: string, repo: string, branch: string = "main"): Promise<RepositoryInfo> {
    try {
      // Get repository details
      const repoResponse = await this.octokit.repos.get({ owner, repo })
      const repository = repoResponse.data

      // For public repositories, try to get languages, but continue if it fails
      let languages: string[] = []
      try {
        const languagesResponse = await this.octokit.repos.listLanguages({ owner, repo })
        languages = Object.keys(languagesResponse.data)
      } catch (langError) {
        console.warn(`Could not get languages for ${owner}/${repo}, continuing without them`)
      }

      // Get the repository tree to count files and calculate size
      // Try the specified branch first, then fall back to default branch
      let treeResponse
      let actualBranch = branch

      try {
        treeResponse = await this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: branch,
          recursive: "true"
        })
      } catch (branchError: any) {
        // If the specified branch doesn't exist, try the default branch
        if (branchError.status === 404 && branch !== repository.default_branch) {
          console.log(`Branch ${branch} not found, trying default branch ${repository.default_branch}`)
          actualBranch = repository.default_branch || "main"
          treeResponse = await this.octokit.git.getTree({
            owner,
            repo,
            tree_sha: actualBranch,
            recursive: "true"
          })
        } else {
          throw branchError
        }
      }

      const files = treeResponse.data.tree.filter(item => item.type === "blob")
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
      const fileCount = files.length

      // Detect frameworks based on file patterns
      const frameworks = this.detectFrameworks(files)

      return {
        owner,
        repo,
        branch: actualBranch,
        languages,
        frameworks,
        totalSize,
        fileCount
      }
    } catch (error: any) {
      console.error(`Error getting repository info for ${owner}/${repo}:`, error)
      // Provide more specific error messages
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or not accessible`)
      } else if (error.status === 401) {
        throw new Error(`Access denied to ${owner}/${repo}. Repository may be private and require authentication`)
      } else {
        throw new Error(`Failed to get repository information: ${error.message || String(error)}`)
      }
    }
  }

  /**
   * Get all files from a repository recursively
   */
  async getRepositoryFiles(owner: string, repo: string, branch: string = "main", maxFiles: number = 1000): Promise<GitHubFile[]> {
    try {
      // Get the repository tree recursively
      let treeResponse
      try {
        treeResponse = await this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: branch,
          recursive: "true"
        })
      } catch (branchError: any) {
        // If the specified branch doesn't exist, try common alternatives
        if (branchError.status === 404) {
          console.log(`Branch ${branch} not found, trying alternatives...`)
          const alternatives = ["main", "master"]
          for (const alt of alternatives) {
            if (alt !== branch) {
              try {
                console.log(`Trying branch: ${alt}`)
                treeResponse = await this.octokit.git.getTree({
                  owner,
                  repo,
                  tree_sha: alt,
                  recursive: "true"
                })
                console.log(`Successfully found branch: ${alt}`)
                break
              } catch (altError) {
                console.log(`Branch ${alt} also not found, continuing...`)
              }
            }
          }
          if (!treeResponse) {
            throw new Error(`No valid branch found. Tried: ${[branch, ...alternatives].join(", ")}`)
          }
        } else {
          throw branchError
        }
      }

      // Filter for files only (not directories) and limit the number
      const fileItems = treeResponse.data.tree
        .filter(item => item.type === "blob" && item.path)
        .slice(0, maxFiles)

      // Convert to our GitHubFile format
      const files: GitHubFile[] = fileItems.map(item => ({
        name: item.path!.split('/').pop() || item.path!,
        path: item.path!,
        type: "file" as const,
        size: item.size,
        sha: item.sha!,
        download_url: item.url
      }))

      return files
    } catch (error: any) {
      console.error(`Error getting repository files for ${owner}/${repo}:`, error)
      // Provide more specific error messages
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} or branch not found`)
      } else if (error.status === 401) {
        throw new Error(`Access denied to ${owner}/${repo}. Repository may be private and require authentication`)
      } else {
        throw new Error(`Failed to get repository files: ${error.message || String(error)}`)
      }
    }
  }

  /**
   * Get file content for a specific file
   */
  async getFileContent(owner: string, repo: string, path: string, branch: string = "main"): Promise<string | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      })

      const data = response.data

      // Handle file content
      if (!Array.isArray(data) && data.type === "file" && data.content) {
        // Content is base64 encoded
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        return content
      }

      return null
    } catch (error) {
      // File might not exist or be too large
      console.warn(`Could not get content for ${path} in ${owner}/${repo}:`, error)
      return null
    }
  }

  /**
   * Get multiple file contents in batch (with rate limiting)
   */
  async getMultipleFileContents(
    owner: string,
    repo: string,
    files: GitHubFile[],
    branch: string = "main",
    maxConcurrent: number = 5
  ): Promise<GitHubFile[]> {
    const results: GitHubFile[] = []

    // Process files in batches to avoid rate limiting
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent)

      const batchPromises = batch.map(async (file) => {
        try {
          // Skip binary files and very large files
          if (this.shouldSkipFile(file)) {
            return { ...file, content: null }
          }

          const content = await this.getFileContent(owner, repo, file.path, branch)
          return { ...file, content }
        } catch (error) {
          console.warn(`Failed to get content for ${file.path}:`, error)
          return { ...file, content: null }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add a small delay between batches to be nice to GitHub's API
      if (i + maxConcurrent < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  /**
   * Check if a file should be skipped (binary files, large files, etc.)
   */
  private shouldSkipFile(file: GitHubFile): boolean {
    const { name, size } = file

    // Skip files larger than 1MB
    if (size && size > 1024 * 1024) {
      return true
    }

    // Skip binary file extensions
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.avi', '.mov', '.wav',
      '.ttf', '.otf', '.woff', '.woff2',
      '.class', '.jar', '.war'
    ]

    const extension = name.toLowerCase().split('.').pop()
    if (extension && binaryExtensions.includes(`.${extension}`)) {
      return true
    }

    // Skip common binary/generated directories
    const skipPaths = [
      'node_modules/', 'vendor/', '.git/', 'dist/', 'build/',
      'target/', '.idea/', '.vscode/', '__pycache__/', '.next/',
      'coverage/', '.nyc_output/', 'out/'
    ]

    if (skipPaths.some(skipPath => file.path.includes(skipPath))) {
      return true
    }

    return false
  }

  /**
   * Detect frameworks based on file patterns
   */
  private detectFrameworks(files: GitHubTreeItem[]): string[] {
    const frameworks: Set<string> = new Set()
    const filePaths = files.map(f => f.path || '')

    // Package.json based detection
    const packageJson = filePaths.find(path => path === 'package.json')
    if (packageJson) {
      frameworks.add('Node.js')
    }

    // Framework-specific files
    const frameworkFiles: Record<string, string[]> = {
      'React': ['src/App.tsx', 'src/App.jsx', 'public/index.html'],
      'Next.js': ['next.config.js', 'next.config.mjs', 'next.config.ts', 'pages/_app.js', 'app/layout.tsx'],
      'Vue.js': ['vue.config.js', 'src/main.js', 'src/App.vue'],
      'Angular': ['angular.json', 'src/main.ts', 'src/app/app.module.ts'],
      'Svelte': ['svelte.config.js', 'src/app.html'],
      'Django': ['manage.py', 'settings.py', 'wsgi.py'],
      'Flask': ['app.py', 'wsgi.py', 'requirements.txt'],
      'Rails': ['Gemfile', 'config/application.rb', 'app/controllers/application_controller.rb'],
      'Laravel': ['artisan', 'composer.json', 'app/Http/Kernel.php'],
      'Spring Boot': ['pom.xml', 'src/main/java', 'application.properties'],
      'Gradle': ['build.gradle', 'gradlew'],
      'Maven': ['pom.xml'],
      'Docker': ['Dockerfile', 'docker-compose.yml'],
      'Kubernetes': ['deployment.yaml', 'service.yaml', 'ingress.yaml'],
      'Terraform': ['.tf', 'main.tf'],
      'WordPress': ['wp-config.php', 'wp-content/', 'wp-includes/']
    }

    for (const [framework, patterns] of Object.entries(frameworkFiles)) {
      if (patterns.some(pattern =>
        filePaths.some(path =>
          path.includes(pattern) || path.endsWith(pattern)
        )
      )) {
        frameworks.add(framework)
      }
    }

    // Language-specific frameworks
    if (filePaths.some(path => path.endsWith('.py'))) {
      if (filePaths.some(path => path.includes('requirements.txt') || path.includes('Pipfile'))) {
        frameworks.add('Python')
      }
    }

    if (filePaths.some(path => path.endsWith('.go'))) {
      frameworks.add('Go')
    }

    if (filePaths.some(path => path.endsWith('.rs'))) {
      frameworks.add('Rust')
    }

    if (filePaths.some(path => path.endsWith('.php'))) {
      frameworks.add('PHP')
    }

    return Array.from(frameworks)
  }

  /**
   * Get programming language from file extension
   */
  static getLanguageFromExtension(filename: string): string | null {
    const extension = filename.toLowerCase().split('.').pop()

    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'mjs': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yml': 'yaml',
      'yaml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'sql': 'sql',
      'md': 'markdown',
      'mdx': 'markdown',
      'txt': 'text',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash',
      'ps1': 'powershell',
      'bat': 'batch',
      'cmd': 'batch',
      'dockerfile': 'dockerfile',
      'kt': 'kotlin',
      'kts': 'kotlin',
      'swift': 'swift',
      'dart': 'dart',
      'lua': 'lua',
      'r': 'r',
      'scala': 'scala',
      'clj': 'clojure',
      'ex': 'elixir',
      'exs': 'elixir',
      'elm': 'elm',
      'hs': 'haskell',
      'ml': 'ocaml',
      'fs': 'fsharp',
      'pl': 'perl',
      'pm': 'perl'
    }

    return extension ? languageMap[extension] || null : null
  }
}
