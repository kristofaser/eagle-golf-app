import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { profileService } from '@/services/profile.service';
import { siretValidationService } from '@/services/siret-validation.service';
import { validateDateOfBirth, applyDateMask } from '@/utils/date-validation';

// Fonction pour formater le numéro de téléphone au format "00 00 00 00 00"
const formatPhoneNumber = (input: string): string => {
  // Ne garder que les chiffres
  let digits = input.replace(/\D/g, '');

  // Forcer le premier chiffre à être 0
  if (digits.length > 0 && !digits.startsWith('0')) {
    digits = '0' + digits.slice(0, 9); // Garder 9 chiffres après le 0
  }

  // Limiter à 10 chiffres
  const limitedDigits = digits.slice(0, 10);

  // Appliquer le formatage par groupes de 2
  const formatted = limitedDigits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  return formatted;
};

// Fonction pour valider le numéro de téléphone français
const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 0) {
    return { isValid: false, error: 'Numéro de téléphone requis' };
  }

  if (digits.length !== 10) {
    return { isValid: false, error: 'Le numéro doit contenir 10 chiffres' };
  }

  // Vérifier que ça commence par 0
  if (!digits.startsWith('0')) {
    return { isValid: false, error: 'Le numéro doit commencer par 0' };
  }

  // Vérifier les préfixes valides français
  const validPrefixes = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];
  const prefix = digits.slice(0, 2);

  if (!validPrefixes.includes(prefix)) {
    return { isValid: false, error: 'Préfixe de numéro invalide' };
  }

  return { isValid: true };
};
import { LoadingScreen, ErrorScreen } from '@/components/atoms';
import { Colors, Spacing, Typography, BorderRadius, Elevation } from '@/constants/theme';
import { Text } from '@/components/atoms';
import { useUnifiedImagePicker, ImageResult } from '@/hooks/useImageUpload';
import { documentUploadService, DocumentType } from '@/services/document-upload.service';
import { supabase } from '@/utils/supabase/client';

const STEPS = [
  { id: 1, label: 'Infos', icon: 'business' },
  { id: 2, label: 'Documents', icon: 'document' },
  { id: 3, label: 'Vos tarifs', icon: 'pricetag' },
  { id: 4, label: 'Validation', icon: 'checkmark-circle' },
];

