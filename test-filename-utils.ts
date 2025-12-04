/**
 * Test script for filename utilities
 * Run with: npx ts-node test-filename-utils.ts
 */

import { generateRecordingFilename, sanitizeFilename } from './lib/filename-utils'

console.log('Testing filename generation utilities...\n')

// Test 1: Basic filename generation
console.log('Test 1: Basic filename generation')
const filename1 = generateRecordingFilename(
    'Old Skool Sessions',
    new Date('2025-12-02T18:00:00Z'),
    'libmp3lame'
)
console.log(`Result: ${filename1}`)
console.log(`Expected format: Old Skool Sessions - 2025-12-02 - 1800.mp3\n`)

// Test 2: Special characters sanitization
console.log('Test 2: Special characters sanitization')
const filename2 = generateRecordingFilename(
    'Test: Show "Name" & Stuff!',
    new Date('2025-12-03T14:30:00Z'),
    'libmp3lame'
)
console.log(`Result: ${filename2}`)
console.log(`Expected: Characters like : " should be removed\n`)

// Test 3: Different codecs
console.log('Test 3: Different audio codecs')
const codecs = ['libmp3lame', 'aac', 'libopus', 'flac']
const testDate = new Date('2025-12-03T12:00:00Z')

codecs.forEach(codec => {
    const filename = generateRecordingFilename('Test Show', testDate, codec)
    console.log(`${codec}: ${filename}`)
})
console.log()

// Test 4: Sanitization edge cases
console.log('Test 4: Sanitization edge cases')
const edgeCases = [
    'Show/With\\Slashes',
    'Show*With?Special',
    'Show   With   Spaces',
    'A'.repeat(250) // Very long name
]

edgeCases.forEach(testCase => {
    const sanitized = sanitizeFilename(testCase)
    console.log(`Input: "${testCase.substring(0, 50)}${testCase.length > 50 ? '...' : ''}"`)
    console.log(`Output: "${sanitized.substring(0, 50)}${sanitized.length > 50 ? '...' : ''}"`)
    console.log(`Length: ${sanitized.length}\n`)
})

console.log('✅ Filename generation tests complete!')
