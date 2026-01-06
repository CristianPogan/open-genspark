import { NextRequest, NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { generateText, generateObject } from 'ai';
import { google } from "@ai-sdk/google";
import { z } from 'zod';

// Initialize Composio with error handling
console.log('🔧 Initializing Composio SDK...');
console.log('🔧 COMPOSIO_API_KEY present:', !!process.env.COMPOSIO_API_KEY);
console.log('🔧 COMPOSIO_API_KEY length:', process.env.COMPOSIO_API_KEY?.length || 0);

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY || '',
    provider: new VercelProvider()
});

if (!process.env.COMPOSIO_API_KEY) {
    console.error('❌ COMPOSIO_API_KEY is not set in environment variables');
}
console.log('✅ Composio SDK initialized successfully');

// Fixed HTML templates for different slide types
function generateSlideHTML(slide: any, style: string = 'professional') {
  const { title, content, type, bulletPoints } = slide;
  
  // Color schemes by style
  const colorSchemes = {
    professional: {
      primary: '#1a365d',
      secondary: '#2b6cb0',
      accent: '#ed8936',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    },
    creative: {
      primary: '#e53e3e',
      secondary: '#dd6b20',
      accent: '#38a169',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      text: '#ffffff',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    },
    minimal: {
      primary: '#000000',
      secondary: '#2d3748',
      accent: '#4299e1',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      text: '#2d3748',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    },
    academic: {
      primary: '#2c5282',
      secondary: '#2b6cb0',
      accent: '#d69e2e',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      text: '#ffffff',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    }
  };
  
  const colors = colorSchemes[style as keyof typeof colorSchemes] || colorSchemes.professional;
  
  const baseCSS = `
    .slide-container {
      width: 100%;
      height: 100%;
      isolation: isolate;
    }
    
    .slide-container * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    .slide-container .slide {
      width: 100%;
      height: 100%;
      min-height: 500px;
      background: ${colors.background};
      color: ${colors.text};
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    
    .slide-container .slide::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      z-index: 1;
    }
    
    .slide-container .slide-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: 800px;
      width: 100%;
    }
    
    .slide-container h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }
    
    .slide-container h2 {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }
    
    .slide-container .subtitle {
      font-size: 1.25rem;
      font-weight: 400;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    
    .slide-container .content-card {
      background: ${colors.cardBg};
      color: ${colors.cardText};
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05);
      margin-top: 2rem;
      text-align: left;
    }
    
    .slide-container .content-card p {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .slide-container .bullets {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .slide-container .bullets li {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1rem;
      padding-left: 2rem;
      position: relative;
    }
    
    .slide-container .bullets li::before {
      content: '•';
      color: ${colors.accent};
      font-size: 1.5rem;
      position: absolute;
      left: 0;
      top: 0;
    }
    
    .slide-container .slide-number {
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 0.9rem;
      opacity: 0.7;
      z-index: 3;
    }
  `;
  
  let slideHTML = '';
  
  if (type === 'title') {
    slideHTML = `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-content">
            <h1>${title}</h1>
            ${content ? `<p class="subtitle">${content}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  } else if (type === 'bullet') {
    const bulletHTML = bulletPoints ? 
      `<ul class="bullets">${bulletPoints.map((bullet: string) => `<li>${bullet}</li>`).join('')}</ul>` : 
      '';
    
    slideHTML = `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-content">
            <h2>${title}</h2>
            <div class="content-card">
              ${bulletHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // content type
    slideHTML = `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-content">
            <h2>${title}</h2>
            <div class="content-card">
              <p>${content}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  return `<style>${baseCSS}</style>${slideHTML}`;
}

// Schema for slide generation with fixed templates
const slideSchema = z.object({
  slides: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.enum(['title', 'content', 'bullet']),
    bulletPoints: z.array(z.string()).optional(),
  }))
});

// Custom slide generation tool
const SLIDE_GENERATOR_TOOL = 'GENERATE_PRESENTATION_SLIDES';

