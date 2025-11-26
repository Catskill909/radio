import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('id')

    if (!articleId) {
        return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
    }

    try {
        // Map article IDs to file paths
        const articlePaths: Record<string, string> = {
            'welcome': 'content/help/getting-started/welcome.md',
            'creating-your-first-show': 'content/help/getting-started/creating-your-first-show.md',
            'scheduling-basics': 'content/help/getting-started/scheduling-basics.md',
            'recording-configuration': 'content/help/recording/recording-configuration.md',
            'station-timezone': 'content/help/settings/station-timezone.md',
            'adding-icecast-streams': 'content/help/recording/adding-icecast-streams.md',
            'publishing-episodes': 'content/help/podcasting/publishing-episodes.md',
            'recurring-shows': 'content/help/scheduling/recurring-shows.md',
        }

        const filePath = articlePaths[articleId]
        if (!filePath) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        const fullPath = path.join(process.cwd(), filePath)
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
