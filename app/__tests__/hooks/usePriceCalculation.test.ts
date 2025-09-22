import { renderHook, act } from '@testing-library/react-native';
import { usePriceCalculation, calculateBookingPrice } from '@/hooks/usePriceCalculation';

describe('usePriceCalculation', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePriceCalculation());

    expect(result.current.calculatedPrice).toBe(0);
    expect(result.current.proFee).toBe(0);
    expect(result.current.platformFee).toBe(0);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  describe('calculatePrices', () => {
    it('should calculate prices correctly for 9 holes', () => {
      const { result } = renderHook(() => usePriceCalculation());

      const prices = result.current.calculatePrices({
        numberOfPlayers: 2,
        holes: 9,
      });

      // Base price: 15€/player/9holes * 2 players = 30€ → MIN 50€
      // Platform fee: 50€ * 20% = 10€
      // Total: 50€ + 10€ = 60€
      expect(prices.proFee).toBe(50);
      expect(prices.platformFee).toBe(10);
      expect(prices.calculatedPrice).toBe(60);
      expect(prices.totalAmount).toBe(60);
    });

    it('should calculate prices correctly for 18 holes', () => {
      const { result } = renderHook(() => usePriceCalculation());

      const prices = result.current.calculatePrices({
        numberOfPlayers: 3,
        holes: 18,
      });

      // Base price: 25€/player/18holes * 3 players = 75€
      // Platform fee: 75€ * 20% = 15€
      // Total: 75€ + 15€ = 90€
      expect(prices.proFee).toBe(75);
      expect(prices.platformFee).toBe(15);
      expect(prices.calculatedPrice).toBe(90);
      expect(prices.totalAmount).toBe(90);
    });

    it('should use custom base price when provided', () => {
      const { result } = renderHook(() => usePriceCalculation());

      const prices = result.current.calculatePrices({
        numberOfPlayers: 2,
        holes: 9,
        baseProPrice: 20, // Custom price per player
      });

      // Custom price: 20€/player * 2 players = 40€ → MIN 50€
      // Platform fee: 50€ * 20% = 10€
      // Total: 50€ + 10€ = 60€
      expect(prices.proFee).toBe(50);
      expect(prices.platformFee).toBe(10);
      expect(prices.calculatedPrice).toBe(60);
      expect(prices.totalAmount).toBe(60);
    });

    it('should enforce minimum pro fee', () => {
      const { result } = renderHook(() => usePriceCalculation());

      const prices = result.current.calculatePrices({
        numberOfPlayers: 1,
        holes: 9,
        baseProPrice: 10, // Low price that would result in less than minimum
      });

      // Pro fee should be minimum 50€
      // Platform fee: 50€ * 20% = 10€
      // Total: 50€ + 10€ = 60€
      expect(prices.proFee).toBe(50);
      expect(prices.platformFee).toBe(10);
      expect(prices.calculatedPrice).toBe(60);
      expect(prices.totalAmount).toBe(60);
    });
  });

  describe('setPrices', () => {
    it('should update prices manually', () => {
      const { result } = renderHook(() => usePriceCalculation());

      act(() => {
        result.current.setPrices({
          calculatedPrice: 100,
          proFee: 80,
          platformFee: 20,
        });
      });

      expect(result.current.calculatedPrice).toBe(100);
      expect(result.current.proFee).toBe(80);
      expect(result.current.platformFee).toBe(20);
      expect(result.current.totalAmount).toBe(200); // calculatedPrice + proFee + platformFee
    });

    it('should update partial prices', () => {
      const { result } = renderHook(() => usePriceCalculation());

      act(() => {
        result.current.setPrices({
          calculatedPrice: 50,
        });
      });

      expect(result.current.calculatedPrice).toBe(50);
      expect(result.current.proFee).toBe(0);
      expect(result.current.platformFee).toBe(0);
      expect(result.current.totalAmount).toBe(50);
    });
  });

  describe('formatPrice', () => {
    it('should format price correctly', () => {
      const { result } = renderHook(() => usePriceCalculation());

      expect(result.current.formatPrice(49.99)).toBe('50€');
      expect(result.current.formatPrice(100)).toBe('100€');
      expect(result.current.formatPrice(75.5)).toBe('76€');
    });
  });

  describe('getPriceInCents', () => {
    it('should convert price to cents correctly', () => {
      const { result } = renderHook(() => usePriceCalculation());

      expect(result.current.getPriceInCents(49.99)).toBe(4999);
      expect(result.current.getPriceInCents(100)).toBe(10000);
      expect(result.current.getPriceInCents(75.5)).toBe(7550);
    });
  });

  describe('totalAmount calculation', () => {
    it('should auto-calculate total amount', () => {
      const { result } = renderHook(() => usePriceCalculation());

      act(() => {
        result.current.setPrices({
          calculatedPrice: 60,
          proFee: 50,
          platformFee: 10,
        });
      });

      expect(result.current.totalAmount).toBe(120);
    });
  });
});

describe('calculateBookingPrice utility', () => {
  it('should calculate booking price without hook', () => {
    const prices = calculateBookingPrice({
      numberOfPlayers: 2,
      holes: 18,
    });

    // Base price: 25€/player/18holes * 2 players = 50€
    // Platform fee: 50€ * 20% = 10€
    // Total: 50€ + 10€ = 60€
    expect(prices.proFee).toBe(50);
    expect(prices.platformFee).toBe(10);
    expect(prices.calculatedPrice).toBe(60);
    expect(prices.totalAmount).toBe(60);
  });

  it('should handle custom base price in utility', () => {
    const prices = calculateBookingPrice({
      numberOfPlayers: 3,
      holes: 9,
      baseProPrice: 30,
    });

    // Custom price: 30€/player * 3 players = 90€
    // Platform fee: 90€ * 20% = 18€
    // Total: 90€ + 18€ = 108€
    expect(prices.proFee).toBe(90);
    expect(prices.platformFee).toBe(18);
    expect(prices.calculatedPrice).toBe(108);
    expect(prices.totalAmount).toBe(108);
  });
});
