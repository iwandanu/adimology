# BrakotBrekot – Smart Money & Technical Assistant

Analisis AI berbasis SMC, Wyckoff, Bandarmologi, dan Analisis Teknikal (mirip SAPTA di Pulse-CLI).

## Data yang Digunakan

| Sumber | Jenis Data | Keterangan |
|--------|------------|------------|
| **Stockbit** | Broker Summary | Top buyers/sellers, detector (accdist), dari analisis Adimology |
| **Stockbit** | Bandarmology | Multi-day broker flow via `analyzeBandarmology()` – butuh token |
| **Yahoo Finance** | OHLC + Volume | Via technical analysis API |
| **Technical** | RSI, MACD, BB, ATR, Support/Resistance | Dari `lib/technical.ts` |

## Data yang Mungkin Ditambahkan (Opsional)

Berdasarkan framework prompt:

1. **Time Projection / Planetary** – Fibonacci time windows + aspek planet. Saat ini AI inferensi dari pola waktu. Bisa ditambah API astrology/planetary jika diperlukan.
2. **Order Book Depth** – Stockbit punya orderbook (bid/offer). Bisa ditambahkan untuk analisis supply/demand yang lebih dalam.
3. **Volume Profile** – Jika ada sumber data volume per level harga, akan memperkaya analisis Supply Absorption.

Data inti (Broker Summary, Bandarmology, Technical) sudah mencukupi untuk skoring 6 modul.

## Cara Pakai

1. Jalankan **Adimology** dulu (untuk broker summary)
2. Klik **BrakotBrekot** – AI akan menganalisis dengan data yang tersedia
3. Bandarmology di-fetch otomatis di background (butuh Stockbit token). Jika token tidak ada, analisis tetap jalan dengan broker summary + technical saja

## Environment Variables

- `BRAKOT_AI_MODEL` – Model Gemini untuk BrakotBrekot (opsional, default: STORY_AI_MODEL)
- `GEMINI_API_KEY` – Wajib untuk analisis AI
