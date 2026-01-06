import { NextRequest, NextResponse } from "next/server";
import { Composio } from '@composio/core';
import { VercelProvider } from "@composio/vercel";

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
});

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || req.cookies.get('googlesheet_user_id')?.value || 
                      req.cookies.get('googledoc_user_id')?.value;

        if (!userId) {
            return NextResponse.json({
                error: 'No userId provided. Please provide userId as query parameter or ensure you have a cookie set.',
                suggestion: 'Visit /signin to connect your accounts first.'
            }, { status: 400 });
        }

        // Get all connected accounts for this userId
        let connectedAccounts: any[] = [];
        try {
            const accountsList = await composio.connectedAccounts.list({
                userId: userId
            });
            connectedAccounts = Array.isArray(accountsList) ? accountsList : [];
        } catch (error: any) {
            console.error('Error listing accounts:', error);
            // Try alternative method - get accounts by checking toolkits
        }

        // Check which toolkits are available
        const toolkitsToCheck = ['GOOGLESHEETS', 'GOOGLEDOCS', 'GOOGLEDRIVE', 'GOOGLESLIDES'];
        const toolkitStatus: Record<string, any> = {};

        for (const toolkit of toolkitsToCheck) {
            try {
                const tools = await composio.tools.get(userId, {
                    toolkits: [toolkit],
                    limit: 1
                });
                toolkitStatus[toolkit] = {
                    available: Object.keys(tools).length > 0,
                    toolCount: Object.keys(tools).length,
                    tools: Object.keys(tools).slice(0, 5) // First 5 tool names
                };
            } catch (error: any) {
                toolkitStatus[toolkit] = {
                    available: false,
                    error: error.message || 'Failed to get tools'
                };
            }
        }

        // Get detailed account information
        const accountDetails = connectedAccounts.map((account: any) => ({
            accountId: account.id,
            userId: account.userId,
            status: account.status,
            authConfigId: account.authConfigId,
            toolkitSlug: account.toolkitSlug,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt
        }));

        return NextResponse.json({
            success: true,
            userId: userId,
            connectedAccounts: {
                total: connectedAccounts.length,
                accounts: accountDetails
            },
            toolkitStatus: toolkitStatus,
            summary: {
                googleSheets: toolkitStatus.GOOGLESHEETS?.available || false,
                googleDocs: toolkitStatus.GOOGLEDOCS?.available || false,
                googleDrive: toolkitStatus.GOOGLEDRIVE?.available || false,
                googleSlides: toolkitStatus.GOOGLESLIDES?.available || false
            },
            recommendations: generateRecommendations(connectedAccounts, toolkitStatus)
        });

    } catch (error) {
        console.error('Connection check error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check connections',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function generateRecommendations(accounts: any[], toolkitStatus: Record<string, any>): string[] {
    const recommendations: string[] = [];
    
    const hasSheets = toolkitStatus.GOOGLESHEETS?.available;
    const hasDocs = toolkitStatus.GOOGLEDOCS?.available;
    const hasDrive = toolkitStatus.GOOGLEDRIVE?.available;
    const hasSlides = toolkitStatus.GOOGLESLIDES?.available;

    if (!hasSheets) {
        recommendations.push('Google Sheets toolkit is not available. Connect Google Sheets account.');
    }
    if (!hasDocs) {
        recommendations.push('Google Docs toolkit is not available. Connect Google Docs account.');
    }
    if (!hasDrive) {
        recommendations.push('Google Drive toolkit is not available. You may need to connect Google Drive separately.');
    }
    if (!hasSlides) {
        recommendations.push('Google Slides toolkit is not available. You may need to connect Google Slides separately.');
    }

    if (accounts.length === 0) {
        recommendations.push('No connected accounts found. Visit /signin to connect your Google accounts.');
    }

    if (hasDrive && !hasSheets && !hasDocs) {
        recommendations.push('Google Drive is connected but Sheets/Docs toolkits are not available. The app may need to use GOOGLEDRIVE toolkit instead.');
    }

    return recommendations;
}

