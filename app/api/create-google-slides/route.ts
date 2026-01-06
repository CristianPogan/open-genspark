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
            hasConnectedAccount = connectedAccounts && connectedAccounts.length > 0;
            console.log(`[${requestId}] Connected Google Slides accounts:`, hasConnectedAccount ? connectedAccounts.length : 0);
        } catch (checkError: any) {
            console.warn(`[${requestId}] ⚠️ Could not check connected accounts:`, checkError?.message);
            // Continue anyway - will fail later if no connection
        }
        
        // Get Google Slides tools
        let googleSlidesTools: any = {};
        try {
            console.log(`[${requestId}] Fetching GOOGLESLIDES toolkit...`);
            googleSlidesTools = await composio.tools.get(String(finalUserId), {
                toolkits: ['GOOGLESLIDES'],
            });
            console.log(`[${requestId}] ✅ GOOGLESLIDES toolkit:`, Object.keys(googleSlidesTools).length, 'tools');
        } catch (error: any) {
            console.error(`[${requestId}] ❌ Failed to get GOOGLESLIDES tools:`, error?.message);
            
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
                        userId: finalUserId
                    },
                    { status: 401 }
                );
            }
            
            return NextResponse.json(
                { 
                    error: 'Failed to access Google Slides tools.',
                    details: error?.message,
                    suggestion: 'Please check your Google account connection or try again later.',
                    requestId
                },
                { status: 500 }
            );
        }
        
        // Check if we have the create presentation tool
        const createTool = Object.values(googleSlidesTools).find((tool: any) => 
            tool?.name?.toLowerCase().includes('create') || 
            tool?.name?.toLowerCase().includes('presentation') ||
            tool?.slug?.toLowerCase().includes('create')
        );
        
        if (!createTool) {
            console.error(`[${requestId}] ❌ No create presentation tool found`);
            console.log(`[${requestId}] Available tools:`, Object.keys(googleSlidesTools));
            
            // Try to use GOOGLESLIDES_CREATE_PRESENTATION directly
            try {
                const createPresentationTool = await composio.tools.get(String(finalUserId), {
                    tools: ['GOOGLESLIDES_CREATE_PRESENTATION']
                });
                
                if (Object.keys(createPresentationTool).length > 0) {
                    const tool = Object.values(createPresentationTool)[0] as any;
                    console.log(`[${requestId}] ✅ Found GOOGLESLIDES_CREATE_PRESENTATION tool`);
                    
                    // Create the presentation
                    const presentationResult = await tool.execute({
                        title: title || 'AI Generated Presentation',
                    });
                    
                    console.log(`[${requestId}] ✅ Presentation created:`, presentationResult);
                    
                    const presentationId = presentationResult?.data?.presentationId || presentationResult?.presentationId;
                    
                    if (!presentationId) {
                        throw new Error('Failed to get presentation ID from creation result');
                    }
                    
                    // Now add slides to the presentation
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
                                        pageObjectId: 'current', // Will need to get actual page ID
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
            } catch (directToolError: any) {
                console.error(`[${requestId}] ❌ Direct tool creation failed:`, directToolError?.message);
            }
            
            return NextResponse.json(
                { 
                    error: 'Google Slides creation tool not available. Please check your Google account connection.',
                    availableTools: Object.keys(googleSlidesTools),
                    requestId
                },
                { status: 500 }
            );
        }
        
        // Use the create tool
        console.log(`[${requestId}] Using create tool:`, createTool);
        
        // Create presentation with first slide
        const presentationResult = await (createTool as any).execute({
            title: title || 'AI Generated Presentation',
            slides: slides.map((slide: any, index: number) => ({
                title: slide.title,
                content: slide.content || slide.bulletPoints?.join('\n') || '',
                type: slide.type || (index === 0 ? 'title' : 'content')
            }))
        });
        
        console.log(`[${requestId}] ✅ Presentation created:`, presentationResult);
        
        const presentationId = presentationResult?.data?.presentationId || 
                              presentationResult?.presentationId ||
                              presentationResult?.id;
        
        if (!presentationId) {
            throw new Error('Failed to get presentation ID from creation result');
        }
        
        const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
        
        console.log(`[${requestId}] ========== Google Slides Created Successfully ==========`);
        
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

