import { chromium, Browser, Page, BrowserContext } from "playwright";
import Anthropic from "@anthropic-ai/sdk";
import { ProxyAgent } from "proxy-agent";
import { VectorService } from "../services/vector-service";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface LinkedInCredentials {
    email: string;
    password: string;
    sessionCookie?: string;
}

interface ProspectProfile {
    name: string;
    title: string;
    company: string;
    location: string;
    profileUrl: string;
    recentPosts: string[];
    about?: string;
}

interface OutreachResult {
    success: boolean;
    prospectName: string;
    profileUrl: string;
    message: string;
    error?: string;
}

export class LinkedInAgent {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private credentials: LinkedInCredentials;
    private proxyUrl?: string;
    private rateLimiter: RateLimiter;

    constructor(credentials: LinkedInCredentials, proxyUrl?: string) {
        this.credentials = credentials;
        this.proxyUrl = proxyUrl;
        this.rateLimiter = new RateLimiter();
    }

    /**
     * Initialize browser with anti-detection measures
     */
    async initialize(): Promise<void> {
        const launchOptions: any = {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--disable-blink-features=AutomationControlled",
            ],
        };

        // Add proxy if provided
        if (this.proxyUrl) {
            launchOptions.proxy = {
                server: this.proxyUrl,
            };
        }

        this.browser = await chromium.launch(launchOptions);

        // Create context with realistic user agent and viewport
        this.context = await this.browser.newContext({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport: { width: 1920, height: 1080 },
            locale: "en-US",
            timezoneId: "America/New_York",
            permissions: [],
            geolocation: { latitude: 40.7128, longitude: -74.006 }, // New York
        });

        // Add stealth scripts to avoid detection
        await this.context.addInitScript(() => {
            // Override navigator.webdriver
            Object.defineProperty(navigator, "webdriver", {
                get: () => undefined,
            });

            // Override plugins
            Object.defineProperty(navigator, "plugins", {
                get: () => [1, 2, 3, 4, 5],
            });

            // Override languages
            Object.defineProperty(navigator, "languages", {
                get: () => ["en-US", "en"],
            });
        });

