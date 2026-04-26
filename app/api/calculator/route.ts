import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetector, fetchOrderbook, getTopBroker, parseLot } from '@/lib/stockbit';
import { calculateTargets } from '@/lib/calculations';
import { getLatestStockQuery, getStockPriceByDate } from '@/lib/supabase';
import type { StockInput } from '@/lib/types';

type CalculatorResponse =
  | {
      success: true;
      data: {
        input: { emiten: string; fromDate: string; toDate: string };
        stockbitData: { bandar: string; barangBandar: number; rataRataBandar: number };
        marketData: {
          harga: number;
          offerTeratas: number;
          bidTerbawah: number;
          totalBid: number;
          totalOffer: number;
          fraksi: number;
        };
        calculated: {
          totalPapan: number;
          rataRataBidOfer: number;
          a: number;
          p: number;
          targetRealistis1: number;
          targetMax: number;
        };
        meta: {
          source: 'stockbit';
          generatedAt: string;
          isFromHistory?: boolean;
          historyDate?: string;
        };
      };
    }
  | { success: false; error: string; data?: null };

export async function POST(request: NextRequest) {
  try {
    const body: StockInput = await request.json();
    const { emiten, fromDate, toDate } = body;

    if (!emiten || !fromDate || !toDate) {
      const resp: CalculatorResponse = {
        success: false,
        error: 'Missing required fields: emiten, fromDate, toDate',
        data: null,
      };
      return NextResponse.json(resp, { status: 400 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = toDate === todayStr;

    const [marketDetectorData, orderbookData] = await Promise.all([
      fetchMarketDetector(emiten, fromDate, toDate),
      fetchOrderbook(emiten),
    ]);

    const brokerData = getTopBroker(marketDetectorData);

    // If Stockbit broker data isn't available, fall back to latest stored history (same behavior as /api/stock)
    if (!brokerData) {
      const historyData = await getLatestStockQuery(emiten);
      if (!historyData) {
        const resp: CalculatorResponse = {
          success: false,
          error:
            'Data broker tidak tersedia untuk periode ini (Market belum buka atau saham tidak aktif)',
          data: null,
        };
        return NextResponse.json(resp, { status: 404 });
      }

      const resp: CalculatorResponse = {
        success: true,
        data: {
          input: {
            emiten,
            fromDate: historyData.from_date,
            toDate: historyData.to_date,
          },
          stockbitData: {
            bandar: historyData.bandar,
            barangBandar: historyData.barang_bandar,
            rataRataBandar: historyData.rata_rata_bandar,
          },
          marketData: {
            harga: historyData.harga,
            offerTeratas: historyData.ara,
            bidTerbawah: historyData.arb,
            totalBid: historyData.total_bid,
            totalOffer: historyData.total_offer,
            fraksi: historyData.fraksi,
          },
          calculated: {
            totalPapan: historyData.total_papan,
            // Older stored rows use snake_case; normalize to the calculator’s camelCase contract
            rataRataBidOfer: (historyData as any).rata_rata_bid_ofer ?? historyData.rata_rata_bid_ofer,
            a: historyData.a,
            p: historyData.p,
            targetRealistis1: (historyData as any).target_realistis ?? historyData.target_realistis,
            targetMax: (historyData as any).target_max ?? historyData.target_max,
          },
          meta: {
            source: 'stockbit',
            generatedAt: new Date().toISOString(),
            isFromHistory: historyData.from_date !== fromDate || historyData.to_date !== toDate,
            historyDate: historyData.from_date,
          },
        },
      };

      return NextResponse.json(resp);
    }

    // Extract market data (orderbook)
    const obData = (orderbookData as any).data || orderbookData;
    if (!obData?.total_bid_offer || obData.close === undefined) {
      throw new Error('Invalid Orderbook API response structure');
    }

    let marketData = {
      harga: Number(obData.close),
      offerTeratas: 0,
      bidTerbawah: 0,
      totalBid: parseLot(obData.total_bid_offer.bid.lot),
      totalOffer: parseLot(obData.total_bid_offer.offer.lot),
    };

    const offerPrices = (obData.offer || []).map((o: { price: string }) => Number(o.price));
    const bidPrices = (obData.bid || []).map((b: { price: string }) => Number(b.price));
    marketData.offerTeratas = offerPrices.length > 0 ? Math.max(...offerPrices) : Number(obData.high || 0);
    marketData.bidTerbawah = bidPrices.length > 0 ? Math.min(...bidPrices) : 0;

    // For any non-today queries, override price using DB if available (same behavior as /api/stock)
    if (!isToday) {
      const histPrice = await getStockPriceByDate(emiten, toDate);
      if (histPrice) {
        marketData = {
          harga: Number(histPrice.harga),
          offerTeratas: Number(histPrice.ara),
          bidTerbawah: Number(histPrice.arb),
          totalBid: Number(histPrice.total_bid),
          totalOffer: Number(histPrice.total_offer),
        };
      }
    }

    const calculated = calculateTargets(
      brokerData.rataRataBandar,
      brokerData.barangBandar,
      marketData.offerTeratas,
      marketData.bidTerbawah,
      marketData.totalBid / 100,
      marketData.totalOffer / 100,
      marketData.harga
    );

    const resp: CalculatorResponse = {
      success: true,
      data: {
        input: { emiten, fromDate, toDate },
        stockbitData: brokerData,
        marketData: {
          ...marketData,
          fraksi: calculated.fraksi,
        },
        calculated: {
          totalPapan: calculated.totalPapan,
          rataRataBidOfer: calculated.rataRataBidOfer,
          a: calculated.a,
          p: calculated.p,
          targetRealistis1: calculated.targetRealistis1,
          targetMax: calculated.targetMax,
        },
        meta: {
          source: 'stockbit',
          generatedAt: new Date().toISOString(),
        },
      },
    };

    return NextResponse.json(resp);
  } catch (error) {
    console.error('Calculator API error:', error);
    const resp: CalculatorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate',
      data: null,
    };
    return NextResponse.json(resp, { status: 500 });
  }
}

