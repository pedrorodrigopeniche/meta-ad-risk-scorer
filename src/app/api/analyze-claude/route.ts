import Anthropic from '@anthropic-ai/sdk'
import type { ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a Meta Ads compliance expert specializing in prescription drug and pharmaceutical advertising policy enforcement. Your role is to analyze ad creatives (images and/or copy text) and assess their probability of rejection under Meta's advertising policies.

Focus your analysis on these violation categories:

CRITICAL RISKS (automatic rejection likely):
- Visible prescription drug products: injectable pens (Ozempic, Wegovy, Mounjaro), branded packaging, syringes
- Drug brand names or INN generic names for Rx-only medications
- "Without prescription" or "no doctor needed" messaging
- Guaranteed cure, guaranteed results, or 100% effective claims
- Before/after medical transformation imagery

HIGH RISKS (high rejection probability):
- Medical condition treatment claims without proper context
- Specific weight-loss numbers attributed to a drug (e.g., "lost 20kg with Ozempic")
- FDA/COFEPRIS approval claims used deceptively
- Price promotions for prescription medications
- Medical testimonials with specific health outcome numbers

MEDIUM RISKS (review likely):
- Disease management claims (controls diabetes, regulates blood pressure)
- Urgency combined with health claims
- Off-label use suggestions
- Natural "cure" claims for serious conditions

MITIGATING FACTORS (reduce risk):
- "Consult your doctor" disclaimers
- "Results may vary" disclosures
- "Not medical advice" statements
- General wellness framing without disease-specific claims

Scoring guide:
1-2: Clean ad, very unlikely to be rejected
3-4: Minor concerns, may pass but worth tweaking
5-6: Moderate risk, needs revision before launch
7-8: High risk, likely rejected without significant changes
9-10: Near-certain rejection, do not launch as-is

Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Exactly this structure:
{
  "claudeScore": <integer 1-10>,
  "claudeRiskLevel": "<Low|Medium|High|Very High>",
  "claudeTriggers": ["<specific trigger 1>", "<specific trigger 2>"],
  "claudeLikelyRejectionReason": "<the specific Meta policy clause most likely to trigger rejection>",
  "claudeMetaInterpretation": "<how Meta's automated review system would interpret this ad>",
  "claudeHowToFix": ["<actionable fix 1>", "<actionable fix 2>", "<actionable fix 3>"],
  "claudeSafeRewrite": "<revised version of the ad copy that significantly reduces rejection risk>",
  "claudeVerdict": "<Approved to test|Revise before testing|Do not launch>"
}`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Falta configurar ANTHROPIC_API_KEY en .env.local' },
      { status: 500 },
    )
  }

  let body: {
    adCopy?: string
    imageBase64?: string
    imageMediaType?: string
    imageFileName?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { adCopy, imageBase64, imageMediaType, imageFileName } = body

  if (!adCopy?.trim() && !imageBase64) {
    return NextResponse.json(
      { error: 'Se requiere al menos texto del anuncio o una imagen' },
      { status: 400 },
    )
  }

  const client = new Anthropic({ apiKey })

  // Build the user message content blocks
  const contentBlocks: (ImageBlockParam | TextBlockParam)[] = []

  const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
  type ValidMediaType = typeof VALID_MEDIA_TYPES[number]

  if (imageBase64 && imageMediaType) {
    // Normalise image/jpg → image/jpeg (browser may report either)
    const normalised = imageMediaType === 'image/jpg' ? 'image/jpeg' : imageMediaType
    if (!VALID_MEDIA_TYPES.includes(normalised as ValidMediaType)) {
      return NextResponse.json(
        { error: `Tipo de imagen no soportado: ${imageMediaType}` },
        { status: 400 },
      )
    }
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: normalised as ValidMediaType,
        data: imageBase64,
      },
    })
  }

  const textParts: string[] = []
  if (imageFileName) textParts.push(`Nombre del archivo de imagen: ${imageFileName}`)
  if (adCopy?.trim()) textParts.push(`Texto del anuncio (copy):\n${adCopy.trim()}`)
  if (!adCopy?.trim() && imageBase64)
    textParts.push('Analiza únicamente la imagen del anuncio proporcionada.')

  contentBlocks.push({ type: 'text', text: textParts.join('\n\n') })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // Strip markdown code fences if Claude wraps the JSON
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        { error: 'Claude devolvió una respuesta no válida', raw: rawText },
        { status: 502 },
      )
    }

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al llamar a Claude: ${message}` }, { status: 502 })
  }
}