        this.page = await this.context.newPage();
    }

    /**
     * Login to LinkedIn
     */
    async login(): Promise<boolean> {
        if (!this.page) throw new Error("Browser not initialized");

        try {
            // If we have a session cookie, use it
            if (this.credentials.sessionCookie) {
                await this.context!.addCookies([
                    {
                        name: "li_at",
                        value: this.credentials.sessionCookie,
                        domain: ".linkedin.com",
                        path: "/",
                        httpOnly: true,
                        secure: true,
                        sameSite: "None",
                    },
                ]);

                await this.page.goto("https://www.linkedin.com/feed/", {
                    waitUntil: "networkidle",
                });

                // Check if we're logged in
                const isLoggedIn = await this.page
                    .locator('a[href*="/mynetwork/"]')
                    .isVisible({ timeout: 5000 })
                    .catch(() => false);

                if (isLoggedIn) return true;
            }

            // Otherwise, perform login
            await this.page.goto("https://www.linkedin.com/login", {
                waitUntil: "networkidle",
            });

            await this.randomDelay(1000, 2000);

            // Fill in credentials with human-like typing
            await this.humanType(
                this.page.locator('input[name="session_key"]'),
                this.credentials.email
            );
            await this.randomDelay(500, 1000);

            await this.humanType(
                this.page.locator('input[name="session_password"]'),
                this.credentials.password
            );
            await this.randomDelay(500, 1000);

            // Click login button
            await this.page.locator('button[type="submit"]').click();
            await this.page.waitForLoadState("networkidle");

            // Check for 2FA or security challenge
            const has2FA = await this.page
                .locator('input[name="pin"]')
                .isVisible({ timeout: 3000 })
                .catch(() => false);

            if (has2FA) {
                throw new Error(
                    "2FA required - please provide session cookie instead"
                );
            }

            // Verify login success
            const isLoggedIn = await this.page
                .locator('a[href*="/mynetwork/"]')
                .isVisible({ timeout: 10000 })
                .catch(() => false);

            if (!isLoggedIn) {
                throw new Error("Login failed - check credentials");
            }

            // Save session cookie for future use
            const cookies = await this.context!.cookies();
            const sessionCookie = cookies.find((c) => c.name === "li_at");
            if (sessionCookie) {
                this.credentials.sessionCookie = sessionCookie.value;
            }

            return true;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    }

    /**
     * Search Sales Navigator and get prospects
     */
    async searchProspects(
        savedSearchUrl: string,
        limit: number = 50
    ): Promise<ProspectProfile[]> {
        if (!this.page) throw new Error("Browser not initialized");

        await this.rateLimiter.waitIfNeeded();

        const prospects: ProspectProfile[] = [];

        try {
            await this.page.goto(savedSearchUrl, { waitUntil: "networkidle" });
            await this.randomDelay(2000, 4000);

            // Scroll to load more results
            await this.scrollPage(3);

            // Get all prospect cards
            const prospectCards = await this.page
                .locator(".artdeco-entity-lockup")
                .all();

            for (let i = 0; i < Math.min(prospectCards.length, limit); i++) {
                const card = prospectCards[i];

                try {
                    const name =
                        (await card
                            .locator(".artdeco-entity-lockup__title")
                            .textContent()) || "";
                    const title =
                        (await card
                            .locator(".artdeco-entity-lockup__subtitle")
                            .textContent()) || "";
                    const profileLink = await card
                        .locator("a")
                        .first()
                        .getAttribute("href");

                    if (!profileLink) continue;

                    const profileUrl = profileLink.startsWith("http")
                        ? profileLink
                        : `https://www.linkedin.com${profileLink}`;

                    prospects.push({
                        name: name.trim(),
                        title: title.trim(),
                        company: "", // Will be filled when scraping profile
                        location: "",
                        profileUrl,
                        recentPosts: [],
                    });

                    await this.randomDelay(500, 1500);
                } catch (error) {
                    console.error("Error extracting prospect:", error);
                    continue;
                }
            }

            return prospects;
        } catch (error) {
            console.error("Error searching prospects:", error);
            return prospects;
        }
    }

    /**
     * Scrape detailed profile information
     */
    async scrapeProfile(profileUrl: string): Promise<ProspectProfile | null> {
        if (!this.page) throw new Error("Browser not initialized");

        await this.rateLimiter.waitIfNeeded();

        try {
            await this.page.goto(profileUrl, { waitUntil: "networkidle" });
            await this.randomDelay(2000, 4000);

            const name =
                (await this.page
                    .locator("h1.text-heading-xlarge")
                    .textContent()
                    .catch(() => "")) || "";

            const title =
                (await this.page
                    .locator(".text-body-medium")
                    .first()
                    .textContent()
                    .catch(() => "")) || "";

            const location =
                (await this.page
                    .locator(".text-body-small.inline")
                    .textContent()
                    .catch(() => "")) || "";

            const about =
                (await this.page
                    .locator("#about ~ div")
                    .textContent()
                    .catch(() => "")) || "";

            // Get recent posts
            const recentPosts = await this.scrapeRecentPosts(profileUrl);

            // Extract company from title or experience section
            const company = title.split(" at ")[1] || "";

            return {
                name: name.trim(),
                title: title.trim(),
                company: company.trim(),
                location: location.trim(),
                profileUrl,
                recentPosts,
                about: about.trim(),
            };
        } catch (error) {
            console.error("Error scraping profile:", error);
            return null;
        }
    }

    /**
     * Scrape recent posts from profile
     */
    async scrapeRecentPosts(profileUrl: string): Promise<string[]> {
        if (!this.page) throw new Error("Browser not initialized");

        const posts: string[] = [];

        try {
            // Navigate to activity page
            const activityUrl = `${profileUrl}/recent-activity/all/`;
            await this.page.goto(activityUrl, { waitUntil: "networkidle" });
            await this.randomDelay(2000, 3000);

            // Get post content
            const postElements = await this.page
                .locator(".feed-shared-update-v2__description")
                .all();

            for (let i = 0; i < Math.min(postElements.length, 3); i++) {
                const postText = await postElements[i].textContent();
                if (postText) {
                    posts.push(postText.trim());
                }
            }
        } catch (error) {
            console.error("Error scraping posts:", error);
        }

        return posts;
    }

    /**
     * Generate personalized message using Claude
     */
    async generateMessage(
        prospect: ProspectProfile,
        knowledgeBase: string[],
        userId?: string,
        sourceIds?: string[]
    ): Promise<string> {
        let context = knowledgeBase.join("\n\n");

        // If we have vector search capabilities, use them
        if (userId && sourceIds && sourceIds.length > 0) {
            const query = `${prospect.title} at ${prospect.company}. ${prospect.about || ""} ${prospect.recentPosts.join(" ")}`;
            const relevantChunks = await VectorService.findSimilarChunks(query, userId, sourceIds, 3);
            if (relevantChunks.length > 0) {
                context = relevantChunks.join("\n\n");
            }
        }

        const prompt = `You are a sales professional writing a personalized LinkedIn connection request message.

Prospect Information:
- Name: ${prospect.name}
- Title: ${prospect.title}
- Company: ${prospect.company}
- Location: ${prospect.location}
- About: ${prospect.about || "N/A"}
- Recent Posts: ${prospect.recentPosts.join(" | ") || "N/A"}

Company/Product Context:
${context}

Write a personalized connection request message (max 300 characters) that:
1. References something specific from their profile or posts
2. Explains why you're reaching out
3. Provides clear value
4. Ends with a soft call-to-action
5. Sounds natural and conversational (not salesy)

Message:`;

        try {
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 500,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            const message =
                response.content[0].type === "text" ? response.content[0].text : "";

            // Ensure message is under 300 characters
            return message.substring(0, 300);
        } catch (error) {
            console.error("Error generating message:", error);
            return `Hi ${prospect.name.split(" ")[0]}, I came across your profile and would love to connect!`;
        }
    }

    /**
     * Send connection request with message
     */
    async sendConnectionRequest(
        profileUrl: string,
        message: string
    ): Promise<boolean> {
        if (!this.page) throw new Error("Browser not initialized");

        await this.rateLimiter.waitIfNeeded();

        try {
            await this.page.goto(profileUrl, { waitUntil: "networkidle" });
            await this.randomDelay(2000, 3000);

            // Click "Connect" button
            const connectButton = this.page.locator(
                'button:has-text("Connect"), button[aria-label*="Connect"]'
            );
            await connectButton.click();
            await this.randomDelay(1000, 2000);

            // Click "Add a note"
            const addNoteButton = this.page.locator('button:has-text("Add a note")');
            const hasAddNote = await addNoteButton.isVisible({ timeout: 2000 }).catch(() => false);

            if (hasAddNote) {
                await addNoteButton.click();
                await this.randomDelay(500, 1000);

                // Type message
                const messageInput = this.page.locator('textarea[name="message"]');
                await this.humanType(messageInput, message);
                await this.randomDelay(1000, 2000);
            }

            // Click "Send" button
            const sendButton = this.page.locator('button[aria-label="Send now"]');
            await sendButton.click();
            await this.randomDelay(2000, 3000);

            return true;
        } catch (error) {
            console.error("Error sending connection request:", error);
            return false;
        }
    }

    /**
     * Run full outreach campaign
     */
    async runCampaign(
        savedSearchUrl: string,
        knowledgeBase: string[],
        dailyLimit: number = 50,
        userId?: string,
        sourceIds?: string[]
    ): Promise<OutreachResult[]> {
        const results: OutreachResult[] = [];

        try {
            // Initialize and login
            await this.initialize();
            const loggedIn = await this.login();

            if (!loggedIn) {
                throw new Error("Failed to login to LinkedIn");
            }

            // Search for prospects
            console.log("Searching for prospects...");
            const prospects = await this.searchProspects(savedSearchUrl, dailyLimit);
            console.log(`Found ${prospects.length} prospects`);

            // Process each prospect
            for (const prospect of prospects) {
                try {
                    console.log(`Processing: ${prospect.name}`);

                    // Scrape full profile
                    const fullProfile = await this.scrapeProfile(prospect.profileUrl);
                    if (!fullProfile) {
                        results.push({
                            success: false,
                            prospectName: prospect.name,
                            profileUrl: prospect.profileUrl,
                            message: "",
                            error: "Failed to scrape profile",
                        });
                        continue;
                    }

                    // Generate personalized message
                    const message = await this.generateMessage(
                        fullProfile,
                        knowledgeBase,
                        userId,
                        sourceIds
                    );

                    // Send connection request
                    const sent = await this.sendConnectionRequest(
                        fullProfile.profileUrl,
                        message
                    );

                    results.push({
                        success: sent,
                        prospectName: fullProfile.name,
                        profileUrl: fullProfile.profileUrl,
                        message,
                        error: sent ? undefined : "Failed to send request",
                    });

                    // Random delay between prospects (5-15 minutes)
                    await this.randomDelay(300000, 900000);
                } catch (error: any) {
                    console.error(`Error processing ${prospect.name}:`, error);
                    results.push({
                        success: false,
                        prospectName: prospect.name,
                        profileUrl: prospect.profileUrl,
                        message: "",
                        error: error.message,
                    });
                }
            }
        } catch (error) {
            console.error("Campaign error:", error);
        } finally {
            await this.cleanup();
        }

        return results;
    }

    /**
     * Human-like typing
     */
    private async humanType(locator: any, text: string): Promise<void> {
        for (const char of text) {
            await locator.type(char);
            await this.randomDelay(50, 150);
        }
    }

    /**
     * Random delay to mimic human behavior
     */
    private async randomDelay(min: number, max: number): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     * Scroll page to load dynamic content
     */
    private async scrollPage(times: number = 3): Promise<void> {
        if (!this.page) return;

        for (let i = 0; i < times; i++) {
            await this.page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            await this.randomDelay(1000, 2000);
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        if (this.page) await this.page.close();
        if (this.context) await this.context.close();
        if (this.browser) await this.browser.close();
    }
}

/**
 * Rate limiter to prevent LinkedIn from detecting automation
 */
class RateLimiter {
    private lastRequest: number = 0;
    private requestCount: number = 0;
    private readonly minDelay: number = 3000; // 3 seconds
    private readonly maxRequestsPerHour: number = 20;

    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;

        // Enforce minimum delay
        if (timeSinceLastRequest < this.minDelay) {
            await new Promise((resolve) =>
                setTimeout(resolve, this.minDelay - timeSinceLastRequest)
            );
        }

        // Reset counter every hour
        if (timeSinceLastRequest > 3600000) {
            this.requestCount = 0;
        }

        // Check hourly limit
        if (this.requestCount >= this.maxRequestsPerHour) {
            const waitTime = 3600000 - timeSinceLastRequest;
            console.log(`Rate limit reached. Waiting ${waitTime / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            this.requestCount = 0;
        }

        this.lastRequest = Date.now();
        this.requestCount++;
    }
}