// Initialize custom slide generation tool
async function initializeSlideGenerationTool() {
    try {
        console.log('🔧 Initializing slide generation tool...');
        const tool = await composio.tools.createCustomTool({
            slug: SLIDE_GENERATOR_TOOL,
            name: 'Generate Presentation Slides',
            description: 'Creates a professional presentation based on provided content, with customizable slide count and style.',
            inputParams: z.object({
                content: z.string().describe('The detailed content or data for the presentation. This should be a summary or the full text from which to generate slides.'),
                slideCount: z.number().min(1).max(20).default(5).describe('Number of slides to generate (1-20)'),
                style: z.enum(['professional', 'creative', 'minimal', 'academic']).default('professional').describe("The visual style for the presentation.")
            }),
            execute: async (input: any, connectionConfig?: any) => {
                try {
                    const { content, slideCount, style } = input;
                    
                    const { object } = await generateObject({
                        model: google('gemini-2.5-pro'),
                        schema: slideSchema,
                        prompt: `Create a professional presentation with ${slideCount} slides using a ${style} style, based on the following content:

---
${content}
---

CRITICAL CONTENT RULES:
- Base the presentation ENTIRELY on the provided content. Do not add outside information.
- NEVER use placeholder text like "heading", "content", "bullet point", etc.
- ALWAYS write actual, meaningful, specific content derived from the provided text.
- Each slide must have substantive, valuable information from the source content.

SLIDE STRUCTURE:
- Slide 1: Title slide with a compelling title and descriptive subtitle that summarizes the content.
- Slides 2-${slideCount-1}: Content slides with specific information, insights, or analysis from the source.
- Slide ${slideCount}: Strong conclusion with key takeaways and next steps based on the source.

SLIDE TYPES:
- Use "title" type for the first slide only.
- Use "bullet" for slides with multiple key points (3-5 bullets max).
- Use "content" for slides with detailed explanations.

Generate substantial, professional content that accurately reflects the provided text.`,
                    });

                    // Add HTML to each slide using the fixed template
                    const slidesWithHTML = object.slides.map((slide: any) => ({
                        ...slide,
                        html: generateSlideHTML(slide, style)
                    }));

                    return {
                        data: {
                            slides: slidesWithHTML,
                            slideCount: slidesWithHTML.length,
                            topic: slidesWithHTML[0]?.title || 'Generated Presentation',
                            style,
                            message: `Successfully generated ${slidesWithHTML.length} slides.`
                        },
                        error: null,
                        successful: true
                    };
                } catch (error: any) {
                    console.error('Error in slide generation execute function:', error);
                    return {
                        data: {
                            error: `Failed to generate slides: ${error instanceof Error ? error.message : 'Unknown error'}`
                        },
                        error: null,
                        successful: false
                    };
                }
            }
        });
        
        console.log('🚀 Slide generation tool created:', tool);
        return tool;
    } catch (error: any) {
        console.error('Error creating slide generation tool:', error);
        console.error('Slide generation tool creation error details:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack?.substring(0, 500)
        });
        return null;
    }
}

const PUPPETEER_TOOL = 'PUPPETEER_BROWSER';