export default function BecomeProScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { profile, loading, isAmateur, isPro, refreshProRequestStatus } = useUser();

  // État du stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingSiret, setIsValidatingSiret] = useState(false);
  const [siretValidationResult, setSiretValidationResult] = useState<any>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);

  // Animations FAB
  const fabScale = useSharedValue(0);
  const fabTranslateY = useSharedValue(50);
  const previousStep = useRef(0); // Initialisé à 0 pour déclencher l'animation au premier rendu
  const previousTermsAccepted = useRef(false);

  // Styles d'animation FAB
  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }, { translateY: fabTranslateY.value }],
    };
  });

  // Données du formulaire
  const [formData, setFormData] = useState({
    // Étape 1 - SIRET
    siret: '',
    dateOfBirth: '',
    companyStatus: '',
    phoneNumber: '',

    // Étape 2 - Documents
    idCardFront: null as ImageResult | null,
    idCardBack: null as ImageResult | null,
    idCardFrontUrl: '',
    idCardBackUrl: '',

    // Étape 3 - Tarifs
    hourlyRate: '',
    price9Holes1Player: '',
    price9Holes2Players: '',
    price9Holes3Players: '',
    price18Holes1Player: '',
    price18Holes2Players: '',
    price18Holes3Players: '',
    skills: [] as string[],
    experience: '',

    // Étape 4 - Validation
    termsAccepted: false,
  });

  // Erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Configuration du picker d'images pour documents (optimisée)
  const imagePicker = useUnifiedImagePicker({
    title: "Document d'identité",
    cameraOption: 'Prendre une photo',
    galleryOption: 'Choisir un fichier',
    cancelOption: 'Annuler',
    allowsEditing: false, // Garder le document original
    quality: 0.7, // 70% - Compromis optimal entre taille et lisibilité
    maxFileSize: 5 * 1024 * 1024, // 5MB max pour documents (réduit de 10MB)
    minWidth: 800, // Résolution minimale pour lisibilité
    minHeight: 600,
    showPermissionAlerts: true,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image', undefined], // Support étendu pour simulateur iOS
  });

  // Animation FAB au changement d'étape et checkbox
  useEffect(() => {
    // Détecter si on décoche la checkbox à l'étape 4
    const isUncheckingTerms =
      currentStep === 4 &&
      previousTermsAccepted.current === true &&
      formData.termsAccepted === false;

    if (isUncheckingTerms) {
      // Animation de fermeture quand on décoche
      fabScale.value = withSpring(0, {
        tension: 100,
        friction: 8
      });
      fabTranslateY.value = withSpring(50, {
        tension: 80,
        friction: 10
      });

      previousTermsAccepted.current = formData.termsAccepted;
      return;
    }

    // Déclencher l'animation d'ouverture si :
    // 1. On change d'étape
    // 2. On est à l'étape 4 et termsAccepted devient true
    const shouldAnimate =
      previousStep.current !== currentStep ||
      (currentStep === 4 && formData.termsAccepted && !previousTermsAccepted.current);

    if (shouldAnimate) {
      // Reset animations
      fabScale.value = 0;
      fabTranslateY.value = 50;

      // Animation d'entrée avec délai
      const animationDelay = previousStep.current === currentStep ? 100 : 200;

      if (currentStep === 4 && formData.termsAccepted) {
        // Animation Victory pour l'étape finale et le bouton soumettre
        fabScale.value = withDelay(
          animationDelay,
          withSequence(
            withSpring(1.2, { duration: 300 }),
            withSpring(0.95, { duration: 200 }),
            withSpring(1, { duration: 300 })
          )
        );
      } else if (currentStep < 4) {
        // Animation Pop-in normale pour les autres étapes
        fabScale.value = withDelay(
          animationDelay,
          withSpring(1, {
            tension: 100,
            friction: 8,
          })
        );
      }

      fabTranslateY.value = withDelay(
        animationDelay,
        withSpring(0, {
          tension: 80,
          friction: 10,
        })
      );

      previousStep.current = currentStep;
    }

    // Mettre à jour la référence
    previousTermsAccepted.current = formData.termsAccepted;
  }, [currentStep, formData.termsAccepted]);

  // Validation pour activer le bouton continuer
  useEffect(() => {
    const checkCanGoNext = async () => {
      const isValid = await validateCurrentStep();
      setCanGoNext(isValid);
    };
    checkCanGoNext();
  }, [currentStep, formData, siretValidationResult]);

  // Validation SIRET via API INSEE
  const validateSIRET = async (siret: string): Promise<boolean> => {
    if (!siret || siret.trim().length === 0) {
      return false;
    }

    // Debug du token dans React Native
    console.log(
      '🔑 Token ENV disponible dans RN:',
      process.env.EXPO_PUBLIC_INSEE_API_TOKEN ? 'OUI' : 'NON'
    );

    setIsValidatingSiret(true);
    setSiretValidationResult(null);

    try {
      const response = await siretValidationService.validateSiret(siret.trim());

      if (response.data) {
        setSiretValidationResult(response.data);

        // Sélection automatique du statut d'entreprise si disponible
        if (response.data.isValid && response.data.mappedCompanyStatus) {
          setFormData((prev) => ({
            ...prev,
            companyStatus: response.data.mappedCompanyStatus!,
          }));
          console.log(
            `✅ Statut d'entreprise sélectionné automatiquement: ${response.data.mappedCompanyStatus}`
          );
        }

        return response.data.isValid;
      }

      return false;
    } catch (error: any) {
      console.error('Erreur validation SIRET:', error);
      setSiretValidationResult({
        isValid: false,
        error: 'Erreur lors de la validation. Réessayez.',
      });
      return false;
    } finally {
      setIsValidatingSiret(false);
    }
  };

  // Sélection et upload de documents réels
  const pickImage = async (type: 'front' | 'back') => {
    if (isUploadingDocument) {
      Alert.alert('Patience', "Un document est déjà en cours d'upload...");
      return;
    }

    try {
      console.log(`📷 Sélection document ${type}`);

      // Sélectionner l'image
      const result = await imagePicker.selectImage();

      if (!result) {
        // Utilisateur a annulé
        return;
      }

      console.log(`✅ Document ${type} sélectionné:`, {
        uri: result.uri,
        size: `${result.width}x${result.height}`,
        fileSize: result.fileSize ? `${Math.round(result.fileSize / 1024)}KB` : 'unknown',
        type: result.type || 'undefined', // 🔍 Debug type MIME
      });

      // 🔧 Debug pour diagnostiquer simulator vs device
      const extension = result.uri.split('.').pop()?.toLowerCase();
      console.log('📱 DEVICE/SIMULATOR DEBUG:', {
        platform: Platform.OS,
        hasType: !!result.type,
        detectedExtension: extension,
        isSimulator: __DEV__ && Platform.OS === 'ios' && result.uri.includes('CoreSimulator'),
      });

      setIsUploadingDocument(true);

      // Upload vers Supabase Storage
      const documentType: DocumentType = type === 'front' ? 'id_front' : 'id_back';
      const uploadResult = await documentUploadService.uploadDocument(
        user!.id,
        result,
        documentType
      );

      console.log(`✅ Upload ${type} réussi:`, uploadResult);

      // Mettre à jour le state avec les données réelles
      setFormData({
        ...formData,
        [type === 'front' ? 'idCardFront' : 'idCardBack']: result,
        [type === 'front' ? 'idCardFrontUrl' : 'idCardBackUrl']: uploadResult.url,
      });

      // Nettoyer les erreurs précédentes
      if (errors[type === 'front' ? 'idCardFront' : 'idCardBack']) {
        const newErrors = { ...errors };
        delete newErrors[type === 'front' ? 'idCardFront' : 'idCardBack'];
        setErrors(newErrors);
      }

      Alert.alert(
        'Document uploadé !',
        `Votre ${type === 'front' ? "pièce d'identité (recto)" : "pièce d'identité (verso)"} a été uploadée avec succès.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error(`❌ Erreur upload document ${type}:`, error);

      // Gestion spécifique pour fichier vide
      if (error.message?.includes('vide') || error.message?.includes('0 bytes')) {
        Alert.alert(
          'Fichier vide détecté',
          'Le document sélectionné semble vide. Cela peut arriver avec certains simulateurs. Essayez de reprendre la photo ou sélectionnez une autre image.',
          [
            { text: 'Reprendre', onPress: () => pickImage(type) },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert(
          "Erreur d'upload",
          error.message ||
            "Impossible d'uploader le document. Vérifiez votre connexion et réessayez.",
          [
            { text: 'Réessayer', onPress: () => pickImage(type) },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      }
    } finally {
      setIsUploadingDocument(false);
    }
  };

  // Validation de l'étape courante
  const validateCurrentStep = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // SIRET et informations
        // Validation SIRET
        if (!formData.siret) {
          newErrors.siret = 'SIRET requis';
        } else if (formData.siret.length !== 14) {
          newErrors.siret = 'SIRET doit faire exactement 14 chiffres';
        } else if (siretValidationResult?.isValid === false) {
          // Utiliser le résultat déjà validé si disponible
          newErrors.siret = siretValidationResult.error || 'SIRET invalide';
        } else if (!siretValidationResult) {
          // Validation si pas encore effectuée
          console.log('🔄 Validation SIRET requise pour validation étape');
          if (!(await validateSIRET(formData.siret))) {
            newErrors.siret = siretValidationResult?.error || 'SIRET invalide';
          }
        } else {
          // SIRET déjà validé avec succès (via validation temps réel)
          console.log('✅ SIRET déjà validé, pas de nouvelle validation requise');
        }

        // Validation date de naissance
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date de naissance requise';
        } else {
          const dateValidation = validateDateOfBirth(formData.dateOfBirth);
          if (!dateValidation.isValid) {
            newErrors.dateOfBirth = dateValidation.error || 'Date invalide';
          }
        }

        // Validation téléphone
        const phoneValidation = validatePhoneNumber(formData.phoneNumber);
        if (!phoneValidation.isValid) {
          newErrors.phoneNumber = phoneValidation.error || 'Numéro de téléphone invalide';
        }

        // Autres validations
        if (!formData.companyStatus) {
          newErrors.companyStatus = 'Statut entreprise requis';
        }
        break;

      case 2: // Documents
        if (!formData.idCardFront || !formData.idCardFrontUrl) {
          newErrors.idCardFront = "Recto de la pièce d'identité requis";
        }
        if (!formData.idCardBack || !formData.idCardBackUrl) {
          newErrors.idCardBack = "Verso de la pièce d'identité requis";
        }
        break;

      case 3: // Tarifs
        if (!formData.price9Holes1Player) {
          newErrors.price9Holes1Player = 'Tarif 9 trous requis';
        }
        if (!formData.price18Holes1Player) {
          newErrors.price18Holes1Player = 'Tarif 18 trous requis';
        }
        break;

      case 4: // Validation
        // La validation des conditions est gérée visuellement
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation entre étapes
  const handleNext = async () => {
    if (await validateCurrentStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumission finale
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validation finale des données
      const dateValidation = validateDateOfBirth(formData.dateOfBirth);
      if (!dateValidation.isValid) {
        Alert.alert('Erreur', dateValidation.error || 'Date de naissance invalide');
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        Alert.alert('Erreur', 'Utilisateur non identifié');
        setIsLoading(false);
        return;
      }

      // Préparation des données pour l'API
      const proData = {
        date_of_birth: dateValidation.formattedDate!, // Format ISO pour la DB
        siret: formData.siret,
        company_status: formData.companyStatus,
        phone_number: formData.phoneNumber.replace(/\s/g, ''), // Enlever les espaces pour la DB
        id_card_front_url: formData.idCardFrontUrl,
        id_card_back_url: formData.idCardBackUrl,
        // Tarifs en centimes pour la base de données
        price_9_holes_1_player: formData.price9Holes1Player
          ? parseFloat(formData.price9Holes1Player) * 100
          : undefined,
        price_9_holes_2_players: formData.price9Holes2Players
          ? parseFloat(formData.price9Holes2Players) * 100
          : undefined,
        price_9_holes_3_players: formData.price9Holes3Players
          ? parseFloat(formData.price9Holes3Players) * 100
          : undefined,
        price_18_holes_1_player: formData.price18Holes1Player
          ? parseFloat(formData.price18Holes1Player) * 100
          : undefined,
        price_18_holes_2_players: formData.price18Holes2Players
          ? parseFloat(formData.price18Holes2Players) * 100
          : undefined,
        price_18_holes_3_players: formData.price18Holes3Players
          ? parseFloat(formData.price18Holes3Players) * 100
          : undefined,
      };

      // Appel au service
      const result = await profileService.convertToPro(user.id, proData);

      if (result.error) {
        Alert.alert('Erreur', result.error);
        return;
      }

      // Rafraîchir le statut pro avant de fermer
      await refreshProRequestStatus();

      Alert.alert(
        'Demande Soumise avec Succès !',
        'Votre demande pour devenir professionnel a été envoyée à notre équipe de validation.\n\n⏱️ Délai de traitement : 24-48h\n📧 Vous recevrez une notification une fois validée.',
        [
          {
            text: 'Compris',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur soumission:', error);
      Alert.alert('Erreur', "Une erreur est survenue lors de l'envoi de votre demande");
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu de l'étape 1 - SIRET
  const renderStep1 = () => (
    <Animated.View entering={FadeInUp} style={styles.stepContent}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Numéro SIRET *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.siret && styles.inputError,
                siretValidationResult?.isValid && styles.inputValid,
              ]}
              placeholder="14 chiffres (ex: 54210922700018)"
              value={formData.siret}
              onChangeText={(text) => {
                // Ne garder que les chiffres
                const numericText = text.replace(/\D/g, '');
                setFormData({ ...formData, siret: numericText });

                // Reset des résultats précédents
                if (siretValidationResult) {
                  setSiretValidationResult(null);
                }

                // Validation automatique après 14 chiffres
                if (numericText.length === 14) {
                  console.log('🔄 Auto-validation SIRET après 14 chiffres:', numericText);
                  validateSIRET(numericText);
                } else if (numericText.length < 14 && formData.companyStatus) {
                  // Reset du statut d'entreprise si SIRET incomplet
                  console.log('🔄 Reset statut entreprise (SIRET incomplet)');
                  setFormData((prev) => ({ ...prev, companyStatus: '' }));
                }
              }}
              keyboardType="numeric"
              maxLength={14}
              autoCorrect={false}
            />
            {isValidatingSiret && (
              <View style={styles.inputIcon}>
                <Ionicons name="refresh" size={20} color={Colors.primary.accent} />
              </View>
            )}
            {siretValidationResult?.isValid && !isValidatingSiret && (
              <View style={styles.inputIcon}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.semantic.success} />
              </View>
            )}
          </View>

          {/* Statut détecté sous le champ SIRET */}
          {siretValidationResult &&
            !isValidatingSiret &&
            siretValidationResult.isValid &&
            siretValidationResult.mappedCompanyStatus && (
              <Text style={styles.detectedStatus}>
                🏷️ Statut détecté: {siretValidationResult.mappedCompanyStatus}
              </Text>
            )}

          {/* Erreur SIRET */}
          {siretValidationResult && !isValidatingSiret && !siretValidationResult.isValid && (
            <Text style={styles.siretError}>
              ❌ {siretValidationResult.error || 'SIRET invalide'}
            </Text>
          )}

          {errors.siret && <Text style={styles.errorText}>{errors.siret}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date de naissance *</Text>
          <TextInput
            style={[styles.input, errors.dateOfBirth && styles.inputError]}
            placeholder="JJ/MM/AAAA (ex: 15/03/1985)"
            value={formData.dateOfBirth}
            onChangeText={(text) => {
              // Appliquer le masque de saisie
              const maskedDate = applyDateMask(text);
              setFormData({ ...formData, dateOfBirth: maskedDate });
            }}
            keyboardType="numeric"
            maxLength={10}
            autoCorrect={false}
          />
          {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Numéro de téléphone *</Text>
          <TextInput
            style={[styles.input, errors.phoneNumber && styles.inputError]}
            placeholder="06 12 34 56 78"
            value={formData.phoneNumber}
            onChangeText={(text) => {
              const formatted = formatPhoneNumber(text);
              setFormData({ ...formData, phoneNumber: formatted });
            }}
            keyboardType="phone-pad"
            maxLength={14} // "00 00 00 00 00" = 14 caractères
            autoCorrect={false}
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
        </View>
      </View>
    </Animated.View>
  );

  // Rendu de l'étape 2 - Documents
  const renderStep2 = () => (
    <Animated.View entering={FadeInUp} style={styles.stepContent}>
      <View style={styles.form}>
        <View style={styles.documentUpload}>
          <Text style={styles.inputLabel}>Pièce d'identité (recto) *</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              errors.idCardFront && styles.uploadButtonError,
              (isUploadingDocument || imagePicker.loading) && styles.uploadButtonDisabled,
            ]}
            onPress={() => pickImage('front')}
            disabled={isUploadingDocument || imagePicker.loading}
          >
            {formData.idCardFront ? (
              <Image source={{ uri: formData.idCardFront.uri }} style={styles.uploadedImage} />
            ) : isUploadingDocument || imagePicker.loading ? (
              <>
                <Ionicons name="refresh" size={32} color={Colors.primary.accent} />
                <Text style={styles.uploadText}>Upload en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="camera" size={32} color={Colors.neutral.iron} />
                <Text style={styles.uploadText}>Ajouter une photo</Text>
              </>
            )}
          </TouchableOpacity>
          {errors.idCardFront && <Text style={styles.errorText}>{errors.idCardFront}</Text>}
        </View>

        <View style={styles.documentUpload}>
          <Text style={styles.inputLabel}>Pièce d'identité (verso) *</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              errors.idCardBack && styles.uploadButtonError,
              (isUploadingDocument || imagePicker.loading) && styles.uploadButtonDisabled,
            ]}
            onPress={() => pickImage('back')}
            disabled={isUploadingDocument || imagePicker.loading}
          >
            {formData.idCardBack ? (
              <Image source={{ uri: formData.idCardBack.uri }} style={styles.uploadedImage} />
            ) : isUploadingDocument || imagePicker.loading ? (
              <>
                <Ionicons name="refresh" size={32} color={Colors.primary.accent} />
                <Text style={styles.uploadText}>Upload en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="camera" size={32} color={Colors.neutral.iron} />
                <Text style={styles.uploadText}>Ajouter une photo</Text>
              </>
            )}
          </TouchableOpacity>
          {errors.idCardBack && <Text style={styles.errorText}>{errors.idCardBack}</Text>}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary.accent} />
          <Text style={styles.infoText}>
            Les documents seront vérifiés manuellement par notre équipe. Assurez-vous que les
            informations soient lisibles.
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  // Rendu de l'étape 3 - Tarifs
  const renderStep3 = () => (
    <Animated.View entering={FadeInUp} style={styles.stepContent}>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>9 trous</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>1 joueur</Text>
          <TextInput
            style={[styles.priceInput, errors.price9Holes1Player && styles.inputError]}
            placeholder="100"
            value={formData.price9Holes1Player}
            onChangeText={(text) => setFormData({ ...formData, price9Holes1Player: text })}
            keyboardType="numeric"
          />
          <Text style={styles.priceCurrency}>€</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>2 joueurs</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="90"
            value={formData.price9Holes2Players}
            onChangeText={(text) => setFormData({ ...formData, price9Holes2Players: text })}
            keyboardType="numeric"
          />
          <Text style={styles.priceCurrency}>€ / pers</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>3 joueurs</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="80"
            value={formData.price9Holes3Players}
            onChangeText={(text) => setFormData({ ...formData, price9Holes3Players: text })}
            keyboardType="numeric"
          />
          <Text style={styles.priceCurrency}>€ / pers</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>18 trous</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>1 joueur</Text>
          <TextInput
            style={[styles.priceInput, errors.price18Holes1Player && styles.inputError]}
            placeholder="180"
            value={formData.price18Holes1Player}
            onChangeText={(text) => setFormData({ ...formData, price18Holes1Player: text })}
            keyboardType="numeric"
          />
          <Text style={styles.priceCurrency}>€</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>2 joueurs</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="160"
            value={formData.price18Holes2Players}
            onChangeText={(text) => setFormData({ ...formData, price18Holes2Players: text })}
            keyboardType="numeric"
          />
          <Text style={styles.priceCurrency}>€ / pers</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>3 joueurs</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="140"
            value={formData.price18Holes3Players}
            onChangeText={(text) => setFormData({ ...formData, price18Holes3Players: text })}
            keyboardType="numeric"
          />
          <Text style={styles.priceCurrency}>€ / pers</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );

  // Rendu de l'étape 4 - Validation
  const renderStep4 = () => (
    <Animated.View entering={FadeInUp} style={styles.stepContent}>
      {/* Récapitulatif compacté */}
      <View style={styles.compactSummaryCard}>
        <Text style={styles.compactSummaryTitle}>Récapitulatif de votre demande</Text>

        {/* Informations sur 2 colonnes */}
        <View style={styles.compactSummaryGrid}>
          <View style={styles.compactSummaryCol}>
            <View style={styles.compactSummaryRow}>
              <Ionicons name="business-outline" size={16} color={Colors.neutral.iron} />
              <Text style={styles.compactSummaryLabel}>SIRET</Text>
            </View>
            <Text style={styles.compactSummaryValue}>{formData.siret}</Text>
          </View>

          <View style={styles.compactSummaryCol}>
            <View style={styles.compactSummaryRow}>
              <Ionicons name="call-outline" size={16} color={Colors.neutral.iron} />
              <Text style={styles.compactSummaryLabel}>Téléphone</Text>
            </View>
            <Text style={styles.compactSummaryValue}>{formData.phoneNumber}</Text>
          </View>
        </View>

        {/* Documents et tarifs sur une ligne */}
        <View style={styles.compactSummaryDivider} />

        <View style={styles.compactSummaryRow}>
          <Ionicons name="document-text-outline" size={16} color={Colors.semantic.success.default} />
          <Text style={styles.compactSummaryLabel}>Pièce d'identité</Text>
          <Text style={styles.compactSummarySuccess}>Téléchargée ✓</Text>
        </View>

      </View>

      {/* Bloc des conditions amélioré */}
      <View style={styles.termsCard}>
        <TouchableOpacity
          style={styles.termsCheckboxRow}
          onPress={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
            {formData.termsAccepted && (
              <Ionicons name="checkmark" size={14} color={Colors.neutral.white} />
            )}
          </View>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsSubText}>
              J'accepte les{' '}
              <Text style={styles.termsLink}>conditions générales</Text> et la{' '}
              <Text style={styles.termsLink}>politique de confidentialité</Text> d'Eagle.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Message d'information */}
      <View style={styles.infoMessage}>
        <Ionicons name="time-outline" size={20} color={Colors.primary.accent} />
        <Text style={styles.infoMessageText}>
          Votre demande sera vérifiée sous <Text style={styles.infoMessageHighlight}>24-48h</Text>. Vous recevrez une notification une fois validée.
        </Text>
      </View>
    </Animated.View>
  );

  // Sélection du contenu selon l'étape
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // Vérifications de sécurité
  if (!isAuthenticated) {
    return <LoadingScreen message="Redirection..." />;
  }

  if (loading) {
    return <LoadingScreen message="Chargement du profil..." />;
  }

  if (!profile) {
    return (
      <ErrorScreen
        message="Profil non trouvé"
        description="Veuillez d'abord compléter votre profil"
        onRetry={() => router.back()}
      />
    );
  }

  if (isPro) {
    return (
      <ErrorScreen
        message="Déjà professionnel"
        description="Vous êtes déjà enregistré comme professionnel"
        onRetry={() => router.back()}
      />
    );
  }

  return (
    <>
      {/* Header fixe avec indicateur de progression */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handlePrevious}
            style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]}
            disabled={currentStep === 1}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentStep === 1 ? Colors.neutral.mist : Colors.neutral.charcoal}
            />
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            {STEPS.map((step) => (
              <View
                key={step.id}
                style={[
                  styles.stepDot,
                  step.id === currentStep && styles.stepDotActive,
                  step.id < currentStep && styles.stepDotCompleted,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
            <Ionicons name="close" size={24} color={Colors.neutral.charcoal} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ScrollView unique pour tout le contenu */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {renderStepContent()}
        </KeyboardAvoidingView>
      </ScrollView>

      {/* FAB Bouton Continuer pour les étapes 1-3 */}
      {currentStep < 4 && (
        <Animated.View style={[styles.fabExtended, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleNext}
            disabled={!canGoNext || isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={20} color={Colors.neutral.white} />
            <Text style={styles.fabExtendedText}>Continuer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* FAB Bouton Soumettre pour l'étape finale */}
      {currentStep === 4 && formData.termsAccepted && (
        <Animated.View style={[styles.fab, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.neutral.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color={Colors.neutral.white} />
                <Text style={styles.fabText}>Soumettre</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  header: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.pearl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral.mist,
  },
  stepDotActive: {
    backgroundColor: Colors.primary.accent,
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: Colors.primary.navy,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 150, // Plus d'espace pour le FAB
  },
  stepContent: {
    padding: Spacing.l,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginTop: Spacing.m,
    marginBottom: Spacing.s,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  form: {
    marginTop: Spacing.l,
  },
  inputGroup: {
    marginBottom: Spacing.l,
  },
  inputLabel: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
  },
  inputError: {
    borderColor: Colors.semantic.error,
  },
  inputValid: {
    borderColor: Colors.semantic.success,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: Spacing.m,
    top: Spacing.m,
    bottom: Spacing.m,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.semantic.error,
    marginTop: Spacing.xs,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  radioOption: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
    borderRadius: BorderRadius.small,
  },
  radioOptionSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  radioText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
  },
  radioTextSelected: {
    color: Colors.neutral.white,
    fontWeight: Typography.fontWeight.medium,
  },
  documentUpload: {
    marginBottom: Spacing.l,
  },
  uploadButton: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 2,
    borderColor: Colors.ui.inputBorder,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.medium,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonError: {
    borderColor: Colors.semantic.error,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    borderColor: Colors.neutral.mist,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.medium,
  },
  uploadText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    marginTop: Spacing.s,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.accent + '10',
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.l,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.charcoal,
    marginLeft: Spacing.s,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  priceLabel: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
  },
  priceInput: {
    width: 80,
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.ui.inputBorder,
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.s,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    textAlign: 'center',
  },
  priceCurrency: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    marginLeft: Spacing.s,
    width: 60,
  },
  // Styles pour le récapitulatif compact
  compactSummaryCard: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.m,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
  },
  compactSummaryTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  compactSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.s,
  },
  compactSummaryCol: {
    flex: 1,
  },
  compactSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  compactSummaryLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.iron,
  },
  compactSummaryValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 2,
  },
  compactSummarySuccess: {
    fontSize: Typography.fontSize.caption,
    color: Colors.semantic.success.default,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: 'auto',
  },
  compactSummaryDivider: {
    height: 1,
    backgroundColor: Colors.neutral.pearl,
    marginVertical: Spacing.s,
  },
  // Styles pour le bloc des conditions amélioré
  termsCard: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
    borderRadius: BorderRadius.medium,
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },
  termsCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsMainText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.xs,
  },
  termsSubText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.iron,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary.accent,
    fontWeight: Typography.fontWeight.medium,
    textDecorationLine: 'underline',
  },
  // Message d'info simple
  infoMessage: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.s,
    borderWidth: 1,
    borderColor: Colors.neutral.pearl,
  },
  infoMessageText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.charcoal,
    lineHeight: 20,
  },
  infoMessageHighlight: {
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary.accent,
  },
  summaryValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    fontWeight: Typography.fontWeight.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.neutral.course,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  feeInfo: {
    backgroundColor: Colors.primary.accent + '10',
    padding: Spacing.l,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: Spacing.l,
  },
  feeTitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.s,
  },
  feeAmount: {
    fontSize: Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.accent,
    marginBottom: Spacing.s,
  },
  feeDescription: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.iron,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Styles FAB étendu (continuer)
  fabExtended: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: Colors.neutral.charcoal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    minWidth: 120,
  },
  fabExtendedText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  // Styles FAB rond (soumettre)
  fab: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: Colors.semantic.success.default,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: Colors.semantic.success.default,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    minWidth: 100,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  detectedStatus: {
    fontSize: Typography.fontSize.caption,
    color: Colors.semantic.success,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  siretError: {
    fontSize: Typography.fontSize.caption,
    color: Colors.semantic.error,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
