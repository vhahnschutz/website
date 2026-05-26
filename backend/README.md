# Backend API

## Lancement

```powershell
cd backend
..\env\Scripts\python.exe manage.py migrate
..\env\Scripts\python.exe manage.py runserver
```

## Créer le compte admin

Le compte est créé manuellement en ligne de commande. Le mot de passe est hashé par Django et validé avec les règles de sécurité configurées.

```powershell
cd backend
..\env\Scripts\python.exe manage.py create_admin --username admin --email admin@example.com
```

## Authentification

```http
POST /api/auth/login/
Content-Type: application/json

{"username": "admin", "password": "..."}
```

La réponse contient un token à envoyer ensuite dans les requêtes admin :

```http
Authorization: Bearer <token>
```

Le token est renouvelé à chaque connexion et expire par défaut après 12 heures. Cette durée peut être changée avec la variable d'environnement `API_TOKEN_TTL_HOURS`.

## Routes principales

- `GET /api/sales/` : liste publique des ventes.
- `POST /api/sales/` : création admin, en `multipart/form-data` pour envoyer `photo`.
- `PATCH /api/sales/{id}/` : modification admin.
- `DELETE /api/sales/{id}/` : suppression admin.
- `POST /api/contact/` : envoie le formulaire de contact par email.
- `GET /api/appointments/` : liste admin des rendez-vous.
- `POST /api/appointments/` : création admin.
- `GET /api/appointments/availability/` : liste publique des créneaux déjà demandés ou confirmés, sans données client.
- `POST /api/appointments/request/` : demande publique de rendez-vous, créée en attente.
- `POST /api/appointments/{id}/validate/` : valide un rendez-vous.
- `POST /api/appointments/{id}/cancel/` : annule un rendez-vous.
- `DELETE /api/appointments/{id}/` : supprime un rendez-vous.

## Email

Par défaut en développement, les emails sont affichés dans la console du backend. Pour envoyer réellement les messages, configurez un SMTP avec des variables d'environnement :

```powershell
$env:EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"
$env:EMAIL_HOST="smtp.gmail.com"
$env:EMAIL_PORT="587"
$env:EMAIL_USE_TLS="True"
$env:EMAIL_HOST_USER="votre.compte@gmail.com"
$env:EMAIL_HOST_PASSWORD="mot_de_passe_application"
$env:DEFAULT_FROM_EMAIL="votre.compte@gmail.com"
$env:CONTACT_RECIPIENT_EMAIL="Rcservices68320@gmail.com"
```
