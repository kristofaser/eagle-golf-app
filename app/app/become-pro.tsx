import React, { useState } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
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

const STEPS = [
  { id: 1, label: 'Infos', icon: 'business' },
  { id: 2, label: 'Documents', icon: 'document' },
  { id: 3, label: 'Vos tarifs', icon: 'pricetag' },
  { id: 4, label: 'Validation', icon: 'checkmark-circle' },
];

export default function BecomeProScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { profile, loading, isAmateur, isPro } = useUser();

  // État du stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingSiret, setIsValidatingSiret] = useState(false);
  const [siretValidationResult, setSiretValidationResult] = useState<any>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Animation pour la progression
  const progressAnimation = useSharedValue(0);

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
  });

  React.useEffect(() => {
    progressAnimation.value = withSpring((currentStep - 1) / (STEPS.length - 1), {
      damping: 15,
      stiffness: 100,
    });
  }, [currentStep]);

  const animatedProgressStyle = useAnimatedStyle(() => {
    const width = interpolate(progressAnimation.value, [0, 1], [0, 100], 'clamp');
    return {
      width: `${width}%`,
    };
  });

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
      const result = await imagePicker.showImagePicker();

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
        if (!formData.termsAccepted) {
          newErrors.terms = 'Vous devez accepter les conditions';
        }
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

      Alert.alert(
        'Demande Soumise avec Succès !',
        'Votre demande pour devenir professionnel a été envoyée à notre équipe de validation.\n\n⏱️ Délai de traitement : 24-48h\n📧 Vous recevrez une notification une fois validée.',
        [
          {
            text: 'Compris',
            onPress: () => router.push('/profile/pro-status'),
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

  // Rendu du stepper
  const renderStepper = () => (
    <View style={styles.stepper}>
      <View style={styles.stepperLine}>
        <View style={styles.stepperProgress}>
          <Animated.View style={[styles.stepperProgressFill, animatedProgressStyle]} />
        </View>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <View key={step.id} style={styles.step}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.activeStepCircle,
                  isCompleted && styles.completedStepCircle,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={20} color={Colors.neutral.white} />
                ) : (
                  <Text style={[styles.stepNumber, isActive && styles.activeStepNumber]}>
                    {step.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.activeStepLabel,
                  isCompleted && styles.completedStepLabel,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

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
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Informations professionnelles</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>SIRET</Text>
            <Text style={styles.summaryValue}>{formData.siret}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Statut</Text>
            <Text style={styles.summaryValue}>{formData.companyStatus}</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryItemLast]}>
            <Text style={styles.summaryLabel}>Téléphone</Text>
            <Text style={styles.summaryValue}>{formData.phoneNumber}</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Documents</Text>
          <View style={[styles.summaryItem, styles.summaryItemLast]}>
            <Text style={styles.summaryLabel}>Pièce d'identité</Text>
            <Text style={styles.summaryValue}>✅ Téléchargée</Text>
          </View>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Vos tarifs</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>9 trous (1 joueur)</Text>
            <Text style={styles.summaryValue}>{formData.price9Holes1Player}€</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryItemLast]}>
            <Text style={styles.summaryLabel}>18 trous (1 joueur)</Text>
            <Text style={styles.summaryValue}>{formData.price18Holes1Player}€</Text>
          </View>
        </View>
      </ScrollView>
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
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Devenir Professionnel',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.neutral.charcoal} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {renderStepper()}

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {renderStepContent()}
          </ScrollView>

          {/* Bloc conditions sticky - seulement pour étape 4 */}
          {currentStep === 4 && (
            <View style={styles.stickyTermsContainer}>
              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })}
              >
                <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
                  {formData.termsAccepted && (
                    <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                  )}
                </View>
                <Text style={styles.termsText}>
                  J'accepte les conditions générales d'utilisation et la politique de
                  confidentialité
                </Text>
              </TouchableOpacity>
              {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.previousButton]}
              onPress={handlePrevious}
              disabled={currentStep === 1}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.neutral.iron} />
              <Text style={styles.previousButtonText}>Retour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, styles.nextButton]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === STEPS.length ? 'Soumettre' : 'Continuer'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.neutral.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  keyboardView: {
    flex: 1,
  },
  stepper: {
    backgroundColor: Colors.neutral.white,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
  },
  stepperLine: {
    position: 'absolute',
    top: 50,
    left: 60,
    right: 60,
    height: 2,
    backgroundColor: Colors.neutral.mist,
  },
  stepperProgress: {
    height: 2,
    backgroundColor: Colors.neutral.mist,
  },
  stepperProgressFill: {
    height: 2,
    backgroundColor: Colors.primary.accent,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  step: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.mist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  activeStepCircle: {
    backgroundColor: Colors.primary.accent,
  },
  completedStepCircle: {
    backgroundColor: Colors.semantic.success,
  },
  stepNumber: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    fontWeight: Typography.fontWeight.bold,
  },
  activeStepNumber: {
    color: Colors.neutral.white,
  },
  stepLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.neutral.iron,
  },
  activeStepLabel: {
    color: Colors.primary.accent,
    fontWeight: Typography.fontWeight.medium,
  },
  completedStepLabel: {
    color: Colors.semantic.success,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
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
  summarySection: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.m,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.m,
    ...Elevation.small,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.charcoal,
    marginBottom: Spacing.m,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.inputBorder,
  },
  summaryItemLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
  },
  summaryValue: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    fontWeight: Typography.fontWeight.medium,
  },
  stickyTermsContainer: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.l,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.s,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.s,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.ui.inputBorder,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.m,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.charcoal,
    lineHeight: 20,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.inputBorder,
    ...Elevation.small,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.medium,
    gap: Spacing.s,
  },
  previousButton: {
    backgroundColor: Colors.neutral.ball,
  },
  previousButtonText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.iron,
    fontWeight: Typography.fontWeight.medium,
  },
  nextButton: {
    backgroundColor: Colors.primary.accent,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.body,
    color: Colors.neutral.white,
    fontWeight: Typography.fontWeight.bold,
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
