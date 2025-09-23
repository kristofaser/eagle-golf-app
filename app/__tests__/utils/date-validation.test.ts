import {
  validateDateOfBirth,
  applyDateMask,
  formatDateForDisplay,
  validateBusinessLeaderAge,
} from '@/utils/date-validation';

describe('Date Validation Utils', () => {
  describe('validateDateOfBirth', () => {
    it('should validate correct date format', () => {
      const result = validateDateOfBirth('15/03/1985');

      expect(result.isValid).toBe(true);
      expect(result.formattedDate).toBe('1985-03-15');
      expect(result.age).toBeGreaterThan(30);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty date', () => {
      const result = validateDateOfBirth('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Date de naissance requise');
    });

    it('should reject invalid format', () => {
      const result = validateDateOfBirth('15-03-1985');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format invalide');
    });

    it('should reject invalid day', () => {
      const result = validateDateOfBirth('32/03/1985');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Jour invalide');
    });

    it('should reject invalid month', () => {
      const result = validateDateOfBirth('15/13/1985');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Mois invalide');
    });

    it('should reject future year', () => {
      const futureYear = new Date().getFullYear() + 1;
      const result = validateDateOfBirth(`15/03/${futureYear}`);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Année invalide');
    });

    it('should reject too old year', () => {
      const result = validateDateOfBirth('15/03/1800');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Année invalide');
    });

    it('should reject impossible date', () => {
      const result = validateDateOfBirth('31/02/2023');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Date inexistante');
    });

    it('should reject under 18 years old', () => {
      const recentYear = new Date().getFullYear() - 10; // 10 ans
      const result = validateDateOfBirth(`15/03/${recentYear}`);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('au moins 18 ans');
    });

    it('should reject unrealistic age', () => {
      const result = validateDateOfBirth('15/03/1900');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Âge trop élevé');
    });

    it('should handle leap year correctly', () => {
      const result = validateDateOfBirth('29/02/2000'); // 2000 est bissextile

      expect(result.isValid).toBe(true);
      expect(result.formattedDate).toBe('2000-02-29');
    });

    it('should reject non-leap year Feb 29', () => {
      const result = validateDateOfBirth('29/02/1999'); // 1999 n'est pas bissextile

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Date inexistante');
    });
  });

  describe('applyDateMask', () => {
    it('should format date with mask', () => {
      expect(applyDateMask('15031985')).toBe('15/03/1985');
      expect(applyDateMask('1503198')).toBe('15/03/198');
      expect(applyDateMask('15031')).toBe('15/03/1');
      expect(applyDateMask('150')).toBe('15/0');
      expect(applyDateMask('15')).toBe('15');
      expect(applyDateMask('1')).toBe('1');
    });

    it('should remove non-numeric characters', () => {
      expect(applyDateMask('15a03b1985')).toBe('15/03/1985');
      expect(applyDateMask('15/03/1985')).toBe('15/03/1985');
    });

    it('should handle empty input', () => {
      expect(applyDateMask('')).toBe('');
    });

    it('should limit to 8 digits', () => {
      expect(applyDateMask('150319851234')).toBe('15/03/1985');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format ISO date to display format', () => {
      expect(formatDateForDisplay('1985-03-15')).toBe('15/03/1985');
      expect(formatDateForDisplay('2000-12-31')).toBe('31/12/2000');
      expect(formatDateForDisplay('1999-01-01')).toBe('01/01/1999');
    });

    it('should handle invalid date', () => {
      expect(formatDateForDisplay('invalid-date')).toBe('');
      expect(formatDateForDisplay('')).toBe('');
    });
  });

  describe('validateBusinessLeaderAge', () => {
    it('should use same validation as validateDateOfBirth for valid adult', () => {
      const result = validateBusinessLeaderAge('15/03/1985');

      expect(result.isValid).toBe(true);
      expect(result.formattedDate).toBe('1985-03-15');
    });

    it('should reject under 16 for business leader', () => {
      const recentYear = new Date().getFullYear() - 15; // 15 ans
      const result = validateBusinessLeaderAge(`15/03/${recentYear}`);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('au moins 16 ans');
    });

    it('should accept 17 years old for business leader', () => {
      const recentYear = new Date().getFullYear() - 17; // 17 ans
      const result = validateBusinessLeaderAge(`15/03/${recentYear}`);

      expect(result.isValid).toBe(true);
      expect(result.age).toBe(17);
    });

    it('should still reject invalid format', () => {
      const result = validateBusinessLeaderAge('invalid');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Format invalide');
    });
  });
});
