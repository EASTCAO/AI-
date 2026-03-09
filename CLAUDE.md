# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI-powered product photography scoring system** built as a standalone HTML application. It uses Alibaba's **Qwen-VL (通义千问)** multimodal model to automatically analyze product photos and assign scores based on image quantity, quality, and shooting difficulty.

**Key Feature**: Single-file web application (`index_standalone.html`) with no backend required - runs entirely in the browser with data stored in localStorage.

## How to Run

### Mode 1: Standalone (no backend)
```bash
# Open directly in browser (API key stored in localStorage)
start index_standalone.html

# Or use the provided launcher
打开通义千问版.bat
```

### Mode 2: Node.js Backend Server
```bash
# Install dependencies
npm install

# Create .env from example and add your API key
cp .env.example .env

# Start server (runs on port 3000)
npm start
# Then open http://localhost:3000
```

The backend (`server.js`) is an Express proxy that stores the `QWEN_API_KEY` env var server-side, hiding it from the browser. It serves `index_standalone.html` as a static file and proxies API calls via `POST /api/qwen`. This mode is used for Zeabur cloud deployment (see `DEPLOY.md`).

The system requires:
1. A Qwen API key from Alibaba Cloud (https://bailian.console.aliyun.com/#/api-key)
2. Modern browser with localStorage support
3. Internet connection to call Qwen API

## Architecture

### Single-File Application Design
- **No build process**: Pure HTML/CSS/JavaScript
- **No dependencies**: No frameworks, no npm packages
- **No backend**: All logic runs client-side
- **Data storage**: Browser localStorage for API keys and scoring records
- **Image processing**: Canvas API for client-side image compression

### Core Components (all in `index_standalone.html`)

1. **API Integration Layer** (lines 2227-2234, 3095-3234)
   - Qwen-VL API client using OpenAI-compatible format
   - Endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
   - Model: `qwen-vl-plus` (vision model)
   - Supports batch processing of up to 20 images per request
   - Error handling with friendly Chinese messages for common API errors

2. **Image Processing Pipeline** (lines 2379-2678)
   - Automatic compression for images >5MB or >1920px
   - Quality adjustment based on file size (0.5-0.85)
   - Base64 encoding for API transmission
   - Progress tracking for batch operations with visual progress bar
   - Lazy loading with IntersectionObserver for large image sets

3. **Scoring System** (lines 1926-2100)
   - **Core logic**: Time-based estimation (1 point ≈ 1.3 hours shooting time)
   - **Score range**: 0.1 ~ 3.0 points
   - **Image folding rules**: Same angle/micro-adjustment → 1 image; 1 scene image ≈ 3 white bg images in time
   - **Variant discounts**: 30-100% discount for batch/color variants (user-configurable)

4. **Folder-Based Batch Processing** (lines 2417-2580, 2981-3093)
   - Auto-parses folder names to extract photographer and task info
   - Supports formats:
     - `J3-余梦芊-CLO2775（C-曹东-01.04）无动力风帽`
     - `张三-DAG0494`
     - `J1_苏贤佩_HUI3162_（C级-佳宝-1.4）梅花星形混凝土插扣固定钉`
   - Automatically excludes folders with "备选/backup/alt/替换/备用/bak" keywords
   - Processes multiple folders sequentially with 2-second delays
   - Detects batch variants and prompts user for discount rate

5. **Data Export** (lines 3671-3701)
   - CSV export with UTF-8 BOM for Excel compatibility
   - Three-column format: 摄影师, SKU, 评分
   - Exports only today's records
   - Filename format: `AI评分汇总_YYYY-MM-DD.csv`

## Key Business Logic

### Scoring Prompt (SCORING_PROMPT)
The prompt (lines 1926-2100) defines the **time-based scoring methodology** (2025.2 updated version from PDF):

**Scoring System (Time-Based)**:
- **Core principle**: Estimate shooting time → map to score (1 point = ~1.3 hours)
- **Score range**: 0.1 ~ 3.0 points
- **Score tiers by time**:
  - ≤5 min → 0.10 (extremely simple)
  - 5~10 min → 0.20 (simple, few images)
  - 10~20 min → 0.25 (simple, with 1 scene image)
  - 15~30 min → 0.30~0.50 (simple batch or few images)
  - 40~60 min → 0.75 (below standard)
  - ~1 hour → 1.00 (standard: 15~20 images, 1~2 scenes, normal difficulty)
  - ~1.5 hours → 1.25 (large/assembly needed/metal-heavy)
  - ~1.5~2 hours → 1.50 (gift sets, many products, longer assembly)
  - ~2 hours → 2.50 (gift sets + handcraft + special effects)
  - ≥3 hours → 3.00 (lighting products, outdoor shooting)
- **Complexity bonus**: +0.1 ~ +0.5 for assembly, lighting, large items, outdoor, etc.
- **AI composite bonus**: +0.1~0.25/image for AI-assisted composite images
- **Score limits**: Regular ≤1.5, Gift sets ≤2.5, Extreme ≤3.0

**Key Changes from Previous Version**:
1. Core scoring is time-based estimation, NOT image count formula
2. Scene images contribute to time estimate (1 scene ≈ 3 white bg images in time)
3. Score range extended: 0.1~3.0 (was 0.25~2.0)
4. Deductions allowed for very simple tasks (0.1~0.75)
5. More nuanced complexity bonus tiers (up to +0.5 for extreme cases)
6. AI composite images can earn separate bonus points

### Image Folding Examples
- Same-angle details (3-4 shots): Fold to 1 effective image
- Color variants (same angle): First 100%, others 30-40%
- Standard 6-face product: 6 images = 1-1.5 effective images
- Backup images: Completely excluded (0% count, not in any statistics)
- **Scene images**: Give fixed +0.25 bonus if valid (no longer counted as 2x effective images)

### Variant Discount Calculation (lines 3334-3342)
```javascript
function calculateVariantScore(single, count, variantType, discountRate) {
    if (count <= 1) return single;
    const total = single * count * discountRate;
    return Math.round(total * 20) / 20;  // Round to 0.05
}
```

### Manual Score Adjustment (lines 3612-3669)
Users can click on the displayed score to manually adjust it. The system:
- Records the original AI score and manual adjustment
- Rounds to 0.05 precision
- Appends adjustment note to reasoning text
- Sets `manuallyAdjusted` flag in currentResult

## Data Structures

### localStorage Keys
- `qwen_api_key`: API key stored as plain text (not encrypted)
- `ai_scoring_records`: JSON array of scoring records

### Record Format
```javascript
{
  id: timestamp,
  date: "YYYY-MM-DD",
  time: "HH:MM:SS",
  photographer: string,
  taskName: string,
  imageCount: number,
  singleScore: number,  // Score before variants
  finalScore: number,   // Final score after variant discount
  variantCount: number,
  variantType: "single" | "normal" | "color" | "batch",
  discountRate: 0.3-1.0,
  discountReason: string,
  details: {
    dimension1_baseScore: {
      totalImages: number,
      backupImages: number,
      sceneImages: number,
      whiteBackgroundImages: number,
      foldedWhiteImages: number,  // How many images reduced by folding
      effectiveWhiteImages: number,
      baseScoreRange: string,  // e.g. "0.50-0.65"
      baseScore: number,
      baseScoreReason: string
    },
    dimension2_sceneBonus: {
      hasValidScene: boolean,
      sceneBonus: number,  // 0 or 0.25
      sceneBonusReason: string
    },
    dimension3_complexity: {
      level: string,
      productType: string,
      complexityFactors: array,
      complexityBonus: number,  // 0, 0.1, 0.2, or 0.3
      complexityReason: string
    },
    finalScore: {
      calculatedScore: number,
      scoreLimit: number,  // 1.5 or 2.0
      suggestedScore: number,
      calculation: string,
      breakdown: string
    },
    sceneImages: number,
    sceneQuality: string,
    qualityScore: number,
    reasoning: string
  }
}
```

## Important Implementation Notes

1. **API Rate Limiting**: System adds 2-second delays between batch requests to avoid throttling (line 3068)
2. **Image Compression**: Large images are automatically compressed to <5MB and <1920px to speed up processing
   - Progressive quality reduction: Starts at 0.85, can go down to 0.5
   - Dimension scaling if exceeds 1920px on any side
   - Compression ratio logging for files >10% reduction
3. **Error Handling**: Friendly Chinese error messages for common API errors
   - Invalid/expired API key: "❌ API Key无效或账户欠费"
   - Rate limiting: "❌ 请求过于频繁，请稍后再试（建议等待1分钟）"
   - Invalid parameters: "❌ 图片格式或大小不符合要求"
4. **Folder Name Parsing**: Supports complex Chinese naming patterns with photographer extraction
   - Normalizes underscores to hyphens for unified parsing
   - Extracts photographer from bracket notation: `（C-曹东-01.04）` → "曹东"
   - Extracts SKU from third segment before brackets
   - Fallback to simple format: `摄影师名-SKU`
5. **Backup Exclusion**: Files/folders with keywords "备选/backup/alt/替换/备用/bak" are completely ignored
   - Folder-level exclusion happens during file grouping (lines 2451-2467)
   - File-level backup detection by filename keywords
   - Excluded folders are logged to console with matched keyword
6. **Lazy Loading**: IntersectionObserver API for efficient image preview
   - First 3 images per folder loaded immediately
   - First 20 images in single-file mode loaded immediately
   - Remaining images loaded when scrolled into view
   - 50px root margin for preloading before visibility
7. **Batch Variant Detection**: Automatically detects if folders share same photographer
   - Prompts user to confirm if they are variants (lines 2994-3024)
   - Suggests discount rates: 0.7 for colors, 0.6 for series, 0.5 for bulk, etc.
   - Applies discount uniformly across all folders in batch

## UI/UX Features

1. **Progress Indicators**:
   - Top progress bar for image processing (lines 1472-1555)
   - Hourglass loading animation for AI analysis (lines 1136-1277)
   - Dynamic loading text with gradient animation

2. **Score Reference Table**: Collapsible quick reference (lines 1633-1719)
   - 12 score ranges from 0.1-0.2 up to 3+
   - Time estimates and typical characteristics
   - Scoring tips for folding rules and discounts

3. **Interactive Elements**:
   - Click score to manually adjust (lines 3612-3669)
   - Drag-and-drop upload support
   - Folder expansion for large image sets
   - Horizontal scroll with Shift+wheel

4. **Export Format**: Simplified CSV with 3 columns only
   - 摄影师 (Photographer)
   - SKU (Task Name)
   - 评分 (Score)
   - UTF-8 BOM for Excel compatibility

## Reference Documentation

The codebase includes two markdown guides:
- `通义千问版使用说明.md`: User quick start guide (API setup, usage steps, FAQ)
- `使用指南.md`: Detailed user manual (features, scoring criteria, troubleshooting)

These documents should be consulted when modifying user-facing features or error messages.

## Development & Debugging

### Testing the Application
Since this is a pure client-side HTML application:
1. Open `index_standalone.html` directly in a browser
2. Use browser DevTools (F12) to inspect console logs and network requests
3. Check localStorage in Application tab for stored data

### Key Console Outputs
The application logs important information to console:
- API Key status: Masked key display (first 8 + last 4 characters)
- Folder detection: Lists recognized folders with photographer/SKU
- Image compression: Logs files compressed with before/after sizes
- Backup exclusion: Warns when folders are excluded with matched keywords

### Common Modifications

**Changing the AI Model:**
Line 3128: `model: 'qwen-vl-plus'` - Can change to 'qwen-vl-max' for higher accuracy

**Adjusting Scoring Logic:**
Lines 1926-2204: Modify `SCORING_PROMPT` constant to change scoring rules

**Changing Compression Thresholds:**
Lines 2585-2586: Adjust `maxSize` (5MB) and `maxDimension` (1920px)

**Modifying Variant Discount Defaults:**
Lines 2936-2941: Change default discount rates for color/batch variants

### Data Recovery
If user accidentally clears localStorage:
- API keys cannot be recovered (must re-enter)
- Scoring records are lost unless exported to CSV
- Recommend users export daily as backup

### Browser Compatibility
Requires modern browser features:
- LocalStorage API
- Canvas API for image compression
- IntersectionObserver API for lazy loading
- ES6+ JavaScript (arrow functions, template literals, etc.)
- Fetch API for network requests

### Updating Version Numbers
When bumping the version, update **3 locations** in `index_standalone.html`:
1. `<title>` tag (line ~6)
2. `<span class="version-badge">` in the header (line ~1467)
3. `<span class="version-number">` and update date in the footer (line ~1760-1762)

Also update `CHANGELOG.md` with the new version entry.

### Git Commit Conventions
```
feat: 添加XX功能
fix: 修复XX问题
docs: 更新XX文档
style: 优化XX样式
perf: 优化XX性能
```
