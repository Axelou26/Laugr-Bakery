# Configuration PayPal

Pour activer le paiement PayPal sur Cookie Shop :

## 1. Créer un compte développeur PayPal

1. Va sur [developer.paypal.com](https://developer.paypal.com)
2. Connecte-toi avec ton compte PayPal (ou crée-en un)
3. Va dans **Dashboard** → **My Apps & Credentials**

## 2. Créer une application Sandbox

1. Clique sur **Create App**
2. Donne un nom (ex: "Cookie Shop")
3. Tu obtiendras un **Client ID** et un **Secret**

## 3. Configurer le backend

Démarre le backend avec les variables d'environnement :

**Windows (PowerShell) :**
```powershell
$env:PAYPAL_CLIENT_ID="ton_client_id"
$env:PAYPAL_CLIENT_SECRET="ton_secret"
.\mvnw spring-boot:run
```

**Ou dans `application.yml` (à ne pas commiter !) :**
```yaml
paypal:
  client-id: ton_client_id
  client-secret: ton_secret
  mode: sandbox
```

## 4. Tester

- En **sandbox**, utilise les comptes de test PayPal (créés dans le dashboard)
- Le bouton PayPal apparaîtra au checkout uniquement si les identifiants sont configurés
- Sans configuration : seul le paiement à la livraison est disponible

## 5. Production

Pour la production :
- Passe `mode: live` et utilise les identifiants Live
- Les paiements seront réels
