import type { RiskFactor } from '@/types'

interface RuleDefinition {
  id: string
  label: string
  description: string
  points: number
  category: RiskFactor['category']
  patterns: RegExp[]
}

const RULES: RuleDefinition[] = [
  // --- CRITICAL ---
  {
    id: 'rx_drug_names',
    label: 'Nombres de medicamentos Rx',
    description: 'Menciona fármacos que requieren receta médica',
    points: 3,
    category: 'critical',
    patterns: [
      /\b(ozempic|wegovy|mounjaro|zepbound|saxenda|victoza|trulicity|rybelsus)\b/i,
      /\b(lipitor|atorvastatin|crestor|rosuvastatin|zocor|simvastatin)\b/i,
      /\b(viagra|cialis|levitra|sildenafil|tadalafil|vardenafil)\b/i,
      /\b(xanax|valium|klonopin|alprazolam|diazepam|clonazepam|lorazepam)\b/i,
      /\b(adderall|ritalin|vyvanse|concerta|amphetamine|methylphenidate)\b/i,
      /\b(oxycontin|percocet|vicodin|hydrocodone|oxycodone|tramadol|fentanyl)\b/i,
      /\b(metformin|glucophage|jardiance|invokana|farxiga|januvia)\b/i,
      /\b(humira|keytruda|eliquis|xarelto|plavix|coumadin|warfarin)\b/i,
      /\b(lisinopril|amlodipine|metoprolol|atenolol|losartan|valsartan)\b/i,
      /\b(prozac|zoloft|lexapro|wellbutrin|cymbalta|effexor|fluoxetine|sertraline|escitalopram)\b/i,
      /\b(semaglutide|liraglutide|tirzepatide|dulaglutide)\b/i,
      /\b(antibiótico|antibiotic|amoxicillin|amoxicilina|azithromycin|azitromicina)\b/i,
    ],
  },
  {
    id: 'no_prescription',
    label: 'Sin receta médica',
    description: 'Sugiere obtener medicamentos sin receta o prescripción',
    points: 3,
    category: 'critical',
    patterns: [
      /sin\s+receta/i,
      /without\s+(a\s+)?prescription/i,
      /no\s+(necesitas?|requiere|hace\s+falta)\s+(receta|prescripci[oó]n)/i,
      /receta\s+no\s+requerida/i,
      /compra\s+(directa|online|en\s+l[ií]nea)\s+sin/i,
      /bypass\s+(the\s+)?doctor/i,
      /evita\s+(al\s+)?m[eé]dico/i,
    ],
  },
  {
    id: 'guaranteed_cure',
    label: 'Cura garantizada',
    description: 'Promete curar, eliminar o tratar definitivamente una enfermedad',
    points: 3,
    category: 'critical',
    patterns: [
      /cura\s+(garantizada|definitiva|total|permanente)/i,
      /guaranteed\s+(cure|treatment|results?)/i,
      /100%\s+(efectivo|eficaz|garantizado|seguro)/i,
      /elimina\s+(definitivamente|para\s+siempre|totalmente)\s+.{0,40}(enfermedad|diabetes|c[aá]ncer|tumor|dolor)/i,
      /cura\s+(la\s+)?(diabetes|c[aá]ncer|hipertensi[oó]n|artritis|alzheimer|parkinson)/i,
      /reversa?\s+(la\s+)?diabetes/i,
      /reverse[sd]?\s+diabetes/i,
    ],
  },
  // --- HIGH ---
  {
    id: 'before_after_medical',
    label: 'Antes/Después médico',
    description: 'Comparaciones antes/después con resultados de salud específicos',
    points: 2,
    category: 'high',
    patterns: [
      /antes\s+y\s+despu[eé]s/i,
      /before\s+and?\s+after/i,
      /transform[aó]\s+.{0,30}(salud|cuerpo|peso|glucosa)/i,
      /pas[eé]\s+de\s+\d+\s*(kg|lbs?|libras?|kilos?)\s+a\s+\d+/i,
      /lost?\s+\d+\s*(pounds?|lbs?|kg|kilos?)\s+in\s+\d+/i,
      /baj[eé]\s+\d+\s*(kg|kilos?|libras?)\s+en\s+\d+/i,
    ],
  },
  {
    id: 'medical_testimonials',
    label: 'Testimonios médicos',
    description: 'Testimonios con afirmaciones de resultados de salud específicos',
    points: 2,
    category: 'high',
    patterns: [
      /m[eé]dico\s+(me\s+)?(dijo|recet[oó]|recomend[oó])/i,
      /doctor\s+(told|said|recommended|prescribed)/i,
      /"?\s*ya\s+no\s+tomo\s+(medicamentos?|pastillas?|insulina)/i,
      /dej[eé]\s+de\s+(tomar|usar)\s+(medicamentos?|insulina|pastillas?)/i,
      /stopped?\s+(taking|using)\s+(medication|insulin|pills?)/i,
      /m[eé]dico\s+qued[oó]\s+asombrado/i,
      /doctors?\s+(were?\s+)?(amazed|shocked|surprised)/i,
    ],
  },
  {
    id: 'fda_misuse',
    label: 'Uso indebido de FDA/COFEPRIS',
    description: 'Referencia a aprobaciones regulatorias de forma engañosa',
    points: 2,
    category: 'high',
    patterns: [
      /aprobado\s+por\s+(la\s+)?(fda|cofepris|ema)/i,
      /fda[\s-]?approved/i,
      /fda\s+cleared/i,
      /avalado\s+por.{0,20}(gobierno|ministerio|secretar[ií]a\s+de\s+salud)/i,
      /clinically\s+(proven|tested|verified)/i,
      /cl[ií]nicamente\s+(probado|demostrado|comprobado)/i,
    ],
  },
  {
    id: 'rx_price_promotion',
    label: 'Descuentos en medicamentos Rx',
    description: 'Promociona precios o descuentos en fármacos de prescripción',
    points: 2,
    category: 'high',
    patterns: [
      /(ozempic|viagra|cialis|adderall|xanax|oxycontin|semaglutide).{0,60}(precio|precio|descuento|oferta|\$|usd|mxn)/i,
      /compra\s+(ozempic|semaglutide|wegovy|mounjaro|tirzepatide)/i,
      /order\s+(online|now).{0,40}(prescription|rx)/i,
      /generic\s+(viagra|cialis|adderall|xanax)/i,
      /gen[eé]rico\s+(barato|económico|precio)\s+(de\s+)?(viagra|cialis|adderall)/i,
    ],
  },
  // --- MEDIUM ---
  {
    id: 'health_urgency',
    label: 'Urgencia + salud',
    description: 'Combina urgencia con afirmaciones de salud',
    points: 1.5,
    category: 'medium',
    patterns: [
      /(actúa|act[uú]a|actua)\s+(ahora|ya|hoy|inmediatamente).{0,50}(salud|enfermedad|dolor|s[ií]ntoma)/i,
      /act\s+now.{0,50}(health|disease|pain|symptom)/i,
      /¡[uú]ltimas?\s+unidades?!.{0,50}(pastilla|c[aá]psula|suplemento)/i,
      /limited\s+(time|supply).{0,50}(supplement|pill|capsule|treatment)/i,
      /tiempo\s+limitado.{0,50}(tratamiento|medicamento|terapia)/i,
    ],
  },
  {
    id: 'disease_treatment_claim',
    label: 'Afirmación de tratamiento',
    description: 'Afirma tratar o controlar enfermedades específicas sin evidencia',
    points: 1.5,
    category: 'medium',
    patterns: [
      /trata\s+(la\s+)?(diabetes|hipertensi[oó]n|artritis|c[aá]ncer|depresi[oó]n|ansiedad|fibromialgia)/i,
      /treats?\s+(diabetes|hypertension|arthritis|cancer|depression|anxiety)/i,
      /controla\s+(la\s+)?glucosa/i,
      /regula\s+(la\s+)?(presi[oó]n|glucosa|colesterol)/i,
      /alivia\s+(el\s+)?(dolor\s+cr[oó]nico|artritis|fibromialgia)/i,
      /reduces?\s+(blood\s+sugar|blood\s+pressure|cholesterol)\s+(naturally|fast|quickly)/i,
    ],
  },
  {
    id: 'off_label_use',
    label: 'Uso fuera de indicación',
    description: 'Sugiere usos no aprobados de un medicamento',
    points: 1.5,
    category: 'medium',
    patterns: [
      /usa\s+(ozempic|semaglutide|wegovy)\s+para\s+(perder\s+peso|adelgazar)/i,
      /off[\s-]?label/i,
      /uso\s+no\s+aprobado/i,
      /unapproved\s+use/i,
      /(metformin|metformina)\s+para\s+(adelgazar|antienvejecimiento|longevidad)/i,
    ],
  },
  {
    id: 'natural_cure_claim',
    label: 'Cura natural sin evidencia',
    description: 'Afirma que un producto natural cura enfermedades',
    points: 1,
    category: 'medium',
    patterns: [
      /remedio\s+natural\s+para\s+(curar|tratar|eliminar).{0,40}(diabetes|c[aá]ncer|hipertensi[oó]n)/i,
      /natural\s+(cure|remedy)\s+for.{0,40}(diabetes|cancer|hypertension)/i,
      /plantas?\s+(medicinales?)?\s+(que\s+)?(cura|elimina|trata)\s+(la\s+)?(diabetes|c[aá]ncer)/i,
      /hierba\s+(milagrosa|m[aá]gica)\s+para/i,
      /miraculous?\s+herb\s+for/i,
    ],
  },
  // --- LOW ---
  {
    id: 'supplement_medical_language',
    label: 'Suplemento con lenguaje médico',
    description: 'Suplemento dietético con terminología clínica',
    points: 0.5,
    category: 'low',
    patterns: [
      /suplemento.{0,40}(cl[ií]nicamente|m[eé]dicamente|cient[ií]ficamente)/i,
      /supplement.{0,40}(clinically|medically|scientifically)/i,
      /mejora\s+(la\s+)?funci[oó]n\s+(cognitiva|cerebral|card[ií]aca)\s+en\s+\d+%/i,
    ],
  },
  {
    id: 'specific_percentage_claims',
    label: 'Afirmaciones con porcentajes específicos',
    description: 'Usa porcentajes exactos para afirmaciones de salud sin contexto científico',
    points: 0.5,
    category: 'low',
    patterns: [
      /\d+%\s+(m[aá]s\s+)?(efectivo|eficaz|r[aá]pido)\s+(que\s+)?(otros?|medicamentos?|tratamientos?)/i,
      /\d+%\s+(more\s+)?(effective|efficient|faster)\s+than/i,
      /reduce\s+(el\s+)?\d+%\s+(de\s+)?(dolor|glucosa|presi[oó]n|colesterol)/i,
    ],
  },
]