async function initializePuppeteerTool() {
  try {
    const tool = await composio.tools.createCustomTool({
      slug: PUPPETEER_TOOL,
      name: 'Browser Automation (Puppeteer)',
      description: 'Browse the web, scrape data, or interact with web pages using Puppeteer.',
      inputParams: z.object({
        url: z.string().describe('The URL to browse or scrape'),
        action: z.enum(['scrape', 'screenshot', 'html', 'click', 'type', 'select']).default('scrape'),
        selector: z.string().optional().describe('CSS selector for scraping or interaction'),
        value: z.string().optional().describe('Value to type or select (for type/select actions)'),
      }),
      execute: async (input: any) => {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch();
        const page = await browser.newPage();
        await page.goto(input.url);

        let result;
        if (input.action === 'html') {
          result = await page.content();
        } else if (input.action === 'scrape' && input.selector) {
          result = await page.$eval(input.selector, (el: any) => el.textContent);
        } else if (input.action === 'scrape' && !input.selector) {
          result = await page.content();
        } else if (input.action === 'screenshot') {
          result = await page.screenshot({ encoding: 'base64' });
        } else if (input.action === 'click' && input.selector) {
          await page.click(input.selector);
          result = `Clicked element: ${input.selector}`;
        } else if (input.action === 'type' && input.selector && input.value) {
          await page.type(input.selector, input.value);
          result = `Typed "${input.value}" into ${input.selector}`;
        } else if (input.action === 'select' && input.selector && input.value) {
          await page.select(input.selector, input.value);
          result = `Selected value "${input.value}" in ${input.selector}`;
        } else {
          result = await page.content();
        }

        // Always take a screenshot after the action (except if the action itself is screenshot)
        let screenshot = null;
        if (input.action !== 'screenshot') {
          screenshot = await page.screenshot({ encoding: 'base64' });
        }

        await browser.close();
        return { data: { result, screenshot }, error: null, successful: true };
      }
    });
    return tool;
  } catch (error) {
    console.error('Error creating puppeteer tool:', error);
    return null;
  }
}

// Remove the old template functions since we now use generateSlideHTML

// Helper function to create response with optional cookie
function createResponse(data: any, userId?: string, setCookie: boolean = false): NextResponse {
    const response = NextResponse.json(data);
    if (setCookie && userId) {
        response.cookies.set('googlesheet_user_id', userId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
    }
    return response;
}

export async function POST(req: NextRequest) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] ========== SuperAgent Request Started ==========`);
    console.log(`[${requestId}] Timestamp:`, new Date().toISOString());
    
    try {
        // Parse request body with error handling
        let requestBody;
        try {
            console.log(`[${requestId}] Parsing request body...`);
            requestBody = await req.json();
            console.log(`[${requestId}] Request body parsed successfully`);
            console.log(`[${requestId}] Request body keys:`, Object.keys(requestBody || {}));
        } catch (parseError: any) {
            console.error(`[${requestId}] ❌ Failed to parse request body:`, parseError);
            console.error(`[${requestId}] Parse error details:`, {
                message: parseError?.message,
                stack: parseError?.stack
            });
            return NextResponse.json(
                { error: 'Invalid request body. Please check your input.' },
                { status: 400 }
            );
        }

        const { prompt, selectedTool, conversationHistory, userId: bodyUserId, sheetUrl, docUrl, slidesUrl, slidesId } = requestBody || {};
        
        console.log(`[${requestId}] Request parameters:`, {
            hasPrompt: !!prompt,
            promptLength: prompt?.length,
            selectedTool,
            conversationHistoryLength: conversationHistory?.length,
            bodyUserId,
            sheetUrl: !!sheetUrl,
            docUrl: !!docUrl,
            slidesUrl: !!slidesUrl,
            slidesId: slidesId
        });
        
        // Validate required fields
        if (!prompt) {
            console.error(`[${requestId}] ❌ Prompt is missing`);
            return NextResponse.json(
                { error: 'Prompt is required.' },
                { status: 400 }
            );
        }
        
        // Check for required environment variables
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error(`[${requestId}] ❌ GOOGLE_GENERATIVE_AI_API_KEY is missing`);
            return NextResponse.json(
                { 
                    error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable. Please set it in Vercel settings.',
                    requestId: requestId
                },
                { status: 500 }
            );
        }
        
        if (!process.env.COMPOSIO_API_KEY) {
            console.error(`[${requestId}] ❌ COMPOSIO_API_KEY is missing`);
            return NextResponse.json(
                { 
                    error: 'Missing COMPOSIO_API_KEY environment variable. Please set it in Vercel settings.',
                    requestId: requestId
                },
                { status: 500 }
            );
        }
        
        console.log(`[${requestId}] ✅ Environment variables check passed`);
        
        // Get userId from cookies or request body, generate one if missing
        const cookieUserId = req.cookies.get('googlesheet_user_id')?.value || 
                             req.cookies.get('googledoc_user_id')?.value;
        
        console.log(`[${requestId}] UserId sources:`, {
            cookieUserId,
            bodyUserId,
            hasCookies: !!cookieUserId
        });
        
        let userId = cookieUserId || bodyUserId;
        
        // Generate a temporary userId if none exists (for unauthenticated access)
        let newCookie = false;
        if (!userId) {
            userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            newCookie = true;
            console.log(`[${requestId}] ✅ Generated new userId:`, userId);
        } else {
            console.log(`[${requestId}] ✅ Using existing userId:`, userId);
        }
        
        console.log(`[${requestId}] Final userId:`, userId, `(newCookie: ${newCookie})`);

        // If a new sheet is connected, ask the user what to do next.
        if (sheetUrl && !conversationHistory.some((m: any) => m.content.includes('Spreadsheet Connected'))) {
            return createResponse({
                response: `📊 **Spreadsheet Connected!** I've successfully connected to your Google Sheet. What would you like to do with it? For example, you can ask me to:

