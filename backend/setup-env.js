#!/usr/bin/env node

/**
 * Setup Environment Variables Helper
 * 
 * This script helps you set up your .env file correctly
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('\n🚀 Backend Environment Setup\n')
  console.log('This will help you create your .env file.\n')

  const envPath = path.join(__dirname, '.env')
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('\n📋 Please provide the following information:\n')

  // Port
  const port = await question('Port (default: 3001): ') || '3001'
  
  // Firebase Project ID
  console.log('\n📍 Firebase Project ID:')
  console.log('   Find this in Firebase Console -> Project Settings')
  const firebaseProjectId = await question('   Enter Firebase Project ID: ')
  
  if (!firebaseProjectId) {
    console.error('❌ Firebase Project ID is required!')
    rl.close()
    return
  }

  // Firebase Service Account
  console.log('\n🔑 Firebase Service Account Key:')
  console.log('   1. Go to Firebase Console -> Project Settings -> Service Accounts')
  console.log('   2. Click "Generate new private key"')
  console.log('   3. Save the JSON file to your computer')
  console.log('   4. Enter the full path to the JSON file below')
  
  const serviceAccountPath = await question('   Path to service account JSON file: ')
  
  if (!serviceAccountPath) {
    console.error('❌ Service account key path is required!')
    rl.close()
    return
  }

  // Read and validate service account file
  let serviceAccountKey
  try {
    const fullPath = serviceAccountPath.startsWith('~') 
      ? path.join(process.env.HOME, serviceAccountPath.slice(1))
      : serviceAccountPath
    
    const fileContent = fs.readFileSync(fullPath, 'utf8')
    // Validate it's valid JSON
    JSON.parse(fileContent)
    // Stringify to single line
    serviceAccountKey = JSON.stringify(JSON.parse(fileContent))
  } catch (error) {
    console.error(`❌ Error reading service account file: ${error.message}`)
    rl.close()
    return
  }

  // Gemini API Key
  console.log('\n🤖 Google Gemini API Key:')
  console.log('   Get this from: https://aistudio.google.com/app/apikey')
  const geminiApiKey = await question('   Enter Gemini API Key: ')
  
  if (!geminiApiKey) {
    console.error('❌ Gemini API Key is required!')
    rl.close()
    return
  }

  // CORS Origins
  const corsOrigins = await question('\n🌐 CORS Origins (default: http://localhost:3000): ') 
    || 'http://localhost:3000'

  // Create .env content
  const envContent = `# Server Configuration
PORT=${port}
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='${serviceAccountKey}'

# Firebase Project ID
FIREBASE_PROJECT_ID=${firebaseProjectId}

# Google Gemini API
GEMINI_API_KEY=${geminiApiKey}

# CORS Origins (comma-separated for multiple origins)
CORS_ORIGINS=${corsOrigins}

# API Configuration
API_PREFIX=api/v1
`

  // Write .env file
  fs.writeFileSync(envPath, envContent)

  console.log('\n✅ Success! .env file created successfully!\n')
  console.log('📁 Location: ' + envPath)
  console.log('\n🚀 You can now start the backend with: pnpm start:dev\n')

  rl.close()
}

main().catch((error) => {
  console.error('Error:', error)
  rl.close()
  process.exit(1)
})

