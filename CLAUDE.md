# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI-powered product photography scoring system** built as a standalone HTML application. It uses Alibaba's **Qwen-VL (通义千问)** multimodal model to automatically analyze product photos and assign scores based on image quantity, quality, and shooting difficulty.

**Key Feature**: Single-file web application (`index_standalone.html`) with no backend required - runs entirely in the browser with data stored in localStorage.

## How to Run

### Development/Testing
```bash
# Open directly in browser
start index_standalone.html

# Or use the provided launcher
打开通义千问版.bat
```

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

1. **API Integration Layer** (lines 1424-2196)
   - Qwen-VL API client using OpenAI-compatible format
   - Endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
   - Model: `qwen-vl-max-latest` (vision model)
   - Supports batch processing of up to 20 images per request

2. **Image Processing Pipeline** (lines 1699-1795)
   - Automatic compression for images >5MB or >1920px
   - Quality adjustment based on file size (0.5-0.85)
   - Base64 encoding for API transmission
   - Progress tracking for batch operations

3. **Scoring System** (lines 1157-1402)
   - **Dual-dimension scoring**:
     - **Dimension 1**: Image quantity (effective images / 15 = base score)
     - **Dimension 2**: Difficulty adjustment (-0.05 to +0.3)
   - **Image folding rules**: Reduces score for duplicate angles, backup images, color variants
   - **Variant discounts**: 30-80% discount for batch/color variants

4. **Folder-Based Batch Processing** (lines 1576-1696)
   - Auto-parses folder names to extract photographer and task info
   - Supports formats: `J3-余梦芊-CLO2775（C-曹东-01.04）无动力风帽` or `张三-金属锅`
   - Automatically excludes folders with "备选/backup/alt" keywords
   - Processes multiple folders sequentially with 2-second delays

5. **Data Export** (lines 2558-2634)
   - CSV export with UTF-8 BOM for Excel compatibility
   - Groups results by photographer with statistics
   - Includes both summary and detailed records

## Key Business Logic

### Scoring Prompt (SCORING_PROMPT)
The 250-line prompt (lines 1157-1402) defines the entire scoring methodology:
- Image counting rules (backup exclusion, folding logic)
- Difficulty classifications (simple/normal/difficult/very difficult)
- Reference cases with expected scores
- Three-tiered folding rules based on total image count:
  - Small sets (≤10): Minimal folding
  - Medium sets (11-15): Conservative folding (max 1 image)
  - Large sets (>15): Strict folding for duplicates

### Image Folding Examples
- Same-angle details (3-4 shots): Fold to 1 effective image
- Color variants (same angle): First 100%, others 50%
- Standard 6-face product: 6 images = 1.5-2 effective images
- Backup images: Completely excluded (0% count)

### Variant Discount Calculation (lines 2307-2316)
```javascript
total = singleScore * variantCount * discountRate
finalScore = Math.round(total * 20) / 20  // Round to 0.05
```

## Data Structures

### localStorage Keys
- `qwen_api_key`: Encrypted API key
- `ai_scoring_records`: JSON array of scoring records

### Record Format
```javascript
{
  id: timestamp,
  date: "YYYY-MM-DD",
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
    dimension1_time: {...},
    dimension2_quantity: {...},
    dimension3_difficulty: {...},
    finalScore: {...},
    reasoning: string
  }
}
```

## Important Implementation Notes

1. **API Rate Limiting**: System adds 2-second delays between batch requests to avoid throttling
2. **Image Compression**: Large images are automatically compressed to <5MB and <1920px to speed up processing
3. **Error Handling**: Friendly Chinese error messages for common API errors (quota exceeded, rate limiting, invalid key)
4. **Folder Name Parsing**: Supports complex Chinese naming patterns with photographer extraction
5. **Backup Exclusion**: Files/folders with keywords "备选/backup/alt/替换/备用/bak" are completely ignored

## Reference Documentation

The codebase includes two markdown guides:
- `通义千问版使用说明.md`: User quick start guide (API setup, usage steps, FAQ)
- `使用指南.md`: Detailed user manual (features, scoring criteria, troubleshooting)

These documents should be consulted when modifying user-facing features or error messages.
