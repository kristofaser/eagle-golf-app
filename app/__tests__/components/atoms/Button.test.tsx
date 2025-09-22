/**
 * Tests unitaires pour le composant Button
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/atoms/Button';
import { Colors } from '@/constants/theme';

describe('Button Component', () => {
  describe('Rendu', () => {
    it('devrait afficher le texte du bouton', () => {
      const { getByText } = render(<Button>Cliquez-moi</Button>);
      expect(getByText('Cliquez-moi')).toBeTruthy();
    });

    it('devrait appliquer la variante primary par défaut', () => {
      const { getByTestId } = render(<Button testID="button">Primary Button</Button>);
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: Colors.primary.electric,
        })
      );
    });

    it('devrait appliquer la variante secondary', () => {
      const { getByTestId } = render(
        <Button variant="secondary" testID="button">
          Secondary Button
        </Button>
      );
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: Colors.primary.navy,
        })
      );
    });

    it('devrait appliquer la variante ghost', () => {
      const { getByTestId } = render(
        <Button variant="ghost" testID="button">
          Ghost Button
        </Button>
      );
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: 'transparent',
        })
      );
    });
  });

  describe('Tailles', () => {
    it('devrait appliquer la taille small', () => {
      const { getByTestId } = render(
        <Button size="sm" testID="button">
          Small Button
        </Button>
      );
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          paddingVertical: 8,
          paddingHorizontal: 16,
        })
      );
    });

    it('devrait appliquer la taille medium par défaut', () => {
      const { getByTestId } = render(<Button testID="button">Medium Button</Button>);
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          paddingVertical: 12,
          paddingHorizontal: 24,
        })
      );
    });

    it('devrait appliquer la taille large', () => {
      const { getByTestId } = render(
        <Button size="lg" testID="button">
          Large Button
        </Button>
      );
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          paddingVertical: 16,
          paddingHorizontal: 32,
        })
      );
    });
  });

  describe('Interactions', () => {
    it('devrait appeler onPress quand cliqué', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(<Button onPress={onPressMock}>Click Me</Button>);

      fireEvent.press(getByText('Click Me'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas appeler onPress si disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button onPress={onPressMock} disabled>
          Disabled Button
        </Button>
      );

      fireEvent.press(getByText('Disabled Button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('devrait avoir une opacité réduite si disabled', () => {
      const { getByTestId } = render(
        <Button disabled testID="button">
          Disabled
        </Button>
      );
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(
        expect.objectContaining({
          opacity: 0.5,
        })
      );
    });
  });

  describe('États de chargement', () => {
    it('devrait afficher un indicateur de chargement', () => {
      const { getByTestId, queryByText } = render(
        <Button loading testID="button">
          Loading Button
        </Button>
      );

      // Le texte ne devrait pas être visible
      expect(queryByText('Loading Button')).toBeNull();

      // Le bouton devrait être désactivé en état loading
      const button = getByTestId('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });

    it('ne devrait pas répondre aux clics en état loading', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Button loading onPress={onPressMock} testID="button">
          Loading
        </Button>
      );

      fireEvent.press(getByTestId('button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir le rôle button', () => {
      const { getByRole } = render(<Button>Accessible Button</Button>);
      expect(getByRole('button')).toBeTruthy();
    });

    it('devrait avoir un label accessible', () => {
      const { getByLabelText } = render(
        <Button accessibilityLabel="Bouton d'action">Action</Button>
      );
      expect(getByLabelText("Bouton d'action")).toBeTruthy();
    });

    it("devrait indiquer l'état disabled", () => {
      const { getByTestId } = render(
        <Button disabled testID="button">
          Disabled
        </Button>
      );
      const button = getByTestId('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Styles personnalisés', () => {
    it('devrait accepter des styles personnalisés', () => {
      const customStyle = {
        backgroundColor: '#FF0000',
        borderRadius: 20,
      };

      const { getByTestId } = render(
        <Button style={customStyle} testID="button">
          Custom Style
        </Button>
      );
      const button = getByTestId('button');

      expect(button.props.style).toMatchObject(expect.objectContaining(customStyle));
    });
  });
});
