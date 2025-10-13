# UrbanMoveMS

**Titre du projet :**  
Conception et Développement d'un Système de Gestion basé sur une Architecture Microservices pour une Entreprise de Transport Urbain

**Encadré par :**  
Pr. Mahmoud Nassar

---

## 📌 Description du projet

UrbanMoveMS est une plateforme de gestion d’un réseau de transport urbain, conçue selon une architecture **microservices**. Le système vise à gérer efficacement les utilisateurs, les trajets, la billetterie, les abonnements, la géolocalisation des bus et les notifications, le tout centralisé via une **API Gateway**.

---

## 🧩 Répartition des services et des tâches

| Service                                      | Responsable |
|---------------------------------------------|-------------|
| 🔐 Service de gestion des utilisateurs       | Imane       |
| 🎟️ Service d’achat de tickets               | Chaymae     |
| 🕒 Service de gestion des trajets et horaires| Saad        |
| 🗺️ Service de géolocalisation des bus       | Chadi       |
| 📄 Service de gestion des abonnements        | Imane       |
| 🔀 API Gateway                               | Chaymae     |
| 🔔 Service de notifications                  | Saad        |

---

## 🛠️ Technologies proposées

- **Backend :** Node.js / Spring Boot (au choix par microservice)
- **Base de données :** PostgreSQL / MongoDB
- **Communication inter-services :** REST / RabbitMQ (selon besoin)
- **API Gateway :** Express Gateway / Spring Cloud Gateway
- **Sécurité :** JWT, OAuth2
- **Conteneurisation :** Docker
- **Orchestration :** Docker Compose / Kubernetes (optionnel)


<img width="2494" height="788" alt="image" src="https://github.com/user-attachments/assets/feda04ac-6f93-4397-abfd-5d7745bfbc44" />


---

## 📦 Architecture générale (Microservices)

Chaque service est développé de manière indépendante avec sa propre base de données, et communique via des APIs REST, centralisées par une API Gateway.

