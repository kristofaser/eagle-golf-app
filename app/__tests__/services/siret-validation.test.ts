import { SiretValidationService } from '@/services/siret-validation.service';

// Mock fetch pour les tests
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('SiretValidationService', () => {
  let service: SiretValidationService;

  beforeEach(() => {
    service = new SiretValidationService();
    mockFetch.mockClear();
  });

  describe('Format validation', () => {
    it('should validate correct SIRET format', async () => {
      // Mock réponse API positive
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            header: { statut: 200 },
            etablissement: {
              siret: '54210922700018',
              etatAdministratifEtablissement: 'A',
              adresseEtablissement: {
                numeroVoieEtablissement: '19-21',
                typeVoieEtablissement: 'BD',
                libelleVoieEtablissement: 'CAPUCINES',
                codePostalEtablissement: '75002',
                libelleCommuneEtablissement: 'PARIS',
              },
              uniteLegale: {
                denominationUniteLegale: 'APPLE FRANCE',
                etatAdministratifUniteLegale: 'A',
                categorieJuridiqueUniteLegale: '5710',
              },
            },
          }),
      });

      const result = await service.validateSiret('54210922700018'); // Apple France - SIRET valide

      expect(result.data?.isValid).toBe(true);
      expect(result.data?.companyName).toContain('APPLE');
      expect(result.data?.isActive).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject SIRET with wrong length', async () => {
      const result = await service.validateSiret('123456789');

      expect(result.data?.isValid).toBe(false);
      expect(result.data?.error).toContain('Format SIRET invalide');
    });

    it('should reject SIRET with non-numeric characters', async () => {
      const result = await service.validateSiret('12345678901ABC');

      expect(result.data?.isValid).toBe(false);
      expect(result.data?.error).toContain('Format SIRET invalide');
    });

    it('should reject SIRET with invalid Luhn checksum', async () => {
      const result = await service.validateSiret('54210922700019'); // Format OK mais clé invalide

      expect(result.data?.isValid).toBe(false);
      expect(result.data?.error).toContain('Format SIRET invalide');
    });
  });

  describe('API validation', () => {
    it('should handle API errors gracefully', async () => {
      // Mock erreur API
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.validateSiret('54210922700018'); // SIRET valide

      // Devrait fallback vers validation basique
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.error).toContain('Validation complète indisponible');
    });

    it('should handle SIRET not found in API', async () => {
      // Mock SIRET non trouvé
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            header: { statut: 404, message: 'SIRET non trouvé' },
            etablissement: null,
          }),
      });

      const result = await service.validateSiret('44306184100013'); // Google France - SIRET valide

      expect(result.data?.isValid).toBe(false);
      expect(result.data?.error).toContain('SIRET non trouvé');
    });

    it('should detect closed establishments', async () => {
      // Mock établissement fermé
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            header: { statut: 200 },
            etablissement: {
              siret: '44306184100013',
              etatAdministratifEtablissement: 'F', // Fermé
              adresseEtablissement: {},
              uniteLegale: {
                denominationUniteLegale: 'GOOGLE FRANCE',
                etatAdministratifUniteLegale: 'C', // Cessée
              },
            },
          }),
      });

      const result = await service.validateSiret('44306184100013'); // Google France - SIRET valide

      expect(result.data?.isValid).toBe(true);
      expect(result.data?.isActive).toBe(false);
      expect(result.data?.establishmentState).toBe('CLOSED');
    });
  });

  describe('Fallback behavior', () => {
    it('should try fallback API when main API fails', async () => {
      // Mock première API échoue
      mockFetch.mockRejectedValueOnce(new Error('INSEE API down'));

      // Mock deuxième API réussit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            etablissement: {
              etat_administratif: 'A',
              unite_legale: {
                denomination: 'ENTREPRISE FALLBACK',
              },
            },
          }),
      });

      const result = await service.validateSiret('54210922700018'); // Apple France - SIRET valide

      expect(mockFetch).toHaveBeenCalledTimes(2); // Deux appels
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.companyName).toBe('ENTREPRISE FALLBACK');
    });

    it('should fallback to basic validation when all APIs fail', async () => {
      // Mock toutes les APIs échouent
      mockFetch.mockRejectedValue(new Error('All APIs down'));

      const result = await service.validateSiret('54210922700018'); // Apple France - SIRET valide

      expect(result.data?.isValid).toBe(true); // Format valide
      expect(result.data?.error).toContain('Validation complète indisponible');
    });
  });
});
