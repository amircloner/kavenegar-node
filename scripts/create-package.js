#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json to get version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`Creating package for version ${version}...`);

// Create package directory
const packageDir = 'package-dist';
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true, force: true });
}
fs.mkdirSync(packageDir, { recursive: true });

// Files and directories to copy
const itemsToCopy = [
  { src: 'dist', dest: 'dist', required: false },
  { src: 'src', dest: 'src', required: true },
  { src: 'package.json', dest: 'package.json', required: true },
  { src: 'index.js', dest: 'index.js', required: false },
  { src: 'README.md', dest: 'README.md', required: false },
  { src: 'LICENSE', dest: 'LICENSE', required: false },
  { src: 'tsconfig.json', dest: 'tsconfig.json', required: false },
  { src: 'jest.config.js', dest: 'jest.config.js', required: false }
];

// Copy files
for (const item of itemsToCopy) {
  const srcPath = path.resolve(item.src);
  const destPath = path.join(packageDir, item.dest);
  
  if (fs.existsSync(srcPath)) {
    try {
      const stats = fs.statSync(srcPath);
      if (stats.isDirectory()) {
        copyDirectory(srcPath, destPath);
        console.log(`✅ Copied directory: ${item.src}`);
      } else {
        copyFile(srcPath, destPath);
        console.log(`✅ Copied file: ${item.src}`);
      }
    } catch (error) {
      console.error(`❌ Error copying ${item.src}:`, error.message);
      if (item.required) {
        process.exit(1);
      }
    }
  } else if (item.required) {
    console.error(`❌ Required file/directory not found: ${item.src}`);
    process.exit(1);
  } else {
    console.log(`⚠️  Optional file not found: ${item.src}`);
  }
}

// Create zip file
const zipFileName = `kavenegar-v${version}.zip`;
try {
  console.log(`Creating zip file: ${zipFileName}`);
  
  // Use different commands based on platform
  const isWindows = process.platform === 'win32';
  let zipCommand;
  
  if (isWindows) {
    // Use PowerShell's Compress-Archive on Windows
    zipCommand = `powershell Compress-Archive -Path "${packageDir}/*" -DestinationPath "${zipFileName}" -Force`;
  } else {
    // Use zip command on Unix-like systems
    zipCommand = `cd ${packageDir} && zip -r "../${zipFileName}" .`;
  }
  
  execSync(zipCommand, { stdio: 'inherit' });
  
  console.log(`✅ Package created successfully: ${zipFileName}`);
  
  // Show package contents
  console.log('\n📦 Package contents:');
  showDirectoryContents(packageDir, '');
  
  // Show zip file size
  const stats = fs.statSync(zipFileName);
  const fileSizeInBytes = stats.size;
  const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
  console.log(`\n📊 Package size: ${fileSizeInMB} MB (${fileSizeInBytes} bytes)`);
  
} catch (error) {
  console.error('❌ Error creating zip file:', error.message);
  console.log('💡 Make sure you have zip utility installed or use Windows with PowerShell');
  process.exit(1);
}

// Helper functions
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function showDirectoryContents(dir, prefix) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    
    console.log(`${prefix}${connector}${entry.name}`);
    
    if (entry.isDirectory()) {
      showDirectoryContents(path.join(dir, entry.name), newPrefix);
    }
  });
}