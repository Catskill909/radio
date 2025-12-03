/**
 * Verification Script for iTunes Tags in RSS Feed
 * 
 * Tests:
 * 1. Create a test show with specific itunesType and tags
 * 2. Fetch the RSS feed for that show
 * 3. Parse the XML and verify presence of <itunes:type> and <itunes:keywords>
 * 4. Clean up the test show
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRSSFeed() {
    console.log('🧪 ITUNES TAGS RSS VERIFICATION\n');
    console.log('═'.repeat(70) + '\n');

    let testShowId: string | null = null;

    try {
        // ====== TEST 1: Create a test show with Serial type and tags ======
        console.log('TEST 1: Create Test Show\n');

        const testShow = await prisma.show.create({
            data: {
                title: 'TEST_RSS_SHOW',
                description: 'Test show for RSS feed verification',
                type: 'Local Podcast',
                host: 'Test Host',
                email: 'test@example.com',
                author: 'Test Author',
                itunesType: 'serial',
                tags: 'jazz, test, morning show',
                explicit: false,
                language: 'en-us',
                recordingEnabled: false,
            }
        });

        testShowId = testShow.id;
        console.log(`  ✅ Test show created with ID: ${testShowId}`);
        console.log(`  ✅ iTunes Type: ${testShow.itunesType}`);
        console.log(`  ✅ Tags: ${testShow.tags}\n`);

        console.log('─'.repeat(70) + '\n');

        // ====== TEST 2: Fetch RSS Feed ======
        console.log('TEST 2: Fetch RSS Feed\n');

        const rssUrl = `http://localhost:3000/api/feed/${testShowId}/rss.xml`;
        console.log(`  Fetching: ${rssUrl}\n`);

        const response = await fetch(rssUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
        }

        const rssXml = await response.text();
        console.log(`  ✅ RSS feed fetched successfully (${rssXml.length} bytes)\n`);

        console.log('─'.repeat(70) + '\n');

        // ====== TEST 3: Verify iTunes Tags ======
        console.log('TEST 3: Verify iTunes Tags\n');

        let allPassed = true;

        // Check for itunes:type
        const itunesTypeRegex = /<itunes:type>serial<\/itunes:type>/;
        if (itunesTypeRegex.test(rssXml)) {
            console.log('  ✅ <itunes:type>serial</itunes:type> found');
        } else {
            console.log('  ❌ <itunes:type>serial</itunes:type> NOT found');
            allPassed = false;
        }

        // Check for itunes:keywords
        const itunesKeywordsRegex = /<itunes:keywords>jazz, test, morning show<\/itunes:keywords>/;
        if (itunesKeywordsRegex.test(rssXml)) {
            console.log('  ✅ <itunes:keywords>jazz, test, morning show</itunes:keywords> found');
        } else {
            console.log('  ❌ <itunes:keywords> NOT found or incorrect');
            allPassed = false;
        }

        console.log('\n─'.repeat(70) + '\n');

        // ====== TEST 4: Verify Default Value ======
        console.log('TEST 4: Verify Default Value (episodic)\n');

        const testShow2 = await prisma.show.create({
            data: {
                title: 'TEST_RSS_DEFAULT',
                description: 'Test default itunesType',
                type: 'Local Music',
                recordingEnabled: false,
            }
        });

        const testShow2Id = testShow2.id;
        console.log(`  ✅ Test show 2 created with default itunesType: ${testShow2.itunesType}`);

        // Fetch RSS for second show
        const rssUrl2 = `http://localhost:3000/api/feed/${testShow2Id}/rss.xml`;
        const response2 = await fetch(rssUrl2);
        const rssXml2 = await response2.text();

        const episodicRegex = /<itunes:type>episodic<\/itunes:type>/;
        if (episodicRegex.test(rssXml2)) {
            console.log('  ✅ <itunes:type>episodic</itunes:type> found (default value works)');
        } else {
            console.log('  ❌ Default value test failed');
            allPassed = false;
        }

        // Clean up second show
        await prisma.show.delete({ where: { id: testShow2Id } });
        console.log('  ✅ Test show 2 cleaned up\n');

        console.log('─'.repeat(70) + '\n');

        // ====== FINAL RESULTS ======
        console.log('═'.repeat(70) + '\n');
        console.log('📊 FINAL VERIFICATION RESULTS\n');
        console.log('═'.repeat(70) + '\n');

        if (allPassed) {
            console.log('🎉 ALL VERIFICATION TESTS PASSED!\n');
            console.log('✅ <itunes:type> tag is working correctly');
            console.log('✅ <itunes:keywords> tag is working correctly');
            console.log('✅ Default value (episodic) is working correctly\n');
            console.log('RSS feed is 100% iTunes compatible! 🚀\n');
        } else {
            console.log('⚠️  SOME VERIFICATION TESTS FAILED\n');
            console.log('Please review the failures above.\n');
        }

    } catch (error) {
        console.error('💥 Verification error:', error);
    } finally {
        // Clean up test show
        if (testShowId) {
            await prisma.show.delete({ where: { id: testShowId } });
            console.log('✅ Test show cleaned up\n');
        }
        await prisma.$disconnect();
    }
}

verifyRSSFeed();
