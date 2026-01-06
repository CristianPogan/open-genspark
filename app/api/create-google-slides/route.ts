import { NextRequest, NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY || '',
    provider: new VercelProvider()
});

export async function POST(req: NextRequest) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] ========== Create Google Slides Request Started ==========`);
    
    try {
        const { slides, title, userId, style = 'professional' } = await req.json();
        
        // Validate required fields
        if (!slides || !Array.isArray(slides) || slides.length === 0) {
            return NextResponse.json(
                { error: 'Slides are required to create Google Slides presentation.' },
                { status: 400 }
            );
        }
        
        // Get userId from cookies or request body, generate one if missing
        const cookieUserId = req.cookies.get('googlesheet_user_id')?.value || 
                             req.cookies.get('googledoc_user_id')?.value;
        
        let finalUserId = cookieUserId || userId;
        
        // Generate a temporary userId if none exists (for unauthenticated access)
        let newCookie = false;
        if (!finalUserId) {
            finalUserId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            newCookie = true;
            console.log(`[${requestId}] ✅ Generated new userId for Google Slides:`, finalUserId);
        } else {
            console.log(`[${requestId}] ✅ Using existing userId:`, finalUserId);
        }
        
        // Note: Even with a generated userId, Google Slides creation requires connected accounts
        // The user will need to sign in to actually create slides, but we allow the attempt
        
        console.log(`[${requestId}] Creating Google Slides for userId:`, finalUserId);
        console.log(`[${requestId}] Slide count:`, slides.length);
        console.log(`[${requestId}] Title:`, title);
        
        // Check if user has connected Google Slides account
        let hasConnectedAccount = false;
        try {
            console.log(`[${requestId}] Checking connected accounts for userId:`, finalUserId);
            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [String(finalUserId)],
                toolkitSlugs: ['GOOGLESLIDES']
            });
            // connectedAccounts is an object with items array, not an array itself
            hasConnectedAccount = connectedAccounts?.items && connectedAccounts.items.length > 0;
            console.log(`[${requestId}] Connected Google Slides accounts:`, hasConnectedAccount ? connectedAccounts.items.length : 0);
        } catch (checkError: any) {
            console.warn(`[${requestId}] ⚠️ Could not check connected accounts:`, checkError?.message);
            // Continue anyway - will fail later if no connection
        }
        
        // Get Google Slides tools - tools should be available even without connected accounts
        // (execution will fail if no account, but tools themselves should be fetchable)
        let googleSlidesTools: any = {};
        try {
            console.log(`[${requestId}] Fetching GOOGLESLIDES toolkit...`);
            googleSlidesTools = await composio.tools.get(String(finalUserId), {
                toolkits: ['GOOGLESLIDES'],
            });
            console.log(`[${requestId}] ✅ GOOGLESLIDES toolkit:`, Object.keys(googleSlidesTools).length, 'tools');
            console.log(`[${requestId}] Available tool keys:`, Object.keys(googleSlidesTools));
            
            // Log tool details for debugging
            Object.entries(googleSlidesTools).forEach(([key, tool]: [string, any]) => {
                console.log(`[${requestId}] Tool: ${key}`, {
                    name: tool?.name,
                    slug: tool?.slug,
                    description: tool?.description?.substring(0, 100)
                });
            });
        } catch (error: any) {
            console.error(`[${requestId}] ❌ Failed to get GOOGLESLIDES tools:`, error?.message);
            console.error(`[${requestId}] Error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message,
                stack: error?.stack?.substring(0, 300)
            });
            
            // Check if it's an authentication/connection error
            const isAuthError = error?.status === 401 || 
                               error?.status === 403 ||
                               error?.message?.toLowerCase().includes('not connected') ||
                               error?.message?.toLowerCase().includes('authentication') ||
                               error?.message?.toLowerCase().includes('unauthorized');
            
            if (isAuthError || !hasConnectedAccount) {
                return NextResponse.json(
                    { 
                        error: 'Your Google account is not connected. Please sign in to create Google Slides.',
                        details: error?.message,
                        suggestion: 'Visit /signin to connect your Google Slides account.',
                        userId: finalUserId,
                        hasConnectedAccount
                    },
                    { status: 401 }
                );
            }
            
            return NextResponse.json(
                { 
                    error: 'Failed to access Google Slides tools. Please check your Google account connection.',
                    details: error?.message,
                    suggestion: 'Visit /signin to connect your Google Slides account, or try again later.',
                    requestId,
                    hasConnectedAccount
                },
                { status: 500 }
            );
        }
        
        // Check if we have the create presentation tool
        // Tools can be keyed by their slug or by a different identifier
        let createTool: any = null;
        
        // First, check by key name (tools are often keyed by slug)
        const toolKeys = Object.keys(googleSlidesTools);
        const createToolKey = toolKeys.find(key => 
            key === 'GOOGLESLIDES_PRESENTATIONS_CREATE' ||
            key === 'GOOGLESLIDES_CREATE_SLIDES_MARKDOWN' ||
            key === 'GOOGLESLIDES_CREATE_PRESENTATION' ||
            key.toLowerCase().includes('create') ||
            key.toLowerCase().includes('markdown')
        );
        
        if (createToolKey) {
            createTool = googleSlidesTools[createToolKey];
            console.log(`[${requestId}] ✅ Found tool by key: ${createToolKey}`);
        }
        
        // If not found by key, check by slug in tool values
        if (!createTool) {
            createTool = Object.values(googleSlidesTools).find((tool: any) => 
                tool?.slug === 'GOOGLESLIDES_PRESENTATIONS_CREATE' ||
                tool?.slug === 'GOOGLESLIDES_CREATE_SLIDES_MARKDOWN' ||
                tool?.slug === 'GOOGLESLIDES_CREATE_PRESENTATION' ||
                tool?.name?.toLowerCase().includes('create') || 
                tool?.name?.toLowerCase().includes('presentation') ||
                tool?.slug?.toLowerCase().includes('create') ||
                tool?.slug?.toLowerCase().includes('markdown')
            );
            if (createTool) {
                console.log(`[${requestId}] ✅ Found tool by slug: ${createTool?.slug}`);
            }
        }
        
        // If tool found in toolkit, use it
        if (createTool) {
            console.log(`[${requestId}] ✅ Found create presentation tool in toolkit`);
            console.log(`[${requestId}] Tool details:`, {
                key: Object.keys(googleSlidesTools).find(k => googleSlidesTools[k] === createTool),
                slug: createTool?.slug,
                name: createTool?.name,
                hasExecute: typeof createTool?.execute === 'function'
            });
            
            // Create the presentation
            let presentationResult: any;
            try {
                if (createTool.slug === 'GOOGLESLIDES_CREATE_SLIDES_MARKDOWN') {
                    // This tool accepts markdown content
                    const markdownContent = slides.map((s: any) => 
                        `# ${s.title}\n\n${s.content || s.bulletPoints?.join('\n') || ''}`
                    ).join('\n\n---\n\n');
                    presentationResult = await createTool.execute({
                        title: title || 'AI Generated Presentation',
                        content: markdownContent
                    });
                } else {
                    // Standard presentation creation
                    presentationResult = await createTool.execute({
                        title: title || 'AI Generated Presentation',
                    });
                }
            } catch (execError: any) {
                console.error(`[${requestId}] ❌ Error executing create tool:`, execError?.message);
                // Check if it's a "no connected accounts" error
                if (execError?.message?.includes('No connected accounts') || 
                    execError?.cause?.message?.includes('No connected accounts')) {
                    return NextResponse.json(
                        { 
                            error: 'Your Google account is not connected. Please sign in to create Google Slides.',
                            details: execError?.message,
                            suggestion: 'Visit /signin to connect your Google Slides account.',
                            userId: finalUserId
                        },
                        { status: 401 }
                    );
                }
                throw execError;
            }
            
            console.log(`[${requestId}] ✅ Presentation created:`, presentationResult);
            
            const presentationId = presentationResult?.data?.presentationId || 
                                  presentationResult?.presentationId ||
                                  presentationResult?.id;
            
            if (!presentationId) {
                console.error(`[${requestId}] ❌ No presentation ID in result:`, presentationResult);
                throw new Error('Failed to get presentation ID from creation result');
            }
            
            // If the tool created slides from markdown, we're done
            if (createTool.slug === 'GOOGLESLIDES_CREATE_SLIDES_MARKDOWN' && presentationId) {
                const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
                
                const response = NextResponse.json({
                    success: true,
                    presentationId,
                    slidesUrl,
                    message: `Successfully created Google Slides presentation with ${slides.length} slides.`,
                    requestId
                });
                
                // Set cookie if we generated a new userId
                if (newCookie && finalUserId) {
                    response.cookies.set('googlesheet_user_id', finalUserId, {
                        path: '/',
                        maxAge: 60 * 60 * 24 * 365,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    });
                }
                
                return response;
            }
            
            // Otherwise, add slides manually (for other tool types)
            // Get slide creation/update tools
            const updateTool = await composio.tools.get(String(finalUserId), {
                tools: ['GOOGLESLIDES_INSERT_SLIDE', 'GOOGLESLIDES_INSERT_TEXT']
            });
            
            // Add each slide
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                try {
                    // Insert slide
                    const insertSlideTool = Object.values(updateTool).find((t: any) => 
                        t?.slug?.includes('INSERT_SLIDE')
                    );
                    
                    if (insertSlideTool) {
                        await (insertSlideTool as any).execute({
                            presentationId,
                            insertionIndex: i,
                            slideLayoutReference: {
                                predefinedLayout: slide.type === 'title' ? 'TITLE' : 'BLANK'
                            }
                        });
                        
                        // Add title
                        const insertTextTool = Object.values(updateTool).find((t: any) => 
                            t?.slug?.includes('INSERT_TEXT')
                        );
                        
                        if (insertTextTool && slide.title) {
                            await (insertTextTool as any).execute({
                                presentationId,
                                pageObjectId: 'current',
                                text: slide.title,
                                insertionIndex: 0
                            });
                        }
                    }
                } catch (slideError: any) {
                    console.warn(`[${requestId}] ⚠️ Failed to add slide ${i + 1}:`, slideError?.message);
                }
            }
            
            const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
            
            const response = NextResponse.json({
                success: true,
                presentationId,
                slidesUrl,
                message: `Successfully created Google Slides presentation with ${slides.length} slides.`,
                requestId
            });
            
            // Set cookie if we generated a new userId
            if (newCookie && finalUserId) {
                response.cookies.set('googlesheet_user_id', finalUserId, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 365,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                });
            }
            
            return response;
        }
        
        // Tool not found in toolkit, try fetching directly
        console.error(`[${requestId}] ❌ No create presentation tool found in toolkit`);
        console.log(`[${requestId}] Available tools:`, Object.keys(googleSlidesTools));
        console.log(`[${requestId}] Tool details:`, Object.entries(googleSlidesTools).map(([k, v]: [string, any]) => ({
            key: k,
            slug: v?.slug,
            name: v?.name
        })));
        
        // Try multiple possible tool names
        const possibleToolNames = [
            'GOOGLESLIDES_PRESENTATIONS_CREATE',
            'GOOGLESLIDES_CREATE_SLIDES_MARKDOWN',
            'GOOGLESLIDES_CREATE_PRESENTATION'
        ];
        
        let foundTool: any = null;
        for (const toolName of possibleToolNames) {
            try {
                console.log(`[${requestId}] Trying to fetch tool: ${toolName}`);
                const createPresentationTool = await composio.tools.get(String(finalUserId), {
                    tools: [toolName]
                });
                
                if (Object.keys(createPresentationTool).length > 0) {
                    foundTool = Object.values(createPresentationTool)[0] as any;
                    console.log(`[${requestId}] ✅ Found tool: ${toolName}`);
                    break;
                }
            } catch (toolError: any) {
                console.warn(`[${requestId}] Tool ${toolName} not available:`, toolError?.message);
                continue;
            }
        }
        
        if (!foundTool) {
            return NextResponse.json(
                { 
                    error: 'Google Slides creation tool not available. Please check your Google account connection.',
                    availableTools: Object.keys(googleSlidesTools),
                    suggestion: 'Visit /signin to connect your Google Slides account.',
                    requestId
                },
                { status: 500 }
            );
        }
        
        // Use the found tool (same logic as above)
        const tool = foundTool;
        console.log(`[${requestId}] ✅ Using fetched create presentation tool`);
        console.log(`[${requestId}] Tool details:`, {
            name: tool?.name,
            slug: tool?.slug,
            hasExecute: typeof tool?.execute === 'function'
        });
        
        // Create the presentation
        let presentationResult: any;
        try {
            if (tool.slug === 'GOOGLESLIDES_CREATE_SLIDES_MARKDOWN') {
                const markdownContent = slides.map((s: any) => 
                    `# ${s.title}\n\n${s.content || s.bulletPoints?.join('\n') || ''}`
                ).join('\n\n---\n\n');
                presentationResult = await tool.execute({
                    title: title || 'AI Generated Presentation',
                    content: markdownContent
                });
            } else {
                presentationResult = await tool.execute({
                    title: title || 'AI Generated Presentation',
                });
            }
        } catch (execError: any) {
            console.error(`[${requestId}] ❌ Error executing create tool:`, execError?.message);
            if (execError?.message?.includes('No connected accounts') || 
                execError?.cause?.message?.includes('No connected accounts')) {
                return NextResponse.json(
                    { 
                        error: 'Your Google account is not connected. Please sign in to create Google Slides.',
                        details: execError?.message,
                        suggestion: 'Visit /signin to connect your Google Slides account.',
                        userId: finalUserId
                    },
                    { status: 401 }
                );
            }
            throw execError;
        }
        
        console.log(`[${requestId}] ✅ Presentation created:`, presentationResult);
        
        const presentationId = presentationResult?.data?.presentationId || 
                              presentationResult?.presentationId ||
                              presentationResult?.id;
        
        if (!presentationId) {
            throw new Error('Failed to get presentation ID from creation result');
        }
        
        const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
        
        const response = NextResponse.json({
            success: true,
            presentationId,
            slidesUrl,
            message: `Successfully created Google Slides presentation with ${slides.length} slides.`,
            requestId
        });
        
        // Set cookie if we generated a new userId
        if (newCookie && finalUserId) {
            response.cookies.set('googlesheet_user_id', finalUserId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });
        }
        
        return response;
        
    } catch (error: any) {
        console.error(`[${requestId}] ❌❌❌ Create Google Slides Error ❌❌❌`);
        console.error(`[${requestId}] Error:`, error);
        console.error(`[${requestId}] Error details:`, {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            stack: error?.stack?.substring(0, 500)
        });
        
        return NextResponse.json(
            { 
                error: 'Failed to create Google Slides presentation.',
                details: error?.message || 'Unknown error',
                requestId
            },
            { status: 500 }
        );
    }
}

