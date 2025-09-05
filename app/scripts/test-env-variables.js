#!/usr/bin/env node

/**
 * Test des variables d'environnement pour l'API INSEE
 */

console.log('🧪 TEST VARIABLES D\'ENVIRONNEMENT INSEE');
console.log('=' .repeat(50));

console.log('\n📋 Variables d\'environnement détectées :');
console.log('INSEE_API_TOKEN:', process.env.INSEE_API_TOKEN ? 'DISPONIBLE' : 'MANQUANT');
console.log('EXPO_PUBLIC_INSEE_API_TOKEN:', process.env.EXPO_PUBLIC_INSEE_API_TOKEN ? 'DISPONIBLE' : 'MANQUANT');

if (process.env.INSEE_API_TOKEN) {
  console.log('Token value (8 premiers caractères):', process.env.INSEE_API_TOKEN.substring(0, 8) + '...');
}

if (process.env.EXPO_PUBLIC_INSEE_API_TOKEN) {
  console.log('Expo token value (8 premiers caractères):', process.env.EXPO_PUBLIC_INSEE_API_TOKEN.substring(0, 8) + '...');
}

console.log('\n🔍 Test d\'accès comme dans le service :');

class TestService {
  constructor() {
    this.API_TOKEN = process.env.EXPO_PUBLIC_INSEE_API_TOKEN;
  }
  
  checkToken() {
    console.log('Token accessible dans le service:', this.API_TOKEN ? 'OUI' : 'NON');
    if (this.API_TOKEN) {
      console.log('Token length:', this.API_TOKEN.length);
      console.log('Token format OK:', /^[a-f0-9-]{36}$/.test(this.API_TOKEN) ? 'OUI' : 'NON');
    }
  }
}

const service = new TestService();
service.checkToken();

console.log('\n✅ Test terminé !');
console.log('\n💡 Note : Si EXPO_PUBLIC_INSEE_API_TOKEN est manquant,');
console.log('   redémarre le serveur Expo après avoir modifié .env.local');