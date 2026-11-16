import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Politique de confidentialité · IAChain" };

export default function ConfidentialitePage() {
  return (
    <LegalPage
      titre="Politique de confidentialité"
      miseAJour="16 novembre 2026"
      intro="IAChain est une plateforme d'agents IA pour les processus métier, éditée par SOCYTAY SARL (Maroc). Cette page explique quelles données personnelles nous traitons, pourquoi, et quels sont vos droits."
      autre={{ href: "/conditions", label: "Conditions d'utilisation" }}
      sections={[
        {
          titre: "1. Responsable du traitement",
          paragraphes: [
            "Le responsable du traitement est SOCYTAY SARL, éditeur d'IAChain. Pour toute question relative à vos données : contact@socytay.ma.",
          ],
        },
        {
          titre: "2. Données que nous traitons",
          paragraphes: [
            "Données de compte : nom, adresse e-mail et photo de profil, obtenus lors de votre inscription ou de votre connexion avec Google ou par e-mail.",
            "Données d'organisation : nom de votre organisation, rôles des membres, paramètres et préférences.",
            "Contenus que vous confiez à la plateforme : documents, e-mails, demandes et informations métier que vous saisissez ou que vous choisissez de connecter, ainsi que les résultats produits par les agents.",
            "Données de fonctionnement : journaux d'activité, approbations, historique d'exécution des agents, données de facturation de votre abonnement.",
          ],
        },
        {
          titre: "3. Finalités",
          paragraphes: [
            "Nous utilisons ces données pour créer et sécuriser votre compte, fournir les fonctionnalités d'IAChain, assurer le support, facturer l'abonnement et améliorer la fiabilité du service. Nous ne vendons pas vos données et nous ne les utilisons pas pour de la publicité.",
          ],
        },
        {
          titre: "4. Données Google et connexion de messagerie",
          paragraphes: [
            "Si vous vous connectez avec Google, nous recevons uniquement votre nom, votre adresse e-mail et votre photo de profil.",
            "Si vous connectez volontairement une boîte Gmail à IAChain, l'accès sert exclusivement à fournir la fonctionnalité que vous avez activée (lecture et préparation de réponses). Ces données ne sont ni vendues, ni transférées à des tiers à des fins publicitaires, ni utilisées pour entraîner des modèles d'IA. L'utilisation par IAChain des informations reçues des API Google respecte la politique de Google sur les données des utilisateurs des services API, y compris ses exigences d'utilisation limitée. Vous pouvez retirer cet accès à tout moment depuis IAChain ou depuis votre compte Google.",
          ],
        },
        {
          titre: "5. Prestataires et transferts",
          paragraphes: [
            "Pour fournir le service, nous faisons appel à des prestataires techniques : Vercel (hébergement de l'application), Neon (base de données), Clerk (authentification), Anthropic (traitement par des modèles d'IA) et un moteur de recherche web pour les fonctions de veille. Ces prestataires traitent les données pour notre compte et selon nos instructions. Certaines données peuvent donc être traitées hors du Maroc.",
          ],
        },
        {
          titre: "6. Conservation",
          paragraphes: [
            "Vos données sont conservées pendant la durée de votre abonnement, puis supprimées ou anonymisées dans un délai raisonnable après sa fin, sauf obligation légale de conservation (notamment comptable et fiscale).",
          ],
        },
        {
          titre: "7. Sécurité",
          paragraphes: [
            "Les données de chaque organisation sont isolées des autres. L'accès est protégé par une authentification et par des rôles. Nous appliquons des mesures techniques et organisationnelles raisonnables pour protéger vos données, sans pouvoir garantir une sécurité absolue.",
          ],
        },
        {
          titre: "8. Cookies",
          paragraphes: [
            "IAChain utilise uniquement les cookies nécessaires au fonctionnement du service, notamment pour maintenir votre session connectée. Nous n'utilisons pas de cookies publicitaires.",
          ],
        },
        {
          titre: "9. Vos droits",
          paragraphes: [
            "Conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et d'opposition, ainsi que d'un droit de demander la suppression de vos données. Pour les exercer, écrivez à contact@socytay.ma. Vous pouvez aussi vous adresser à la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP).",
          ],
        },
        {
          titre: "10. Modifications",
          paragraphes: [
            "Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de cette page.",
          ],
        },
      ]}
    />
  );
}