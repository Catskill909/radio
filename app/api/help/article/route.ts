import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { helpArticles } from '@/lib/help-articles'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('id')

    if (!articleId) {
        return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    try {
        const article = helpArticles[articleId]
        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        // Remove leading slash if present to ensure path.join works correctly with process.cwd()
        const relativePath = article.filePath.startsWith('/') ? article.filePath.slice(1) : article.filePath
        const fullPath = path.join(process.cwd(), relativePath)
        const content = await readFile(fullPath, 'utf-8')

        // Extract frontmatter and content
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
        const match = content.match(frontmatterRegex)

        if (!match) {
            return NextResponse.json({
                title: articleId,
                content: content,
                relatedTopics: []
            })
        }

        const [, frontmatter, markdown] = match
        const metadata: Record<string, any> = {}

        // Parse frontmatter
        frontmatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':')
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim()
                if (value.startsWith('[')) {
                    // Parse array
                    metadata[key.trim()] = JSON.parse(value.replace(/'/g, '"'))
                } else {
                    metadata[key.trim()] = value.replace(/"/g, '')
                }
            }
        })

        return NextResponse.json({
            title: metadata.title || articleId,
            content: markdown.trim(),
            relatedTopics: metadata.relatedTopics || [],
            category: metadata.category || '',
        })
    } catch (error) {
        console.error('Error loading help article:', error)
        return NextResponse.json({ error: 'Failed to load article' }, { status: 500 })
    }
}