- "Summarize the key insights from this data"
`,
                hasSlides: false,
            }, userId, newCookie);
        }

        // If a new doc is connected, ask the user what to do next.
        if (docUrl && !conversationHistory.some((m: any) => m.content.includes('Document Connected'))) {
            return createResponse({
                response: `📄 **Document Connected!** I've successfully connected to your Google Doc. What would you like to do with it? For example, you can ask me to:

- "Summarize this document"
- "Extract the key action items"
- "Check for grammatical errors"`,
                hasSlides: false,
            }, userId, newCookie);
        }

        // If a Google Slides URL is detected, inform the AI about it
        if (slidesUrl && slidesId) {
            console.log(`[${requestId}] Google Slides URL detected:`, slidesUrl);
            console.log(`[${requestId}] Presentation ID:`, slidesId);
            // Add context to the prompt about the existing presentation
            // The AI will use GOOGLESLIDES tools to update it
        }
        
        // Initialize the custom slide generation tool (with error handling)
        console.log(`[${requestId}] Initializing custom tools...`);
        try {
            console.log(`[${requestId}] Initializing slide generation tool...`);
            await initializeSlideGenerationTool();
            console.log(`[${requestId}] ✅ Slide generation tool initialized`);
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to initialize slide generation tool:`, error?.message);
            console.warn(`[${requestId}] Slide generation tool error details:`, {
                message: error?.message,
                code: error?.code,
                stack: error?.stack?.substring(0, 200)
            });
            // Continue - the tool might already exist or we can proceed without it
        }
        
        try {
            console.log(`[${requestId}] Initializing puppeteer tool...`);
            await initializePuppeteerTool();
            console.log(`[${requestId}] ✅ Puppeteer tool initialized`);
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to initialize puppeteer tool:`, error?.message);
            console.warn(`[${requestId}] Puppeteer tool error details:`, {
                message: error?.message,
                code: error?.code
            });
            // Continue - puppeteer is optional
        }
        
        // --- REMOVED SLIDE GENERATION LOGIC ---
        // The old logic was too simple and has been removed.
        // The main agent will now handle slide generation requests using the upgraded tool.
        
        // Get comprehensive toolkits based on selected tool or default to all
        let toolkits = ['GOOGLESUPER', 'COMPOSIO_SEARCH'];
        

        // Get both toolkit tools and custom tools with error handling
        // Wrap all Composio calls in try-catch to prevent 401 errors from propagating
        console.log(`[${requestId}] Fetching Composio toolkits for userId: ${userId}...`);
        
        let google_super_toolkit = {};
        let google_sheet_tools = {};
        let google_docs_tools = {};
        let google_drive_tools = {};
        let google_slides_tools = {};
        let get_google_docs_tools = {};
        let get_google_sheets_tools = {};
        let composio_search_toolkit = {};
        let composio_toolkit = {};

        try {
            console.log(`[${requestId}] Fetching GOOGLESUPER toolkit...`);
            google_super_toolkit = await composio.tools.get(String(userId), {
                toolkits: ['GOOGLESUPER'],
                limit: 10
            });
            console.log(`[${requestId}] ✅ GOOGLESUPER toolkit:`, Object.keys(google_super_toolkit).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get GOOGLESUPER tools:`, error?.message);
            console.warn(`[${requestId}] GOOGLESUPER error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        try {
            console.log(`[${requestId}] Fetching GOOGLESHEETS toolkit...`);
            google_sheet_tools = await composio.tools.get(String(userId), {
                toolkits: ['GOOGLESHEETS'],
            });
            console.log(`[${requestId}] ✅ GOOGLESHEETS toolkit:`, Object.keys(google_sheet_tools).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get GOOGLESHEETS tools:`, error?.message);
            console.warn(`[${requestId}] GOOGLESHEETS error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        try {
            console.log(`[${requestId}] Fetching GOOGLEDOCS toolkit...`);
            google_docs_tools = await composio.tools.get(String(userId), {
                toolkits: ['GOOGLEDOCS'],
                limit: 10
            });
            console.log(`[${requestId}] ✅ GOOGLEDOCS toolkit:`, Object.keys(google_docs_tools).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get GOOGLEDOCS tools:`, error?.message);
            console.warn(`[${requestId}] GOOGLEDOCS error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        // Add Google Drive and Google Slides toolkits
        try {
            console.log(`[${requestId}] Fetching GOOGLEDRIVE toolkit...`);
            google_drive_tools = await composio.tools.get(String(userId), {
                toolkits: ['GOOGLEDRIVE'],
                limit: 10
            });
            console.log(`[${requestId}] ✅ GOOGLEDRIVE toolkit:`, Object.keys(google_drive_tools).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get GOOGLEDRIVE tools:`, error?.message);
            console.warn(`[${requestId}] GOOGLEDRIVE error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        try {
            console.log(`[${requestId}] Fetching GOOGLESLIDES toolkit...`);
            google_slides_tools = await composio.tools.get(String(userId), {
                toolkits: ['GOOGLESLIDES'],
                limit: 10
            });
            console.log(`[${requestId}] ✅ GOOGLESLIDES toolkit:`, Object.keys(google_slides_tools).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get GOOGLESLIDES tools:`, error?.message);
            console.warn(`[${requestId}] GOOGLESLIDES error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }
        
        try {
            console.log(`[${requestId}] Fetching Google Docs specific tools...`);
            get_google_docs_tools = await composio.tools.get(String(userId), {
                tools: ['GOOGLEDOCS_GET_DOCUMENT_BY_ID','GOOGLEDOCS_UPDATE_DOCUMENT_MARKDOWN', 'GOOGLEDOCS_DELETE_CONTENT_RANGE']
            });
            console.log(`[${requestId}] ✅ Google Docs specific tools:`, Object.keys(get_google_docs_tools).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get Google Docs specific tools:`, error?.message);
            console.warn(`[${requestId}] Google Docs tools error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        try {
            console.log(`[${requestId}] Fetching Google Sheets specific tools...`);
            get_google_sheets_tools = await composio.tools.get(String(userId), {
                tools: ['GOOGLESHEETS_GET_SHEET_BY_ID']
            });
            console.log(`[${requestId}] ✅ Google Sheets specific tools:`, Object.keys(get_google_sheets_tools).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get Google Sheets specific tools:`, error?.message);
            console.warn(`[${requestId}] Google Sheets tools error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        try {
            console.log(`[${requestId}] Fetching COMPOSIO_SEARCH toolkit...`);
            composio_search_toolkit = await composio.tools.get(String(userId), {
                toolkits: ['COMPOSIO_SEARCH']
            });
            console.log(`[${requestId}] ✅ COMPOSIO_SEARCH toolkit:`, Object.keys(composio_search_toolkit).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get COMPOSIO_SEARCH tools:`, error?.message);
            console.warn(`[${requestId}] COMPOSIO_SEARCH error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }

        try {
            console.log(`[${requestId}] Fetching COMPOSIO toolkit...`);
            composio_toolkit = await composio.tools.get(String(userId), {
                toolkits: ['COMPOSIO']
            });
            console.log(`[${requestId}] ✅ COMPOSIO toolkit:`, Object.keys(composio_toolkit).length, 'tools');
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get COMPOSIO tools:`, error?.message);
            console.warn(`[${requestId}] COMPOSIO error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
        }


        // Always include slide generation tool - available for all requests
        // Merge all tools including Drive and Slides
        console.log(`[${requestId}] Merging all tools...`);
        let allTools = Object.assign(
            {},
            google_sheet_tools, 
            google_docs_tools, 
            google_drive_tools,
            google_slides_tools,
            get_google_docs_tools, 
            get_google_sheets_tools,
            composio_search_toolkit, 
            composio_toolkit
        );
        const toolCountBeforeCustom = Object.keys(allTools).length;
        console.log(`[${requestId}] ✅ Merged tools count:`, toolCountBeforeCustom);
        console.log(`[${requestId}] Tool breakdown:`, {
            GOOGLESHEETS: Object.keys(google_sheet_tools).length,
            GOOGLEDOCS: Object.keys(google_docs_tools).length,
            GOOGLEDRIVE: Object.keys(google_drive_tools).length,
            GOOGLESLIDES: Object.keys(google_slides_tools).length,
            COMPOSIO_SEARCH: Object.keys(composio_search_toolkit).length,
            COMPOSIO: Object.keys(composio_toolkit).length
        });
        
        // Always add the slide generation tool (if available)
        try {
            console.log(`[${requestId}] Fetching slide generation custom tool...`);
            const customTools = await composio.tools.get(String(userId), {toolkits: [SLIDE_GENERATOR_TOOL]});
            allTools = Object.assign({}, allTools, customTools);
            console.log(`[${requestId}] ✅ Slide generation tool added. Total tools:`, Object.keys(allTools).length);
        } catch (error: any) {
            console.warn(`[${requestId}] ⚠️ Failed to get slide generation tool:`, error?.message);
            console.warn(`[${requestId}] Slide generation tool error details:`, {
                status: error?.status,
                code: error?.code,
                message: error?.message
            });
            // Continue without the custom tool - slide generation will use the built-in tool
        }
        
        console.log(`[${requestId}] Final tool count:`, Object.keys(allTools).length);
        
        let systemPrompt = `You are Super Agent, a helpful and efficient AI assistant powered by Composio. Your main goal is to assist users by using a suite of powerful tools to accomplish tasks.

**Core Principles:**
1.  **Action-Oriented:** Your primary focus is on using tools to complete user requests. While you are conversational, always look for an opportunity to take action.
2.  **Tool-First Mentality:** When a user asks for something, first consider if a tool can help. For general questions or casual chat, respond conversationally.
3.  **Think Step-by-Step:** For complex tasks, you may need to use multiple tools in a sequence. For example, to answer a question about a file, you first need to read the file.

---

**Workflow for Connected Files (Google Sheets & Docs):**

This is a critical part of your function. Follow these rules precisely.

1.  **File is Primary Context:** When a Google Sheet or Doc is connected, it is the **most important** piece of information. Assume all user questions relate to the content of that file unless they state otherwise.

2.  **Generating Presentations from Files:**
    - **Step 1: Analyze the File.** Use your tools to read and understand the data within the connected file.
    - **Step 2: Outline the Slides.** In your response, provide a clear, slide-by-slide outline of the presentation. Detail the title and key points for each slide based on your analysis.
    - **Step 3: Use the Magic Word.** After creating the slide outline, you **MUST** end your *entire* message with the special command: **[SLIDES]**

3.  **Creating and Updating Google Slides Presentations:**
    - When users ask to create Google Slides, save to Google Drive, or create presentations in Google Drive, you MUST use the GOOGLESLIDES toolkit tools.
    - Available tools include: GOOGLESLIDES_CREATE_PRESENTATION, GOOGLESLIDES_INSERT_SLIDE, GOOGLESLIDES_INSERT_TEXT, GOOGLESLIDES_GET_PRESENTATION, GOOGLESLIDES_DELETE_SLIDE, GOOGLESLIDES_UPDATE_SLIDE, and other GOOGLESLIDES tools.
    - **Creating New Presentations:** If a user requests "create a presentation in Google Drive" or "save to Google Drive", you MUST:
      1. Use GOOGLESLIDES_CREATE_PRESENTATION to create a new presentation
      2. Add slides using GOOGLESLIDES_INSERT_SLIDE for each slide
      3. Add content using GOOGLESLIDES_INSERT_TEXT
      4. Provide the Google Slides URL (format: https://docs.google.com/presentation/d/{PRESENTATION_ID}/edit)
    - **Updating Existing Presentations:** If a user provides a Google Slides URL or asks to update an existing presentation:
      1. Extract the presentation ID from the URL (format: /presentation/d/{PRESENTATION_ID}/)
      2. Use GOOGLESLIDES_GET_PRESENTATION to get the current presentation
      3. Use GOOGLESLIDES_DELETE_SLIDE to remove old slides if needed
      4. Use GOOGLESLIDES_INSERT_SLIDE to add new slides
      5. Use GOOGLESLIDES_INSERT_TEXT or GOOGLESLIDES_UPDATE_SLIDE to update content
      6. Provide the updated Google Slides URL
    - After creating or updating slides, always provide the Google Slides URL so users can access and edit the presentation.

---

Updating google docs means updating the markdown of the document/ deleting all content and adding new content.
`;

        // Build messages array with system prompt and conversation history
        console.log(`[${requestId}] Building messages array...`);
        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        // Add conversation history if available
        if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
            console.log(`[${requestId}] Adding ${conversationHistory.length} conversation history messages`);
            messages.push(...conversationHistory);
        } else {
            console.log(`[${requestId}] No conversation history provided`);
        }

        // Add current user message with Google Slides context if present
        let userMessage = prompt;
        if (slidesUrl && slidesId) {
            userMessage = `${prompt}\n\n[Google Slides URL: ${slidesUrl} | Presentation ID: ${slidesId}]`;
            console.log(`[${requestId}] Added Google Slides context to user message`);
            console.log(`[${requestId}] Presentation ID:`, slidesId);
        }
        
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        console.log(`[${requestId}] Total messages:`, messages.length);

        // Generate response with error handling
        console.log(`[${requestId}] Preparing to generate AI response...`);
        console.log(`[${requestId}] Message count:`, messages.length);
        console.log(`[${requestId}] System prompt length:`, systemPrompt.length);
        console.log(`[${requestId}] Available tools:`, Object.keys(allTools).length);
        console.log(`[${requestId}] Tool names:`, Object.keys(allTools).slice(0, 10));
        
        // Validate tools object - ensure it's not empty and is properly formatted
        if (Object.keys(allTools).length === 0) {
            console.warn(`[${requestId}] ⚠️ No tools available, proceeding without tools`);
        }
        
        let text: string;
        let toolCalls: any[] = [];
        let toolResults: any[] = [];
        
        try {
            console.log(`[${requestId}] Calling generateText with Gemini 2.5 Pro...`);
            const startTime = Date.now();
            
            // Ensure tools is properly formatted - if empty, pass undefined instead of empty object
            const toolsToUse = Object.keys(allTools).length > 0 ? allTools : undefined;
            
            const result = await generateText({
                model: google('gemini-2.5-pro'),
                system: systemPrompt,
                messages,
                tools: toolsToUse,
                maxSteps: 50,
            });
            const duration = Date.now() - startTime;
            text = result.text;
            toolCalls = result.toolCalls || [];
            toolResults = result.toolResults || [];
            console.log(`[${requestId}] ✅ AI response generated in ${duration}ms`);
            console.log(`[${requestId}] Response length:`, text?.length);
            console.log(`[${requestId}] Tool calls:`, toolCalls.length);
            console.log(`[${requestId}] Tool results:`, toolResults.length);
        } catch (error: any) {
            console.error(`[${requestId}] ❌ Error generating text:`, error);
            console.error(`[${requestId}] GenerateText error details:`, {
                message: error?.message,
                status: error?.status,
                code: error?.code,
                stack: error?.stack?.substring(0, 500)
            });
            // If it's an authentication error from Composio, provide helpful message
            if (error?.message?.includes('401') || error?.status === 401) {
                console.error(`[${requestId}] Authentication error detected, returning 401 response`);
                return createResponse({
                    response: 'Authentication error: Please ensure your Composio API key is valid and your accounts are properly connected. Visit /signin to connect your Google accounts.',
                    hasSlides: false,
                }, userId, newCookie);
            }
            // For other errors, return generic error message
            throw error; // Re-throw to be caught by outer try-catch
        }

        console.log(`[${requestId}] Checking for slide generation in tool results...`);
        const slideExecution = toolResults.find((result: any) => result.toolName === SLIDE_GENERATOR_TOOL);

        if (slideExecution) {
            console.log(`[${requestId}] ✅ Slide generation detected!`);
            const slideData = slideExecution.result.data.slides;
            console.log(`[${requestId}] Slide count:`, slideData?.length);
            console.log(`[${requestId}] ========== Request Completed Successfully (with slides) ==========`);
            return createResponse({
                response: text,
                slides: slideData,
                hasSlides: true,
            }, userId, newCookie);
        }

        console.log(`[${requestId}] No slides generated, returning text response`);
        console.log(`[${requestId}] ========== Request Completed Successfully ==========`);
        return createResponse({
            response: text,
            hasSlides: false,
        }, userId, newCookie);

    } catch (error: any) {
        console.error(`[${requestId}] ❌❌❌ SuperAgent Error ❌❌❌`);
        console.error(`[${requestId}] Error type:`, error?.constructor?.name);
        console.error(`[${requestId}] Error message:`, error?.message);
        console.error(`[${requestId}] Error status:`, error?.status);
        console.error(`[${requestId}] Error code:`, error?.code);
        console.error(`[${requestId}] Error response:`, error?.response);
        
        // Safely stringify error for logging
        try {
            const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error)).substring(0, 2000);
            console.error(`[${requestId}] Full error object:`, errorString);
        } catch (stringifyError) {
            console.error(`[${requestId}] Could not stringify error object`);
        }
        
        console.error(`[${requestId}] Stack trace:`, error?.stack?.substring(0, 1000));
        console.error(`[${requestId}] ========== Request Failed ==========`);
        
        // Check if it's an authentication error
        if (error?.status === 401 || error?.response?.status === 401 || error?.message?.includes('401')) {
            console.error(`[${requestId}] Returning 401 authentication error response`);
            return NextResponse.json(
                { 
                    error: 'Authentication failed. Please check your Composio API key and ensure your accounts are properly connected.',
                    details: 'Visit /signin to connect your Google accounts, or check your environment variables.',
                    requestId: requestId
                },
                { status: 401 }
            );
        }
        
        // Check if it's a Composio API key error
        if (error?.message?.includes('API key') || error?.message?.includes('authentication') || error?.message?.includes('COMPOSIO')) {
            console.error(`[${requestId}] Returning API key error response`);
            return NextResponse.json(
                { 
                    error: 'Composio API key error. Please verify your COMPOSIO_API_KEY environment variable is set correctly.',
                    details: error.message,
                    requestId: requestId
                },
                { status: 500 }
            );
        }
        
        // Check for missing environment variables
        if (error?.message?.includes('GOOGLE') || error?.message?.includes('API_KEY')) {
            console.error(`[${requestId}] Returning environment variable error response`);
            return NextResponse.json(
                { 
                    error: 'Missing required environment variables. Please check your Vercel environment settings.',
                    details: error.message,
                    requestId: requestId
                },
                { status: 500 }
            );
        }
        
        // Generic error
        console.error(`[${requestId}] Returning generic 500 error response`);
        return NextResponse.json(
            { 
                error: 'Failed to process your request. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error?.message : 'Check server logs for details',
                requestId: requestId
            },
            { status: 500 }
        );
    }
}