const SAFE_DISCLAIMERS: RegExp[] = [
  /consulta\s+(a\s+)?(tu\s+|un\s+)?m[eé]dico/i,
  /consult\s+(your\s+|a\s+)?doctor/i,
  /bajo\s+supervisi[oó]n\s+m[eé]dica/i,
  /under\s+medical\s+supervision/i,
  /estos?\s+resultados?\s+(pueden\s+variar|no\s+son\s+t[ií]picos)/i,
  /results?\s+(may\s+vary|are\s+not\s+typical)/i,
  /no\s+es\s+un\s+medicamento/i,
  /not\s+(a\s+)?medication/i,
  /esto\s+no\s+es\s+un\s+consejo\s+m[eé]dico/i,
  /not\s+medical\s+advice/i,
]

const IMAGE_FILENAME_KEYWORDS = [
  'pluma',
  'plumas',
  'ozempic',
  'wegovy',
  'saxenda',
  'mounjaro',
  'caja',
  'medicamento',
  'injection',
  'pen',
]

export interface ScoreResult {
  score: number
  riskFactors: import('@/types').RiskFactor[]
  rawPoints: number
  hasDisclaimers: boolean
}

export function scoreAd(content: string, imageFileName?: string): ScoreResult {
  let rawPoints = 0
  const detectedFactors: import('@/types').RiskFactor[] = []
  const seen = new Set<string>()

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(content)) {
        if (!seen.has(rule.id)) {
          seen.add(rule.id)
          rawPoints += rule.points
          detectedFactors.push({
            id: rule.id,
            label: rule.label,
            description: rule.description,
            points: rule.points,
            category: rule.category,
          })
        }
        break
      }
    }
  }

  // Score image filename keywords
  if (imageFileName) {
    const nameLower = imageFileName.toLowerCase()
    const matched = IMAGE_FILENAME_KEYWORDS.filter((kw) => nameLower.includes(kw))
    if (matched.length > 0) {
      // 1 match → +1.5 pts, each additional match → +1 pt more (aggressive stacking)
      const imagePoints = 1.5 + (matched.length - 1) * 1
      rawPoints += imagePoints
      detectedFactors.push({
        id: 'image_filename_risk',
        label: 'Nombre de imagen sospechoso',
        description: `El nombre del archivo contiene: ${matched.join(', ')}`,
        points: imagePoints,
        category: matched.length >= 3 ? 'critical' : matched.length >= 2 ? 'high' : 'medium',
      })
    }
  }

  const hasDisclaimers = SAFE_DISCLAIMERS.some((p) => p.test(content))
  if (hasDisclaimers && rawPoints > 0) {
    rawPoints = Math.max(0, rawPoints - 1)
  }

  // Normalize to 1–10
  // Max theoretical raw score ~18 pts → maps to 10
  const MAX_RAW = 18
  const normalized = Math.min(10, Math.max(1, Math.round((rawPoints / MAX_RAW) * 9) + 1))
  const score = rawPoints === 0 ? 1 : normalized

  return { score, riskFactors: detectedFactors, rawPoints, hasDisclaimers }
}

export function getRiskLevel(score: number): { label: string; color: string } {
  if (score <= 3) return { label: 'Bajo', color: 'green' }
  if (score <= 6) return { label: 'Medio', color: 'yellow' }
  return { label: 'Alto', color: 'red' }
}
